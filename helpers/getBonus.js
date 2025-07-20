import { bonusMap } from "../maps/index.js";

export const getBonus = () => {
    const today = new Date();

    const startDate = new Date(today);
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(today.getDate() - diffToMonday - 7);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 14);

    console.log(
        `Checking for bonuses between ${startDate.toDateString()} (Mon) and ${endDate.toDateString()} (Mon)`
    );

    const upcomingBonuses = [];
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    for (const groupName in bonusMap) {
        const entries = bonusMap[groupName];

        for (const bonusFromDateKey in entries) {
            const bonusDetails = entries[bonusFromDateKey];

            const [month, day] = bonusFromDateKey.split("-").map(Number);

            const bonusDateInStartYear = new Date(startYear, month - 1, day);
            let isMatch = false;

            if (
                bonusDateInStartYear >= startDate &&
                bonusDateInStartYear <= endDate
            ) {
                isMatch = true;
            }

            if (!isMatch && startYear !== endYear) {
                const bonusDateInEndYear = new Date(endYear, month - 1, day);
                if (
                    bonusDateInEndYear >= startDate &&
                    bonusDateInEndYear <= endDate
                ) {
                    isMatch = true;
                }
            }

            if (isMatch) {
                upcomingBonuses.push({
                    group: groupName,
                    bonusFrom: bonusFromDateKey,
                    ...bonusDetails,
                });
            }
        }
    }

    upcomingBonuses.sort((a, b) => {
        const dateA = new Date(`${startYear}-${a.bonusFrom}`);
        const dateB = new Date(`${endYear}-${b.bonusFrom}`);
        return dateA - dateB;
    });

    return upcomingBonuses;
};

// if (activeBonuses.length > 0) {
//     console.log("\nFound active bonuses:");
//     console.log(JSON.stringify(activeBonuses, null, 2));
// } else {
//     console.log("\nNo active bonuses found in the current window.");
// }
