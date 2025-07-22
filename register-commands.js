import dotenv from "dotenv";
import {
    REST,
    Routes,
    ApplicationCommandOptionType,
    SlashCommandBuilder,
} from "discord.js";
// import { musicMappings } from "./maps/index.js";
dotenv.config();

// const artistChoices = Object.keys(musicMappings).map((key) => ({
//     name: key,
//     value: key,
// }));

// const titleChoices = Object.values(musicMappings)
//     .flatMap((artistObj) => Object.keys(artistObj))
//     .map((title) => ({ name: title, value: title }));

const commands = [
    {
        name: "lb",
        description:
            "Gets the World Record Rankings for the selected Artist - Title.",
        options: [
            {
                name: "artist",
                description: "Artist name",
                type: ApplicationCommandOptionType.String,
                required: true,
                autocomplete: true,
                // choices: artistChoices,
            },
            {
                name: "title",
                description: "Music title",
                type: ApplicationCommandOptionType.String,
                required: true,
                autocomplete: true,
                // choices: titleChoices,
            },
        ],
    },
    {
        name: "addfav",
        description: "Set favourite artist for weekly bonus tracking.",
        options: [
            {
                name: "artist",
                description: "Artist name",
                type: ApplicationCommandOptionType.String,
                required: true,
                autocomplete: true,
                // choices: artistChoices,
            },
        ],
    },
    {
        name: "removefav",
        description: "Remove favourite artist for weekly bonus tracking.",
        options: [
            {
                name: "artist",
                description: "Artist name",
                type: ApplicationCommandOptionType.String,
                required: true,
                autocomplete: true,
                // choices: artistChoices,
            },
        ],
    },
    {
        name: "favgroups",
        description: "View favourite artist list.",
    },
    {
        name: "bonus",
        description: "View favourite artist bonuses for this week.",
    },
    {
        name: "bonusall",
        description: "View all artist bonuses for this week.",
    },
];

const rest = new REST({ version: "10" }).setToken(process.env.LOGIN_TOKEN);

(async () => {
    try {
        console.log("Registering slash commands...");

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log("Slash commands were registered successfully!");
    } catch (error) {
        console.log(`There was an error: ${error}`);
    }
})();
