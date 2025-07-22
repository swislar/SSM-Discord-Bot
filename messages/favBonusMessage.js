import {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} from "discord.js";
import { musicMappings, albumNameMappings } from "../maps/index.js";

export const favBonusMessage = async (interaction, bonus, filtered) => {
    if (!bonus || bonus.length === 0) {
        await interaction.editReply({
            content: "❌ No favorite bonuses found!",
            embeds: [],
        });
        return;
    }

    const today = new Date();
    const currentYear = today.getFullYear();

    function parseDate(monthDay, year = currentYear) {
        const [month, day] = monthDay.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    function getDaysRemaining(to) {
        // If bonusTo is before today, return negative
        let end = parseDate(to);
        // Handle year wrap (e.g. 12-29 to 01-04)
        if (end < today && today.getMonth() === 0 && end.getMonth() === 11) {
            end = parseDate(to, currentYear - 1);
        }
        const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
        return diff;
    }

    function getDaysUntil(dateStr) {
        let start = parseDate(dateStr);
        // Handle year wrap (e.g. 12-29 to 01-04)
        if (
            start < today &&
            today.getMonth() === 11 &&
            start.getMonth() === 0
        ) {
            start = parseDate(dateStr, currentYear + 1);
        }
        const diff = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
        return diff;
    }

    function getGroupName(group) {
        if (!musicMappings[group]) return [];
        return Object.values(musicMappings[group])[0].artist;
    }

    function getAlbumName(group, album) {
        return albumNameMappings[group][album] ?? album;
    }

    function getMusicTitles(group, album) {
        if (!musicMappings[group]) return [];
        return Object.values(musicMappings[group])
            .filter((track) => track.album === album)
            .map((track) => track.title);
    }

    function formatMonthDay(monthDay) {
        const [month, day] = monthDay.split("-").map(Number);
        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];
        return `${monthNames[month - 1]} ${day}`;
    }

    const bonusLines = bonus.map((b) => {
        const daysLeft = getDaysRemaining(b.bonusTo);
        const daysUntil = getDaysUntil(b.bonusFrom);
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
        const formattedDate = `${formatMonthDay(
            b.bonusFrom
        )} → ${formatMonthDay(b.bonusTo)}`;

        if (daysLeft < 0) {
            line += `${status} ${getGroupName(b.group)} [${b.bonus}%]  《${
                b.type === "birthday + album"
                    ? `${b.artist} x ${getAlbumName(b.group, b.album)}`
                    : b.type === "album"
                    ? `${getAlbumName(b.group, b.album)}`
                    : `${b.artist}`
            }》 | ${formattedDate}`;
            if (b.type === "album" && b.album) {
                const titles = getMusicTitles(b.group, b.album);
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
                const titles = getMusicTitles(b.group, b.album);
                if (titles.length > 0) {
                    line +=
                        "\n" +
                        titles
                            .map(
                                (t, idx) =>
                                    `   ${
                                        idx === titles.length - 1 ? "┗ " : "┣ "
                                    } 🎶 ${t}`
                            )
                            .join("\n");
                }
            }
        }

        return line;
    });

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
};
