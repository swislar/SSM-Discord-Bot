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

// Create a new client instance with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // This is the privileged intent we enabled
    ],
});

const BOT_PREFIX = "h!";

// When the client is ready, run this code (only once)
client.once("ready", () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
});

// client.on("interactionCreate", async (interaction) => {
//     if (!interaction.isChatInputCommand()) return;

//     if (interaction.commandName === "lb") {
//         const artist = interaction.options.get("Artist").value;
//         const title = interaction.options.get("Title").value;

//         interaction.reply(`Querying for ${artist} - ${title}`);
//     }
// });

client.on("interactionCreate", async (interaction) => {
    if (interaction.isAutocomplete()) {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === "artist") {
            // Autocomplete for artist
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
            // Autocomplete for title
            const selectedArtistRaw = interaction.options.getString("artist");
            if (!selectedArtistRaw) {
                await interaction.respond([]);
                return;
            }
            // Map the artist input to canonical name
            const selectedArtist =
                artistMappings[selectedArtistRaw.toLowerCase()] ??
                selectedArtistRaw;
            const songsForArtist = musicMappings[selectedArtist];
            if (!songsForArtist) {
                await interaction.respond([]);
                return;
            }

            const focusedValue = focusedOption.value.toLowerCase().trim();

            // Get alternative names from musicNameMappings
            const alternativeNames = musicNameMappings[selectedArtist] || {};

            // Create a mapping of searchable terms to canonical titles
            const searchToCanonical = new Map();

            // Add canonical song titles from musicMappings (search by canonical name, show canonical name)
            Object.keys(songsForArtist).forEach((title) => {
                searchToCanonical.set(title.toLowerCase(), title);
            });

            // Add alternative names as searchable keys, mapping to canonical values
            Object.entries(alternativeNames).forEach(
                ([altName, canonicalName]) => {
                    searchToCanonical.set(altName.toLowerCase(), canonicalName);
                }
            );

            // Filter searchable terms that match the focused value
            const matchingSearchTerms = Array.from(
                searchToCanonical.keys()
            ).filter((searchTerm) => searchTerm.includes(focusedValue));

            // Sort by relevance (exact matches first, then partial matches)
            const sortedSearchTerms = matchingSearchTerms.sort((a, b) => {
                const aStartsWith = a.startsWith(focusedValue);
                const bStartsWith = b.startsWith(focusedValue);

                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;
                return a.localeCompare(b);
            });

            // Get unique canonical titles from matching search terms
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
        return; // Important: Return after responding to autocomplete
    }

    // --- Chat Input Command (Slash Command) Handling ---
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === "lb") {
        // Your command name is 'lb'
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

    // ... (Your other interaction and messageCreate handlers)
});

// Listen for messages
client.on("messageCreate", async (message) => {
    // Ignore messages from the bot itself or messages that don't start with the prefix
    if (message.author.bot || !message.content.startsWith(BOT_PREFIX)) return;

    // Get the command and arguments from the message
    const args = message.content.slice(BOT_PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Command: !ping
    if (command === "ping") {
        ping(message);
    }

    // Command: !hello
    else if (command === "hello") {
        hello(message);
    }

    // Command: !catfact (This uses an HTTP request)
    else if (command === "catfact") {
        catfact(message);
    }

    // Command: !lb <artist> <song_title>
    else if (command === "lb") {
        worldRecordRanking(message, args);
    }
});

client.login(process.env.LOGIN_TOKEN);
