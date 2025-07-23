import fs from "fs/promises";
import path from "path";
import { artistMappings } from "../maps/index.js";
import { formatFavGroups, getGroupName } from "../helpers/index.js";

export const addFavGroup = async (interaction) => {
    const userId = interaction.user.id;
    const artistRaw = interaction.options.getString("artist");
    const artistOriginal = artistRaw.toLowerCase();
    const artist = artistMappings[artistOriginal] ?? artistOriginal;

    await interaction.deferReply({ ephemeral: true });

    const filePath = path.resolve(process.cwd(), "./data/userBonusFav.json");

    let data = {};
    try {
        const fileContent = await fs.readFile(filePath, "utf-8");
        data = fileContent === "" ? {} : JSON.parse(fileContent);
    } catch (err) {
        if (err.code !== "ENOENT") throw err; // Only ignore file-not-found
    }

    if (!Array.isArray(data[userId])) {
        data[userId] = [];
    }

    if (!data[userId].includes(artist)) {
        data[userId].push(artist);
        data[userId] = data[userId].sort();
    }

    await interaction.editReply(
        `Added **${getGroupName(
            artist
        )}** to your favorite artists!\nYou have the following groups in your favourites list. **[${
            data[userId].length
        }]**${formatFavGroups(data[userId])}`
    );

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
};
