import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import {
    ping,
    hello,
    catfact,
    worldRecordRanking,
    test,
} from "./commands/index.js";
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

    //
    else if (command === "test") {
        test(message, args);
    }
});

client.login(process.env.LOGIN_TOKEN);
