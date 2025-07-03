import path from "path";

/**
 * Takes a full file path and sanitizes only the filename part.
 * It leaves the directory path untouched.
 *
 * @param {string} fullPath The original full path to the file.
 * @returns {string} The new full path with a sanitized filename.
 */
export const sanitizeFilename = (fullPath) => {
    // console.log("Before:", fullPath);
    const directory = path.dirname(fullPath);
    const filename = path.basename(fullPath);
    const extension = path.extname(filename);
    const nameOnly = path.basename(filename, extension);

    const sanitizedName = nameOnly
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const newFilename = `${sanitizedName}${extension}`;

    // console.log("After:", path.join(directory, newFilename));
    return path.join(directory, newFilename);
};
