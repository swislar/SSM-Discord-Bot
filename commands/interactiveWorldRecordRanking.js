import { artistMappings, musicNameMappings } from "../maps/index.js";
import {
    getWorldRecordRanking,
    getArtistEmblem,
    getAlbumCover,
} from "../helpers/index.js";
import { wrMessage } from "../messages/index.js";
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

        try {
            const artistEmblem = await getArtistEmblem(artist);
            emblemPath = await resizeAuthorImage(artistEmblem);
        } catch (error) {
            console.error(
                `Error preparing emblem for ${artist}:`,
                error.message
            );
        }

        try {
            const albumCover = await getAlbumCover(artist, albumKey);
            albumCoverPath = await resizeThumbnail(albumCover);
        } catch (error) {
            console.error(
                `Error preparing album cover for ${artist} - ${songTitle}:`,
                error.message
            );
        }

        wrMessage(
            { slashCommand: true, message: interaction },
            ranking,
            emblemPath,
            albumCoverPath,
            artistName,
            musicTitle
        );
    } catch (error) {
        console.error("Error getting ranking:", error);
        await interaction.editReply(
            `Sorry, I couldn't get the ranking for **${songTitleRaw}** by **${artistRaw}**. Make sure the song exists in the database.`
        );
    }
};
