const fs = require('fs').promises;
const path = require('path');
const logger = require('./Logger');

class FileMover {
    static async moveFile(baseDir, sourcePath, destinationDir) {
        // Calculate the relative path of the file from the base directory
        const relativePath = path.relative(baseDir, sourcePath);
        
        // Construct the destination path by combining the destination directory and the relative path
        const destinationPath = path.join(destinationDir, relativePath);

        // Create subdirectories in the destination path if they don't exist
        const destinationSubDir = path.dirname(destinationPath);
        await fs.mkdir(destinationSubDir, { recursive: true });

        // Move the file
        await fs.rename(sourcePath, destinationPath);
        logger.info(`Moved "${sourcePath}" to ${destinationPath}`);
    }
}

module.exports = FileMover;
