import {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} from "discord.js";
import path from "path";

export const wrMessage = async (
    messageContext,
    ranking,
    emblemPath,
    albumCoverPath,
    artistName,
    musicTitle
) => {
    const pages = [];
    for (let i = 0; i < ranking.length; i += 10) {
        pages.push(ranking.slice(i, i + 10));
    }

    let currentPage = 0;

    const createEmbed = () => {
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
            ranks = "No records found.";
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
                                } else if (
                                    period === "오전" &&
                                    hours === "12"
                                ) {
                                    hours = "00";
                                }
                                return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
                            }
                        );
                    ranks += `**${String(record.rank)}** | **${String(
                        record.score.toLocaleString()
                    )}** | **${String(record.name)}**\n`;
                    if (record.rank >= 1 && record.rank <= 3) {
                        ranks += `⏱️ ${formattedTime}\n`;
                    }
                } else {
                    ranks += `${String(record.rank)} | ${String(
                        record.score.toLocaleString()
                    )} | ${String(record.name)}\n`;
                }
            });
        }

        embed.setDescription(ranks);

        embed.setFooter({
            text: `Page ${currentPage + 1} of ${pages.length}`,
        });
        return embed;
    };

    // Create buttons
    const previousButton = new ButtonBuilder()
        .setCustomId("previous")
        .setLabel("⬅️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 0);

    const nextButton = new ButtonBuilder()
        .setCustomId("next")
        .setLabel("➡️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === pages.length - 1);

    const row = new ActionRowBuilder().addComponents(
        previousButton,
        nextButton
    );

    const messagePayload = {
        embeds: [createEmbed()],
        components: [row],
        files: [
            ...(emblemPath
                ? [
                      {
                          attachment: emblemPath,
                          name: path.basename(emblemPath),
                      },
                  ]
                : []),
            ...(albumCoverPath
                ? [
                      {
                          attachment: albumCoverPath,
                          name: path.basename(albumCoverPath),
                      },
                  ]
                : []),
        ],
    };

    let msg;

    if (messageContext.slashCommand) {
        msg = await messageContext.message.editReply(messagePayload);
    } else {
        msg = await messageContext.message.channel.send(messagePayload);
    }

    // Create button collector
    const collector = msg.createMessageComponentCollector({
        time: 60000,
    });

    collector.on("collect", async (interaction) => {
        console.log("Interaction clicked!");
        if (interaction.customId === "next" && currentPage < pages.length - 1) {
            currentPage++;
        } else if (interaction.customId === "previous" && currentPage > 0) {
            currentPage--;
        }

        // Update buttons state
        previousButton.setDisabled(currentPage === 0);
        nextButton.setDisabled(currentPage === pages.length - 1);

        await interaction.update({
            embeds: [createEmbed()],
            components: [
                new ActionRowBuilder().addComponents(
                    previousButton,
                    nextButton
                ),
            ],
        });
    });

    collector.on("end", () => {
        msg.edit({ components: [] }).catch((error) =>
            console.error("Failed to remove buttons:", error)
        );
    });
};
