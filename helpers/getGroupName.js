import { musicMappings } from "../maps/index.js";

export const getGroupName = (group) => {
    if (!musicMappings[group]) return [];
    return Object.values(musicMappings[group])[0].artist;
};
