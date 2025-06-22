import {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} from "discord.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import { getCache, setCache } from "../rankingCache.js";
import { musicMappings, emblemMappings } from "../maps/index.js";
const CACHE_DURATION = 5 * 60 * 1000;

function capitalizeFirstLetter(string) {
    if (!string || typeof string !== "string") {
        return ""; // Handle null, undefined, or non-string inputs
    }
    if (string.length === 0) {
        return ""; // Handle empty string
    }
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const getWorldRecordRanking = async (group, title) => {
    const cacheKey = `${group}:${title}`;
    const now = Date.now();
    const cacheEntry = getCache(cacheKey);

    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION) {
        console.log(`Serving from CACHE: ${cacheKey}`);
        return cacheEntry.response; // Return the cached data
    }

    try {
        const wrEndPoint = process.env.WR_ENDPOINT;
        const musicId = musicMappings[group]?.[title];

        if (!musicId) {
            throw new Error(
                `No music ID found for group: ${group}, title: ${title}`
            );
        }

        const response = await axios.get(
            `${wrEndPoint}${musicId}/latest.json?t=${now}`
        );
        const jsonRanking = response.data;

        // Format the response
        const formattedRanking = jsonRanking
            // .sort((a, b) => a.rank - b.rank) // Sort by rank
            .map((user) => ({
                rank: user.rank,
                name: user.nickname,
                score: user.highscore.toLocaleString(),
                time: new Date(user.updatedAt).toLocaleString("ko-KR", {
                    year: "2-digit",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                }),
            }));

        // Update the cache with the new response and timestamp
        setCache(cacheKey, {
            timestamp: now,
            response: formattedRanking,
        });

        return formattedRanking;
    } catch (error) {
        console.error("Error fetching world record ranking:", error.message);
        throw error;
    }
};

const getArtistEmblem = async (group) => {
    const emblemEndPoint = process.env.EMBLEM_ENDPOINT;
    const emblemPath = emblemMappings[group.toLowerCase()];

    if (!emblemPath) {
        console.log(`Emblem not found for ${group}`);
    }

    // Use the new naming convention: {artist}.png
    const filename = `${group.toLowerCase()}.png`;
    const localPath = path.join(process.cwd(), "emblems", filename);

    // Check if emblem already exists locally
    if (fs.existsSync(localPath)) {
        console.log(`Using cached emblem for ${group}: ${filename}`);
        return localPath;
    }

    // Download and cache the emblem
    try {
        console.log(`Downloading emblem for ${group}: ${emblemPath}`);
        const response = await axios.get(`${emblemEndPoint}${emblemPath}`, {
            responseType: "arraybuffer",
        });

        // Ensure emblems directory exists
        const emblemsDir = path.join(__dirname, "..", "emblems");
        if (!fs.existsSync(emblemsDir)) {
            fs.mkdirSync(emblemsDir, { recursive: true });
        }

        // Save the emblem to local storage with the new naming convention
        fs.writeFileSync(localPath, response.data);
        console.log(`Cached emblem for ${group}: ${filename}`);

        return localPath;
    } catch (error) {
        console.error(`Error downloading emblem for ${group}:`, error.message);
        throw new Error(`Failed to download emblem for ${group}`);
    }
};

