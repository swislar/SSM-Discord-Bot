import { musicMappings } from "../maps/index.js";

export const getAllMusicTitles = (group, album) => {
    if (!musicMappings[group]) return [];
    return Object.values(musicMappings[group])
        .filter((track) => track.album === album)
        .map((track) => track.title);
};
