export const capitalizeFirstLetter = (string) => {
    if (!string || typeof string !== "string") {
        return ""; // Handle null, undefined, or non-string inputs
    }
    if (string.length === 0) {
        return ""; // Handle empty string
    }
    return string.charAt(0).toUpperCase() + string.slice(1);
};