export const worldRecordRanking = async (message, args) => {
    if (args.length < 2) {
        message.channel.send("Usage: !ranking <artist> <song_title>");
        return;
    }

    const artist = args[0];
    const songTitle = args.slice(1).join(" "); // Join remaining args as song title

    try {
        const ranking = await getWorldRecordRanking(artist, songTitle);

        if (!ranking || ranking.length === 0) {
            message.channel.send(
                `No ranking data found for ${songTitle} by ${artist}.`
            );
            return;
        }

        // Get emblem file for attachment
        let emblemPath = null;
        let files = [];
        try {
            emblemPath = await getArtistEmblem(artist);
            files.push({
                attachment: emblemPath,
                name: path.basename(emblemPath),
            });
        } catch (error) {
            console.error(
                `Error preparing emblem for ${artist}:`,
                error.message
            );
        }

        // Split rankings into pages of 10 entries each
        const pages = [];
        for (let i = 0; i < ranking.length; i += 10) {
            pages.push(ranking.slice(i, i + 10));
        }

        let currentPage = 0;

        // Function to create embed for current page
        const createEmbed = () => {
            const recordsToShow = pages[currentPage];
            const embed = new EmbedBuilder()
                // .setTitle(`${artist} - ${songTitle}\nLeaderboard`)
                .setAuthor({
                    name: `${capitalizeFirstLetter(
                        artist
                    )} - ${capitalizeFirstLetter(songTitle)}\nLeaderboard`,
                })
                .setColor("#0099ff");

            // Set the artist emblem if available
            if (emblemPath) {
                embed.setThumbnail(`attachment://${path.basename(emblemPath)}`);
            }

            const MAX_RANK_WIDTH = 4; // Adjust based on max rank digits
            const MAX_SCORE_WIDTH = 9; // Adjust based on max score digits
            const MAX_NAME_WIDTH = 20; // Adjust based on max name length

            let tableContent = [];

            if (recordsToShow.length === 0) {
                tableContent.push("No records found.");
            } else {
                recordsToShow.forEach((record, index) => {
                    const formattedTime = record.time
                        .replace(/\(CST\)/g, "")
                        .trim()
                        .replace(
                            /(\d{2})\. (\d{2})\. (\d{2})\. (오전|오후) (\d{2}:\d{2}:\d{2})/,
                            (match, day, month, year, period, time) => {
                                let [hours, minutes, seconds] = time.split(":");
                                if (period === "오후" && hours !== "12") {
                                    hours = String(Number(hours) + 12);
                                } else if (
                                    period === "오전" &&
                                    hours === "12"
                                ) {
                                    hours = "00";
                                }
                                return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
                            }
                        );

                    // First line: Rank, Name, and Score
                    tableContent.push(
                        `${String(record.rank).padStart(3)} ${String(
                            record.name
                        ).padEnd(15)}`
                    );

                    //Second line: Score
                    tableContent.push(`    ${String(record.score)}`);

                    // Third line: Time
                    tableContent.push(`    ${formattedTime}`);

                    // Add divider after each record (except the last one)
                    if (index < recordsToShow.length - 1) {
                        tableContent.push(`-----------------------`);
                    }
                });
            }

            // Join all lines and wrap in a code block
            const finalTable = "```\n" + tableContent.join("\n") + "\n```";

            // Set the description of your embed
            embed.setDescription(finalTable);

            embed.setFooter({
                text: `Page ${currentPage + 1} of ${pages.length}`,
            });
            return embed;
        };

        // Create buttons
        const previousButton = new ButtonBuilder()
            .setCustomId("previous")
            .setLabel("⬅️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0);

        const nextButton = new ButtonBuilder()
            .setCustomId("next")
            .setLabel("➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === pages.length - 1);

        const row = new ActionRowBuilder().addComponents(
            previousButton,
            nextButton
        );

        // Send initial message with buttons
        const msg = await message.channel.send({
            embeds: [createEmbed()],
            components: [row],
            files: files,
        });

        // Create button collector
        const collector = msg.createMessageComponentCollector({
            time: 60000,
        });

        collector.on("collect", async (interaction) => {
            if (
                interaction.customId === "next" &&
                currentPage < pages.length - 1
            ) {
                currentPage++;
            } else if (interaction.customId === "previous" && currentPage > 0) {
                currentPage--;
            }

            // Update buttons state
            previousButton.setDisabled(currentPage === 0);
            nextButton.setDisabled(currentPage === pages.length - 1);

            await interaction.update({
                embeds: [createEmbed()],
                components: [
                    new ActionRowBuilder().addComponents(
                        previousButton,
                        nextButton
                    ),
                ],
            });
        });

        collector.on("end", () => {
            msg.edit({ components: [] }).catch((error) =>
                console.error("Failed to remove buttons:", error)
            );
        });
    } catch (error) {
        console.error("Error getting ranking:", error);
        message.channel.send(
            `Sorry, I couldn't get the ranking for ${songTitle} by ${artist}. Make sure the song exists in the database.`
        );
    }
};
