import { artistMappings, musicNameMappings } from "../maps/index.js";
import {
    getWorldRecordRanking,
    getArtistEmblem,
    getAlbumCover,
} from "../helpers/index.js";
import { resizeThumbnail, resizeAuthorImage } from "../util/index.js";
import { wrMessage } from "../messages/index.js";

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

        wrMessage(
            { slashCommand: false, message: message },
            ranking,
            emblemPath,
            albumCoverPath,
            artistName,
            musicTitle
        );
    } catch (error) {
        console.error("Error getting ranking:", error);
        message.channel.send(
            `Sorry, I couldn't get the ranking for ${songTitle} by ${artist}. Make sure the song exists in the database.`
        );
    }
};
