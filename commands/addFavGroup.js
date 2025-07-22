import fs from "fs/promises";
import path from "path";
import { artistMappings } from "../maps/index.js";
import { formatFavGroups } from "../helpers/index.js";

export const addFavGroup = async (interaction) => {
    const userId = interaction.user.id;
    const artistRaw = interaction.options.getString("artist");
    const artistOriginal = artistRaw.toLowerCase();
    const artist = artistMappings[artistOriginal] ?? artistOriginal;

    await interaction.deferReply({ ephemeral: false });

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
    }

    await interaction.editReply(
        `Added \"${artist}\" to your favorite artists!\n\nYou have the following groups in your favourites list.${formatFavGroups(
            data[userId]
        )}`
    );

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
};
