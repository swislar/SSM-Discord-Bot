import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import path from "path";
import { artistMappings, musicNameMappings } from "../maps/index.js";
import {
    getWorldRecordRanking,
    getArtistEmblem,
    getAlbumCover,
} from "../helpers/index.js";
import { wrEmbed } from "../embeds/index.js";
import { resizeThumbnail, resizeAuthorImage } from "../util/index.js";

export const interactiveWorldRecordRanking = async (interaction) => {
    const artistRaw = interaction.options.getString("artist");
    const songTitleRaw = interaction.options.getString("title");

    const artistOriginal = artistRaw.toLowerCase();
    const titleOriginal = songTitleRaw.toLowerCase();

    const artist = artistMappings[artistOriginal] ?? artistOriginal;
    const songTitle = musicNameMappings[artist][titleOriginal] ?? titleOriginal;

    await interaction.deferReply({ ephemeral: false });

    try {
        const { ranking, albumKey, musicTitle, artistName } =
            await getWorldRecordRanking(artist, songTitle);

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
