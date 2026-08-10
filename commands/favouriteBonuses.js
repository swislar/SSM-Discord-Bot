import { getBonus } from "../helpers/index.js";
import { userBonusFav } from "../data/index.js";
import { favBonusMessage } from "../messages/index.js";

export const favouriteBonuses = async (message, favourite, offsetDays = 0) => {
    const userId = message.author.id;
    const bonus = getBonus(offsetDays);
    const groups = userBonusFav[userId] ?? [];

    if (!favourite || !Array.isArray(groups) || groups.length === 0) {
        favBonusMessage(
            { slashCommand: false, message: message },
            bonus,
            false
        );
        return;
    }

    const filteredBonus = bonus.filter((b) => groups.includes(b.group));

    if (filteredBonus.length === 0) {
        message.channel.send("No bonuses found for your favorite artists.");
        return;
    }

    favBonusMessage(
        { slashCommand: false, message: message },
        filteredBonus,
        true
    );
    return;
};
