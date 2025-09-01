import {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} from "discord.js";
import {
    FormatDate,
    getGroupName,
    getAlbumName,
    getAllMusicTitles,
    importantBonus,
    processOverlapBonus,
} from "../helpers/index.js";

export const favBonusMessage = async (messageContext, bonus, filtered) => {
    if (!bonus || bonus.length === 0) {
        if (messageContext.slashCommand) {
            await messageContext.message.editReply({
                content: "❌ No favorite bonuses found!",
                embeds: [],
            });
            return;
        } else {
            messageContext.message.channel.send(
                "❌ No favorite bonuses found!"
            );
            return;
        }
    }

    const formatDate = new FormatDate();

    const processedBonus = processOverlapBonus(bonus).sort(
        (a, b) =>
            formatDate.getDaysUntil(a.bonusFrom) -
            formatDate.getDaysUntil(b.bonusFrom)
    );

    const bonusLines = processedBonus.map((b) => {
        const daysLeft = formatDate.getDaysRemaining(b.bonusTo);
        const daysUntil = formatDate.getDaysUntil(b.bonusFrom);
        const important = importantBonus(
            b.group,
            b.bonus,
            b.type,
            formatDate.parseDate(b.bonusFrom)
        );
        let status = "";
        if (daysUntil > 0) {
            status = `🕒 **Starting in ${daysUntil} day${
                daysUntil === 1 ? "" : "s"
            }**`;
        } else if (daysLeft === 0) {
            status = "🚨 **Ending soon!**";
        } else if (daysLeft < 0) {
            status = "❌";
        } else {
            status = `⏳ **${daysLeft} day${daysLeft === 1 ? "" : "s"} left**`;
        }

        let line = "\n";
        const formattedDate = `${formatDate.formatMonthDay(
            b.bonusFrom
        )} → ${formatDate.formatMonthDay(b.bonusTo)}`;

        if (daysLeft < 0) {
            line += `${status} ${getGroupName(b.group)} [${b.bonus}%]  《${
                b.type === "birthday + album"
                    ? `${b.artist} x ${getAlbumName(b.group, b.album)}`
                    : b.type === "album"
                    ? `${getAlbumName(b.group, b.album)}`
                    : `${b.artist}`
            }》 | ${formattedDate}`;
            if (b.type === "album" && b.album) {
                const titles = getAllMusicTitles(b.group, b.album);
                if (titles.length > 0) {
                    line +=
                        "\n" +
                        titles
                            .map(
                                (t, idx) =>
                                    `   ${
                                        idx === titles.length - 1 ? "┗ " : "┣ "
                                    }  ~~${t}~~`
                            )
                            .join("\n");
                }
            }
        } else {
            line += `${status} | ${formattedDate}`;
            line +=
                `\n🏷️ ${getGroupName(b.group)} [${b.bonus}%] ` +
                (b.bonus === 5 ? `🎂 x 💿` : b.bonus === 3 ? `💿` : `🎂`) +
                ` 《${
                    b.type === "birthday + album"
                        ? `${b.artist} x ${getAlbumName(b.group, b.album)}`
                        : b.type === "album"
                        ? `${getAlbumName(b.group, b.album)}`
                        : `${b.artist}`
                }》`;
            if (b.type === "album" && b.album) {
                const titles = getAllMusicTitles(b.group, b.album);
                if (titles.length > 0) {
                    line +=
                        "\n" +
                        titles
                            .map(
                                (t, idx) =>
                                    `   ${
                                        idx === titles.length - 1 ? "┗ " : "┣ "
                                    } ${important ? "💎" : "🎶"} ${t}`
                            )
                            .join("\n");
                }
            }
        }

        return line;
    });

    if (!messageContext.slashCommand) {
        let textLength = 0;
        let sendText = "";
        for (let i = 0; i < bonusLines.length; i++) {
            const line = bonusLines[i];
            if (i === 0) {
                sendText += "🌟 Your Favorite Bonuses 🌟\n";
                textLength += "🌟 Your Favorite Bonuses 🌟\n".length;
            } else {
                sendText += "\n";
                textLength += 1;
            }
            if (textLength + line.length + 1 < 2000) {
                sendText += line;
                textLength += line.length;
            } else {
                messageContext.message.channel.send(sendText);
                sendText = line;
                textLength = line.length;
            }
        }
        if (sendText) {
            messageContext.message.channel.send("-" + sendText);
        }
        return;
    } else {
        const interaction = messageContext.message;

        // Pagination logic
        const LINES_PER_PAGE = 5;
        const pages = [];
        for (let i = 0; i < bonusLines.length; i += LINES_PER_PAGE) {
            pages.push(bonusLines.slice(i, i + LINES_PER_PAGE));
        }
        let currentPage = 0;

        const createEmbed = () => {
            const embed = new EmbedBuilder()
                .setColor("#f7b731")
                .setTitle("🌟 Your Favorite Bonuses 🌟")
                .setFooter({
                    text: `Page ${currentPage + 1} of ${
                        pages.length
                    } | Total bonus sets: ${bonus.length}`,
                });
            if (filtered) {
                embed.setDescription(`${pages[currentPage].join("\n")}`);
            } else {
                embed.setDescription(
                    `You have no favorite artists set, so here are all available bonuses:\n${pages[
                        currentPage
                    ].join("\n")}`
                );
            }
            return embed;
        };

        // Create buttons
        const previousButton = new ButtonBuilder()
            .setCustomId("favbonus_previous")
            .setLabel("⬅️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0);

        const nextButton = new ButtonBuilder()
            .setCustomId("favbonus_next")
            .setLabel("➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === pages.length - 1);

        const row = new ActionRowBuilder().addComponents(
            previousButton,
            nextButton
        );

        // Send initial embed with buttons
        const msg = await interaction.editReply({
            embeds: [createEmbed()],
            components: [row],
            content: null,
        });

        // Create button collector
        const collector = msg.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 60000,
        });

        collector.on("collect", async (btnInteraction) => {
            if (
                btnInteraction.customId === "favbonus_next" &&
                currentPage < pages.length - 1
            ) {
                currentPage++;
            } else if (
                btnInteraction.customId === "favbonus_previous" &&
                currentPage > 0
            ) {
                currentPage--;
            }
            // Update buttons state
            previousButton.setDisabled(currentPage === 0);
            nextButton.setDisabled(currentPage === pages.length - 1);
            await btnInteraction.update({
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
            msg.edit({ components: [] }).catch(() => {});
        });
        return;
    }
};
