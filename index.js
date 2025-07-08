import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import {
    ping,
    hello,
    catfact,
    worldRecordRanking,
    interactiveWorldRecordRanking,
} from "./commands/index.js";
import {
    musicMappings,
    artistMappings,
    musicNameMappings,
} from "./maps/index.js";
dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const BOT_PREFIX = "h!";

client.once("ready", () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.isAutocomplete()) {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === "artist") {
            const focusedValue = focusedOption.value.toLowerCase().trim();
            const choices = Object.keys(artistMappings)
                .filter(
                    (key) =>
                        key.startsWith(focusedValue) ||
                        artistMappings[key].startsWith(focusedValue)
                )
                .map((key) => artistMappings[key]);
            const uniqueChoices = [...new Set(choices)];
            await interaction.respond(
                uniqueChoices
                    .slice(0, 25)
                    .map((choice) => ({ name: choice, value: choice }))
            );
        } else if (focusedOption.name === "title") {
            const selectedArtistRaw = interaction.options.getString("artist");
            if (!selectedArtistRaw) {
                await interaction.respond([]);
                return;
            }
            const selectedArtist =
                artistMappings[selectedArtistRaw.toLowerCase()] ??
                selectedArtistRaw;
            const songsForArtist = musicMappings[selectedArtist];
            if (!songsForArtist) {
                await interaction.respond([]);
                return;
            }

            const focusedValue = focusedOption.value.toLowerCase().trim();

            const alternativeNames = musicNameMappings[selectedArtist] || {};

            const searchToCanonical = new Map();

            Object.keys(songsForArtist).forEach((title) => {
                searchToCanonical.set(title.toLowerCase(), title);
            });

            Object.entries(alternativeNames).forEach(
                ([altName, canonicalName]) => {
                    searchToCanonical.set(altName.toLowerCase(), canonicalName);
                }
            );

            const matchingSearchTerms = Array.from(
                searchToCanonical.keys()
            ).filter((searchTerm) => searchTerm.includes(focusedValue));

            const sortedSearchTerms = matchingSearchTerms.sort((a, b) => {
                const aStartsWith = a.startsWith(focusedValue);
                const bStartsWith = b.startsWith(focusedValue);

                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;
                return a.localeCompare(b);
            });

            const uniqueCanonicalResults = new Set();
            sortedSearchTerms.forEach((searchTerm) => {
                const canonicalTitle = searchToCanonical.get(searchTerm);
                if (canonicalTitle) {
                    uniqueCanonicalResults.add(canonicalTitle);
                }
            });

            await interaction.respond(
                Array.from(uniqueCanonicalResults)
                    .slice(0, 25)
                    .map((canonicalTitle) => ({
                        name: canonicalTitle,
                        value: canonicalTitle,
                    }))
            );
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === "lb") {
        const artist = interaction.options.getString("artist");
        const title = interaction.options.getString("title");

        if (!musicMappings[artist]) {
            return interaction.reply({
                content: `Artist "${artist}" not found.`,
                ephemeral: true,
            });
        }
        if (!musicMappings[artist][title]) {
            return interaction.reply({
                content: `Song "${title}" by "${artist}" not found.`,
                ephemeral: true,
            });
        }

        const songData = musicMappings[artist][title];

        await interactiveWorldRecordRanking(interaction);
    }
});

client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.content.startsWith(BOT_PREFIX)) return;

    const args = message.content.slice(BOT_PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "ping") {
        ping(message);
    } else if (command === "hello") {
        hello(message);
    } else if (command === "catfact") {
        catfact(message);
    } else if (command === "lb") {
        worldRecordRanking(message, args);
    }
});

client.login(process.env.LOGIN_TOKEN);
