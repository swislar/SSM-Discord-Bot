import fs from "fs/promises";
import path from "path";
import { artistMappings } from "../maps/index.js";

export const rmPersonalBonuses = async (interaction, userId) => {
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
        if (err.code !== "ENOENT") throw err;
    }

    if (!Array.isArray(data[userId]) || !data[userId].includes(artist)) {
        await interaction.editReply(
            `Artist \"${artist}\" is not in your favorites.`
        );
        return;
    }

    data[userId] = data[userId].filter((a) => a !== artist);
    if (data[userId].length === 0) {
        delete data[userId];
    }

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    await interaction.editReply(
        `Removed \"${artist}\" from your favorite artists.`
    );
};
