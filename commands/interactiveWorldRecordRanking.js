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
import {
    musicMappings,
    emblemMappings,
    albumCoverMappings,
    artistMappings,
} from "../maps/index.js";
import {
    capitalizeFirstLetter,
    resizeThumbnail,
    resizeAuthorImage,
    sanitizeFilename,
} from "../util/index.js";
import { fileURLToPath } from "url";
const CACHE_DURATION = 5 * 60 * 1000;

const getWorldRecordRanking = async (artist, title) => {
    const cacheKey = `${artist}:${title}`;
    const now = Date.now();
    const cacheEntry = getCache(cacheKey);
    const musicEntry = musicMappings[artist]?.[title];
    const albumKey = typeof musicEntry === "object" ? musicEntry.album : null;
    const musicTitle = typeof musicEntry === "object" ? musicEntry.title : null;

    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION) {
        console.log(`Serving from CACHE: ${cacheKey}`);
        return {
            ranking: cacheEntry.response,
            albumKey: albumKey,
            musicTitle: musicTitle,
        };
    }

    try {
        const wrEndPoint = process.env.WR_ENDPOINT;
        const musicEntry = musicMappings[artist]?.[title];
        const musicTitle =
            typeof musicEntry === "object" ? musicEntry.title : null;
        const musicId = typeof musicEntry === "object" ? musicEntry.id : null;
        const albumKey =
            typeof musicEntry === "object" ? musicEntry.album : null;

        if (!musicId) {
            throw new Error(
                `No music ID found for artist: ${artist}, title: ${title}`
            );
        }

        const response = await axios.get(
            `${wrEndPoint}${musicId}/latest.json?t=${now}`
        );
        const jsonRanking = response.data;

        const formattedRanking = jsonRanking.map((user) => ({
            rank: user.rank,
            name: user.nickname,
            score: user.highscore,
            cards: user.cards.length,
            time: new Date(user.updatedAt).toLocaleString("ko-KR", {
                year: "2-digit",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            }),
        }));

        setCache(cacheKey, {
            timestamp: now,
            response: formattedRanking,
        });

        return {
            ranking: formattedRanking,
            albumKey: albumKey,
            musicTitle: musicTitle,
        };
    } catch (error) {
        console.error("Error fetching world record ranking:", error.message);
        throw error;
    }
};

const getArtistEmblem = async (artist) => {
    const emblemEndPoint = process.env.EMBLEM_ENDPOINT;
    const emblemPath = emblemMappings[artist.toLowerCase()];

    if (!emblemPath) {
        console.log(`Emblem not found for ${artist}`);
    }

    const filename = sanitizeFilename(`${artist.toLowerCase()}.png`);
    const localPath = path.join(process.cwd(), "emblems", filename);
    if (fs.existsSync(localPath)) {
        console.log(`Using cached emblem for ${artist}: ${filename}`);
        return localPath;
    }

    // Download and cache the emblem

    try {
        console.log(`Downloading emblem for ${artist}: ${emblemPath}`);
        const response = await axios.get(`${emblemEndPoint}${emblemPath}`, {
            responseType: "arraybuffer",
        });

        // Ensure emblems directory exists
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const emblemsDir = path.join(__dirname, "..", "emblems");
        if (!fs.existsSync(emblemsDir)) {
            fs.mkdirSync(emblemsDir, { recursive: true });
        }

        fs.writeFileSync(localPath, response.data);
        console.log(`Cached emblem for ${artist}: ${filename}`);

        return localPath;
    } catch (error) {
        console.error(`Error downloading emblem for ${artist}:`, error.message);
        throw new Error(`Failed to download emblem for ${artist}`);
    }
};

const getAlbumCover = async (artist, album) => {
    const artistKey = artist.toLowerCase();
    const albumKey = album.toLowerCase();
    const coverUrl = albumCoverMappings[artistKey]?.[albumKey];
    if (!coverUrl) {
        console.log(`No album cover found for ${artistKey} - ${albumKey}`);
        return null;
    }
    const filename = sanitizeFilename(`${artistKey}_${albumKey}.png`);
    const albumCoverDir = path.join(process.cwd(), "albumCover");
    const localPath = path.join(albumCoverDir, filename);
    if (fs.existsSync(localPath)) {
        console.log(`Using cached album cover for ${artistKey}: ${filename}`);
        return localPath;
    }
    try {
        console.log(`Downloading album cover for ${artistKey}: ${coverUrl}`);
        const response = await axios.get(coverUrl, {
            responseType: "arraybuffer",
        });
        if (!fs.existsSync(albumCoverDir)) {
            fs.mkdirSync(albumCoverDir, { recursive: true });
        }
        fs.writeFileSync(localPath, response.data);
        console.log(`Cached album cover for ${artistKey}: ${filename}`);
        return localPath;
    } catch (error) {
        console.error(
            `Error downloading album cover for ${artistKey}:`,
            error.message
        );
        return null;
    }
};

