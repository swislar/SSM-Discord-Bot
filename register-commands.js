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
];

// const commands = [
//     new SlashCommandBuilder() // Recommended way to build commands
//         .setName("lb")
//         .setDescription(
//             "Gets the World Record Rankings for the selected Artist - Title."
//         )
//         .addStringOption(
//             (option) =>
//                 option
//                     .setName("artist")
//                     .setDescription("Artist name")
//                     .setRequired(true)
//             .setAutocomplete(true) // Optional: If you want artist autocomplete as well
//         )
//         .addStringOption(
//             (option) =>
//                 option
//                     .setName("title")
//                     .setDescription("Music title")
//                     .setRequired(true)
//                     .setAutocomplete(true) // Crucial: This enables autocomplete for titles
//         ),
// ];

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
