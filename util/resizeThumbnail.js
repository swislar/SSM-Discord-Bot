import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import os from "os";

/**
 * Checks for an existing thumbnail, creates one if it doesn't exist.
 * This is an idempotent function: running it multiple times with the same input yields the same result without re-processing.
 * @param {string} originalPath The path to the original image.
 * @param {number} [size=128] The width and height of the square thumbnail (e.g., 128px).
 * @returns {Promise<string|null>} The path to the thumbnail file, or null if an error occurs.
 */
export const resizeThumbnail = async (originalPath, size = 128) => {
    try {
        // --- NEW LOGIC START ---

        // 1. Determine the expected path for the thumbnail based on a predictable name.
        const extension = path.extname(originalPath);
        const originalNameOnly = path.basename(originalPath, extension);
        const thumbnailFilename = `${originalNameOnly}_thumbnail.png`;
        const expectedThumbnailPath = path.join(
            path.join(process.cwd(), "albumCover"),
            thumbnailFilename
        );

        // 2. Check if the thumbnail file already exists.
        try {
            // fs.access checks if the file exists and is accessible. Throws an error if not.
            await fs.access(expectedThumbnailPath);
            // If the line above doesn't throw, the file exists. We can return its path immediately.
            console.log(
                `Found existing thumbnail at: ${expectedThumbnailPath}`
            );
            return expectedThumbnailPath;
        } catch {
            // The file doesn't exist, so we'll proceed to create it.
            console.log("Thumbnail not found. Creating a new one...");
        }

        // --- NEW LOGIC END ---

        // 3. If we're here, create the thumbnail as before.
        // We use `expectedThumbnailPath` which we already calculated.
        await sharp(originalPath)
            .resize(size, size, {
                fit: sharp.fit.contain,
                position: "attention",
            })
            .png({ quality: 90 })
            .toFile(expectedThumbnailPath);

        console.log(
            `Thumbnail created successfully at: ${expectedThumbnailPath}`
        );

        // 4. Return the path to the newly created thumbnail.
        return expectedThumbnailPath;
    } catch (error) {
        // This catches errors from either sharp processing or potential fs errors.
        console.error(
            `Failed to create or get thumbnail for ${originalPath}:`,
            error
        );
        return null;
    }
};
