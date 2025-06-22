import axios from "axios";

export const catfact = async (message) => {
    try {
        // Make the HTTP GET request to the cat fact API
        const response = await axios.get("https://catfact.ninja/fact");
        const fact = response.data.fact;
        message.channel.send(`**Random Cat Fact:**\n${fact}`);
    } catch (error) {
        console.error(error);
        message.channel.send("Sorry, I couldn't get a cat fact right now.");
    }
};
