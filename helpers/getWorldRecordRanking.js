import { musicMappings } from "../maps/index.js";
import axios from "axios";

export const getWorldRecordRanking = async (artist, title) => {
    const now = Date.now();
    const wrEndPoint = process.env.WR_ENDPOINT;
    const musicEntry = musicMappings[artist]?.[title];
    const musicTitle = typeof musicEntry === "object" ? musicEntry.title : null;
    const musicId = typeof musicEntry === "object" ? musicEntry.id : null;
    const albumKey = typeof musicEntry === "object" ? musicEntry.album : null;
    const artistName =
        typeof musicEntry === "object" ? musicEntry.artist : null;

    try {
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

        return {
            ranking: formattedRanking,
            albumKey: albumKey,
            musicTitle: musicTitle,
            artistName: artistName,
        };
    } catch (error) {
        console.error("Error fetching world record ranking:", error.message);
        throw error;
    }
};
