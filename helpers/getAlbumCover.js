import { albumCoverMappings } from "../maps/index.js";
import { sanitizeFilename } from "../util/index.js";
import fs from "fs";
import axios from "axios";
import path from "path";

export const getAlbumCover = async (artist, album) => {
    const albumCoverEndPoint = process.env.ALBUM_COVER_ENDPOINT;
    const artistKey = artist.toLowerCase();
    const albumKey = album.toLowerCase();
    const coverPath = albumCoverMappings[artistKey]?.[albumKey];

    const filename = sanitizeFilename(`${artistKey}_${albumKey}.png`);
    const albumCoverDir = path.join(process.cwd(), "albumCover");
    const localPath = path.join(albumCoverDir, filename);
    if (fs.existsSync(localPath)) {
        console.log(`Using cached album cover for ${artistKey}: ${filename}`);
        return localPath;
    }

    if (!coverPath) {
        console.log(`No album cover found for ${artistKey} - ${albumKey}`);
        return null;
    }
    try {
        console.log(`Downloading album cover for ${artistKey}: ${coverPath}`);
        const response = await axios.get(`${albumCoverEndPoint}${coverPath}`, {
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
