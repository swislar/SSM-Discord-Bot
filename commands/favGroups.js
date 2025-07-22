import { userBonusFav } from "../data/index.js";
import { formatFavGroups } from "../helpers/index.js";

export const favGroups = async (interaction) => {
    const userId = interaction.user.id;
    const groups = userBonusFav[userId] ?? [];

    await interaction.deferReply({ ephemeral: false });

    if (!Array.isArray(groups) || groups.length === 0) {
        await interaction.editReply(
            "You have no favorite artists set. Use /addbonus to add some!"
        );
        return;
    } else {
        let result = "You have the following groups in your favourites list.";
        result += formatFavGroups(groups);
        await interaction.editReply(result);
        return;
    }
};
