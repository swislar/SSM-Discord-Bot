import {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} from "discord.js";
import { musicMappings, albumNameMappings } from "../maps/index.js";
import fs from "fs";
import path from "path";

export const favBonusMessage = async (interaction, bonus) => {
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
            status = "❌~~[Ended]~~";
        } else {
            status = `⏳ **${daysLeft} day${daysLeft === 1 ? "" : "s"} left**`;
        }

        let line =
            "\n" +
            (daysLeft < 0 ? "~~" : "") +
            status +
            " " +
            ` | ${formatMonthDay(b.bonusFrom)} → ${formatMonthDay(b.bonusTo)}` +
            (daysLeft < 0 ? "~~" : "");

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

        // For album bonuses, append music titles, visually connected
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
        return line;
    });

    const embed = new EmbedBuilder()
        .setColor("#f7b731")
        .setTitle("🌟 Your Favorite Bonuses 🌟")
        .setDescription(
            `You have no favorite artists set, so here are all available bonuses:\n${bonusLines.join(
                "\n"
            )}`
        )
        .setFooter({ text: `Total bonuses: ${bonus.length}` });

    await interaction.editReply({
        embeds: [embed],
        content: null,
    });
    return;
};
