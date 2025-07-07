import { musicMappings } from "../maps/index.js";
import { getCache, setCache } from "../rankingCache.js";
import axios from "axios";
const CACHE_DURATION = 5 * 60 * 1000;

export const getWorldRecordRanking = async (artist, title) => {
    const cacheKey = `${artist}:${title}`;
    const now = Date.now();
    const cacheEntry = getCache(cacheKey);
    const musicEntry = musicMappings[artist]?.[title];
    const albumKey = typeof musicEntry === "object" ? musicEntry.album : null;
    const musicTitle = typeof musicEntry === "object" ? musicEntry.title : null;
    const artistName =
        typeof musicEntry === "object" ? musicEntry.artist : null;

    if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION) {
        console.log(`Serving from CACHE: ${cacheKey}`);
        return {
            ranking: cacheEntry.response,
            albumKey: albumKey,
            musicTitle: musicTitle,
            artistName: artistName,
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
        const artistName =
            typeof musicEntry === "object" ? musicEntry.artist : null;

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
            artistName: artistName,
        };
    } catch (error) {
        console.error("Error fetching world record ranking:", error.message);
        throw error;
    }
};
