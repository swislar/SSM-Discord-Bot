import { getBonus } from "../helpers/index.js";
import { userBonusFav } from "../data/index.js";
import { favBonusMessage } from "../messages/index.js";

export const interactiveFavouriteBonuses = async (interaction, favourite) => {
    const userId = interaction.user.id;
    const bonus = getBonus();
    const groups = userBonusFav[userId] ?? [];

    await interaction.deferReply({ ephemeral: false });

    if (!favourite || !Array.isArray(groups) || groups.length === 0) {
        favBonusMessage(
            { slashCommand: true, message: interaction },
            bonus,
            false
        );
        return;
    }

    const filteredBonus = bonus.filter((b) => groups.includes(b.group));

    if (filteredBonus.length === 0) {
        await interaction.editReply(
            "No bonuses found for your favorite artists."
        );
        return;
    }

    favBonusMessage(
        { slashCommand: true, message: interaction },
        filteredBonus,
        true
    );
    return;
};
