import fs from "fs";
import { musicMappings } from "./maps/index.js";

// Function to save mappings to a JSON file
function saveMappings() {
    fs.writeFileSync(
        "music_mappings.json",
        JSON.stringify(musicMappings, null, 2)
    );
    console.log("Music mappings saved to music_mappings.json");
}

// Function to load mappings from JSON file
function loadMappings() {
    try {
        const data = fs.readFileSync("music_mappings.json", "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.log("No existing mappings file found. Creating new one.");
        return {};
    }
}

// Function to add a new mapping
function addMapping(artist, songTitle, musicId) {
    if (!musicMappings[artist]) {
        musicMappings[artist] = {};
    }
    musicMappings[artist][songTitle] = musicId;
    console.log(`Added mapping: ${artist} - ${songTitle} -> ${musicId}`);
}

// Example usage:
// addMapping('Artist Name', 'Song Title', 'music_id_from_packet_capture');
// saveMappings();

console.log("Music Mappings Utility");
console.log("======================");
console.log("1. Analyze your SSRG.chlz file to find music IDs");
console.log("2. Use addMapping(artist, songTitle, musicId) to add mappings");
console.log("3. Call saveMappings() to save to file");
console.log("4. Copy the mappings to requests.js");

module.exports = {
    musicMappings,
    saveMappings,
    loadMappings,
    addMapping,
};
