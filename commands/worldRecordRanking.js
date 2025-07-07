import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import path from "path";
import { artistMappings, musicNameMappings } from "../maps/index.js";
import {
    getWorldRecordRanking,
    getArtistEmblem,
    getAlbumCover,
} from "../helpers/index.js";
import { resizeThumbnail, resizeAuthorImage } from "../util/index.js";
import { wrEmbed } from "../embeds/index.js";

export const worldRecordRanking = async (message, args) => {
    if (args.length < 3) {
        message.channel.send("Usage: `h!lb <artist> | <song_title>`");
        return;
    }

    const pipeIndex = args.findIndex((arg) => arg === "|");

    if (pipeIndex === -1) {
        message.channel.send("Usage: `h!lb <artist> | <song_title>`");
        return;
    }

    const artistRaw = args.slice(0, pipeIndex).join(" ").trim();
    const songTitleRaw = args
        .slice(pipeIndex + 1)
        .join(" ")
        .trim();

    if (!artistRaw || !songTitleRaw) {
        message.channel.send(
            "Please provide both an artist and a song title.\nUsage: `h!lb <artist> | <song_title>`"
        );
        return;
    }

    const artistOriginal = artistRaw.toLowerCase();
    const titleOriginal = songTitleRaw.toLowerCase();

    const artist = artistMappings[artistOriginal] ?? artistOriginal;
    const songTitle = musicNameMappings[artist][titleOriginal] ?? titleOriginal;

    try {
        const { ranking, albumKey, musicTitle, artistName } =
            await getWorldRecordRanking(artist, songTitle);

        if (!ranking || ranking.length === 0) {
            message.channel.send(
                `No ranking data found for ${songTitleRaw} by ${artistRaw}.`
            );
            return;
        }

        // Get emblem file for attachment
        let emblemPath = null;
        let albumCoverPath = null;

        // EMBLEM img
        try {
            const originalEmblemPath = await getArtistEmblem(artist);
            emblemPath = await resizeAuthorImage(originalEmblemPath);
        } catch (error) {
            console.error(
                `Error preparing emblem for ${artist}:`,
                error.message
            );
        }

        // ALBUM img
        try {
            const originalAlbumCover = await getAlbumCover(artist, albumKey);
            albumCoverPath = await resizeThumbnail(originalAlbumCover);
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
            embeds: [
                wrEmbed(
                    pages,
                    currentPage,
                    emblemPath,
                    albumCoverPath,
                    artistName,
                    musicTitle
                ),
            ],
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
                embeds: [
                    wrEmbed(
                        pages,
                        currentPage,
                        emblemPath,
                        albumCoverPath,
                        artistName,
                        musicTitle
                    ),
                ],
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
