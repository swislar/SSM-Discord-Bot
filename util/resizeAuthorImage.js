import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import os from "os";

// Helper function to ensure filenames are safe for use.
const sanitizeFilename = (filename) => {
    return filename.replace(/[\s+]/g, "_").replace(/[^a-zA-Z0-9_.-]/g, "");
};

/**
 * Creates a square, centralized author icon from an image.
 * Checks for an existing icon before creating a new one.
 * @param {string} originalPath The path to the original image.
 * @param {number} [size=64] The recommended width and height of the square icon.
 * @returns {Promise<string|null>} The path to the icon file, or null if an error occurs.
 */
export const resizeAuthorImage = async (originalPath, size = 64) => {
    try {
        // 1. Determine the expected path for the icon based on a predictable, sanitized name.
        const originalNameOnly = path.basename(
            originalPath,
            path.extname(originalPath)
        );
        const sanitizedBaseName = sanitizeFilename(originalNameOnly);

        const iconFilename = `${sanitizedBaseName}_author.png`;
        const expectedIconPath = path.join(
            path.join(process.cwd(), "emblems"),
            iconFilename
        );

        // 2. Check if the icon file already exists. If so, return it immediately.
        try {
            await fs.access(expectedIconPath);
            console.log(`Found existing author icon: ${expectedIconPath}`);
            return expectedIconPath;
        } catch {
            // File doesn't exist, so we proceed to create it.
            console.log("Author icon not found, creating new one...");
        }

        // 3. Use sharp to create the centered, square icon.
        await sharp(originalPath)
            .resize(size, size, {
                // 'cover' resizes the image to fill the entire 64x64 area,
                // cropping any overflow from the edges. This prevents distortion.
                fit: sharp.fit.contain,
                // 'attention' attempts to crop around the most "interesting" part
                // of the image, which is excellent for centering on faces or subjects.
                position: "attention",
            })
            .png({ quality: 90 }) // Convert to PNG, which is great for icons.
            .toFile(expectedIconPath);

        console.log(`Author icon created successfully at: ${expectedIconPath}`);

        // 4. Return the path to the newly created icon file.
        return expectedIconPath;
    } catch (error) {
        console.error(
            `Failed to create author icon for ${originalPath}:`,
            error
        );
        return null;
    }
};
