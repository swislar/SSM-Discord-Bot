import { getGroupName } from "./index.js";

export const formatFavGroups = (groups) => {
    let result = "";
    [...groups]
        .sort()
        .forEach((group) => (result += `\n▸  ${getGroupName(group)}`));
    return result;
};
