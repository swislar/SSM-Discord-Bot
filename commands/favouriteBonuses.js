import { getBonus } from "../helpers/index.js";
import { userBonusFav } from "../data/index.js";
import { favBonusMessage } from "../messages/index.js";

export const favouriteBonuses = async (interaction, userId) => {
    const bonus = getBonus();
    const groups = userBonusFav[userId] ?? [];

    await interaction.deferReply({ ephemeral: false });

    if (!Array.isArray(groups) || groups.length === 0) {
        favBonusMessage(interaction, bonus);
        return;
    }

    const filteredBonus = bonus.filter((b) => b.group in groups);

    // if (filteredBonus.length === 0) {
    //     await interaction.editReply(
    //         "No bonuses found for your favorite artists."
    //     );
    //     return;
    // }

    favBonusMessage(interaction, filteredBonus);
    return;
};
