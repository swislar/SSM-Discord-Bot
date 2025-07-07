import { emblemMappings } from "../maps/index.js";
import { sanitizeFilename } from "../util/index.js";
import { fileURLToPath } from "url";
import axios from "axios";
import fs from "fs";
import path from "path";

export const getArtistEmblem = async (artist) => {
    const emblemEndPoint = process.env.EMBLEM_ENDPOINT;
    const emblemPath = emblemMappings[artist.toLowerCase()];

    if (!emblemPath) {
        console.log(`Emblem not found for ${artist}`);
    }

    const filename = `${sanitizeFilename(artist.toLowerCase())}.png`;
    const localPath = path.join(process.cwd(), "emblems", filename);
    if (fs.existsSync(localPath)) {
        console.log(`Using cached emblem for ${artist}: ${filename}`);
        return localPath;
    }

    try {
        console.log(`Downloading emblem for ${artist}: ${emblemPath}`);
        const response = await axios.get(`${emblemEndPoint}${emblemPath}`, {
            responseType: "arraybuffer",
        });

        // Ensure emblems directory exists
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        console.log("Filename:", __filename);
        console.log("Dirname:", __dirname);

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
