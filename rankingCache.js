import fs from "fs";
const CACHE_FILE = "rankingCache.json";

// Load cache from disk if it exists
export let cache = {};
try {
    if (fs.existsSync(CACHE_FILE)) {
        cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    }
} catch (e) {
    console.error("Failed to load cache from disk:", e);
    cache = {};
}

// Save cache to disk
export function saveCache() {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    } catch (e) {
        console.error("Failed to save cache to disk:", e);
    }
}

// Set a cache entry and persist
export function setCache(key, value) {
    cache[key] = value;
    saveCache();
}

// Get a cache entry
export function getCache(key) {
    return cache[key];
}
