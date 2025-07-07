import { EmbedBuilder } from "discord.js";
import path from "path";

export const wrEmbed = (
    pages,
    currentPage,
    emblemPath,
    albumCoverPath,
    artistName,
    musicTitle
) => {
    const recordsToShow = pages[currentPage];
    const embed = new EmbedBuilder().setColor("#0099ff");

    if (emblemPath && artistName.length + musicTitle.length > 25) {
        embed.setAuthor({
            name: `${artistName}\n${musicTitle}\nLeaderboard`,
            iconURL: emblemPath
                ? `attachment://${path.basename(emblemPath)}`
                : undefined,
        });
    } else if (emblemPath) {
        embed.setAuthor({
            name: `${artistName} - ${musicTitle}\nLeaderboard`,
            iconURL: emblemPath
                ? `attachment://${path.basename(emblemPath)}`
                : undefined,
        });
    } else if (artistName.length + musicTitle.length > 25) {
        embed.setAuthor({
            name: `${artistName}\n${musicTitle}\nLeaderboard`,
        });
        console.log("Unable to set icon image.");
    } else {
        embed.setAuthor({
            name: `${artistName} - ${musicTitle}\nLeaderboard`,
        });
        console.log("Unable to set icon image.");
    }

    if (albumCoverPath) {
        embed.setThumbnail(
            albumCoverPath
                ? `attachment://${path.basename(albumCoverPath)}`
                : undefined
        );
    } else {
        console.log("Unable to set album image.");
    }

    let ranks = "";

    if (recordsToShow.length === 0) {
        tableContent.push("No records found.");
    } else {
        recordsToShow.forEach((record, index) => {
            if (
                record.cards * 15_000 + 6_313_000 + 6 * 15_000 <=
                record.score
            ) {
                const formattedTime = record.time
                    .replace(/\(CST\)/g, "")
                    .trim()
                    .replace(
                        /(\d{2})\. (\d{2})\. (\d{2})\. (오전|오후) (\d{2}:\d{2}:\d{2})/,
                        (match, day, month, year, period, time) => {
                            let [hours, minutes, seconds] = time.split(":");
                            if (period === "오후" && hours !== "12") {
                                hours = String(Number(hours) + 12);
                            } else if (period === "오전" && hours === "12") {
                                hours = "00";
                            }
                            return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
                        }
                    );
                ranks += `**${String(record.rank)}** | **${String(
                    record.score.toLocaleString()
                )}** | **${String(record.name)}**\n⏱️ ${formattedTime}\n`;
            } else {
                ranks += `${String(record.rank)} | ${String(
                    record.score.toLocaleString()
                )} | ${String(record.name)}\n`;
            }
        });
    }

    embed.setDescription(ranks);

    // Set the description of your embed
    // embed.setDescription(finalTable);

    embed.setFooter({
        text: `Page ${currentPage + 1} of ${pages.length}`,
    });
    return embed;
};
