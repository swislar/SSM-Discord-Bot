import { getBonus } from "../helpers/index.js";
import { userBonusFav } from "../data/index.js";

export const personalBonuses = async (interaction, userId) => {
    const bonus = getBonus();
    const groups = userBonusFav[userId] ?? [];

    await interaction.deferReply({ ephemeral: true });

    if (!Array.isArray(groups) || groups.length === 0) {
        await interaction.editReply(
            "You have no favorite artists set, so here are all available bonuses:\n" +
                bonus
                    .map(
                        (b) =>
                            `• ${b.bonusFrom} - ${b.bonusTo} | ${b.bonus}% | ${
                                b.group
                            } | ${b.type} | ${b.album || b.artist}`
                    )
                    .join("\n")
        );
        return;
    }

    if (filteredBonus.length === 0) {
        await interaction.editReply(
            "No bonuses found for your favorite artists."
        );
        return;
    }

    const bonusList = filteredBonus
        .map(
            (b) =>
                `• ${b.bonusFrom} - ${b.bonusTo} | ${b.bonus}% | ${b.group} | ${
                    b.type
                } | ${b.album || b.artist}`
        )
        .join("\n");

    await interaction.editReply(
        `Here are your personal bonuses:\n${bonusList}`
    );
};
