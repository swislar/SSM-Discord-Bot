import { bonusMappings } from "../maps/index.js";
import { FormatDate } from "./index.js";

export const importantBonus = (group, bonus, type, date) => {
    const formatDate = new FormatDate();

    if (type === "album") {
        const bonusMap = Object.values(bonusMappings[group]);
        return !bonusMap.some(
            (b) => b.bonus > bonus && formatDate.quarter(b.date) === date
        );
    } else if (type.includes("birthday")) {
        return false;
    }
    return true;
};
