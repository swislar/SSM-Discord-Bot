import fs from "fs/promises";
import path from "path";
import { artistMappings } from "../maps/index.js";

export const setPersonalBonuses = async (interaction, userId) => {
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

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");

    await interaction.editReply(
        `Added \"${artist}\" to your favorite artists!`
    );
};