export const interactiveWorldRecordRanking = async (interaction) => {
    const artistRaw = interaction.options.getString("artist");
    const songTitleRaw = interaction.options.getString("title");

    const artistOriginal = artistRaw.toLowerCase();
    const songTitle = songTitleRaw.toLowerCase();

    const artist = artistMappings[artistOriginal] ?? artistOriginal;

    await interaction.deferReply({ ephemeral: false });

    try {
        const { ranking, albumKey, musicTitle } = await getWorldRecordRanking(
            artist,
            songTitle
        );

        if (!ranking || ranking.length === 0) {
            await interaction.editReply(
                `No ranking data found for **${songTitleRaw}** by **${artistRaw}**.`
            );
            return;
        }

        let emblemPath = null;
        let albumCoverPath = null;
        // const artistEmblem = await getArtistEmblem(artist);
        // emblemPath = await resizeAuthorImage(artistEmblem);
        try {
            const artistEmblem = await getArtistEmblem(artist);
            emblemPath = await resizeAuthorImage(artistEmblem);
        } catch (error) {
            console.error(
                `Error preparing emblem for ${artist}:`,
                error.message
            );
        }

        // const albumCover = await getAlbumCover(artist, albumKey);
        // albumCoverPath = await resizeThumbnail(albumCover);
        try {
            const albumCover = await getAlbumCover(artist, albumKey);
            albumCoverPath = await resizeThumbnail(albumCover);
        } catch (error) {
            console.error(
                `Error preparing album cover for ${artist} - ${songTitle}:`,
                error.message
            );
        }

        // Split rankings into pages of 10 entries each
        const pages = [];
        for (let i = 0; i < ranking.length; i += 10) {
            pages.push(ranking.slice(i, i + 10));
        }

        let currentPage = 0;

        const createEmbed = () => {
            const recordsToShow = pages[currentPage];
            const embed = new EmbedBuilder().setColor("#0099ff");

            if (emblemPath) {
                embed.setAuthor({
                    name: `${capitalizeFirstLetter(
                        artist
                    )} - ${capitalizeFirstLetter(musicTitle)}\nLeaderboard`,
                    iconURL: emblemPath
                        ? `attachment://${path.basename(emblemPath)}`
                        : undefined,
                });
            } else {
                embed.setAuthor({
                    name: `${capitalizeFirstLetter(
                        artist
                    )} - ${capitalizeFirstLetter(musicTitle)}\nLeaderboard`,
                });
                console.log("Unable to set icon image.");
            }

            if (albumCoverPath) {
                embed.setThumbnail(
                    albumCoverPath
                        ? `attachment://${path.basename(albumCoverPath)}`
                        : undefined
                );
            } else {
                console.log("Unable to set album image.");
            }

            let ranks = "";

            if (recordsToShow.length === 0) {
                ranks = "No records found for this page.";
            } else {
                recordsToShow.forEach((record, index) => {
                    if (
                        record.cards * 15_000 + 6_313_000 + 6 * 15_000 <=
                        record.score
                    ) {
                        const formattedTime = record.time
                            .replace(/\(CST\)/g, "")
                            .trim()
                            .replace(
                                /(\d{2})\. (\d{2})\. (\d{2})\. (오전|오후) (\d{2}:\d{2}:\d{2})/,
                                (match, day, month, year, period, time) => {
                                    let [hours, minutes, seconds] =
                                        time.split(":");
                                    if (period === "오후" && hours !== "12") {
                                        hours = String(Number(hours) + 12);
                                    } else if (
                                        period === "오전" &&
                                        hours === "12"
                                    ) {
                                        hours = "00";
                                    }
                                    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
                                }
                            );
                        ranks += `**${String(record.rank)}** | **${String(
                            record.score.toLocaleString()
                        )}** | **${String(
                            record.name
                        )}**\n⏱️ ${formattedTime}\n`;
                    } else {
                        ranks += `${String(record.rank)} | ${String(
                            record.score.toLocaleString()
                        )} | ${String(record.name)}\n`;
                    }
                });
            }

            embed.setDescription(ranks);

            embed.setFooter({
                text: `Page ${currentPage + 1} of ${pages.length}`,
            });
            return embed;
        };

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

        const msg = await interaction.editReply({
            embeds: [createEmbed()],
            components: [row],
            files: [
                ...(emblemPath
                    ? [
                          {
                              attachment: emblemPath,
                              name: path.basename(emblemPath),
                          },
                      ]
                    : []),
                ...(albumCoverPath
                    ? [
                          {
                              attachment: albumCoverPath,
                              name: path.basename(albumCoverPath),
                          },
                      ]
                    : []),
            ],
        });

        const collector = msg.createMessageComponentCollector({
            time: 60000, // 60 seconds
        });

        collector.on("collect", async (btnInteraction) => {
            // Rename interaction to btnInteraction to avoid conflict
            if (
                btnInteraction.customId === "next" &&
                currentPage < pages.length - 1
            ) {
                currentPage++;
            } else if (
                btnInteraction.customId === "previous" &&
                currentPage > 0
            ) {
                currentPage--;
            }

            // Update buttons state
            previousButton.setDisabled(currentPage === 0);
            nextButton.setDisabled(currentPage === pages.length - 1);

            // Update the message with the new embed and button states
            await btnInteraction.update({
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
            // Remove buttons when collector ends (e.g., after 60 seconds)
            msg.edit({ components: [] }).catch((error) =>
                console.error("Failed to remove buttons:", error)
            );
        });
    } catch (error) {
        console.error("Error getting ranking:", error);
        await interaction.editReply(
            `Sorry, I couldn't get the ranking for **${songTitleRaw}** by **${artistRaw}**. Make sure the song exists in the database.`
        );
    }
};
