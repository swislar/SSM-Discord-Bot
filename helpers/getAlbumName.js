import { albumNameMappings } from "../maps/index.js";

export const getAlbumName = (group, album) => {
    return albumNameMappings[group][album] ?? album;
};
