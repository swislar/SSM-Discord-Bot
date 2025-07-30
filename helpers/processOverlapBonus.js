export const processOverlapBonus = (currentBonusesArray) => {
    const mergedBonus = [...currentBonusesArray];

    const birthdays = [];
    const albums = [];

    for (const bonus of currentBonusesArray) {
        if (bonus.type === "birthday") {
            birthdays.push(bonus);
        } else if (bonus.type === "album") {
            albums.push(bonus);
        }
    }

    birthdays.forEach((birthdayBonus) => {
        const birthdayGroup = birthdayBonus.group;
        const birthdayArtist = birthdayBonus.artist;
        const birthdayBonusStartDate = birthdayBonus.bonusFrom;
        const birthdayBonusEndDate = birthdayBonus.bonusTo;

        albums.forEach((albumBonus) => {
            const albumBonusStartDate = albumBonus.bonusFrom;
            const albumBonusEndDate = albumBonus.bonusTo;
            const albumGroup = albumBonus.group;

            const isSameGroup = birthdayGroup === albumGroup;
            const isWithinBirthdayBonusPeriod =
                albumBonusStartDate <= birthdayBonusEndDate &&
                albumBonusEndDate >= birthdayBonusStartDate;

            if (isSameGroup && isWithinBirthdayBonusPeriod) {
                const birthdayStartsFirst =
                    albumBonusStartDate >= birthdayBonusStartDate;
                const newBonus = birthdayStartsFirst
                    ? {
                          type: "birthday + album",
                          bonus: birthdayBonus.bonus + albumBonus.bonus,
                          bonusFrom: albumBonusStartDate,
                          bonusTo: birthdayBonusEndDate,
                          group: albumGroup,
                          artist: birthdayArtist,
                          album: albumBonus.album,
                      }
                    : {
                          type: "birthday + album",
                          bonus: birthdayBonus.bonus + albumBonus.bonus,
                          bonusFrom: birthdayBonusStartDate,
                          bonusTo: albumBonusEndDate,
                          group: albumGroup,
                          artist: birthdayArtist,
                          album: albumBonus.album,
                      };
                mergedBonus.push(newBonus);
            }
        });
    });

    return mergedBonus;
};
