const fs = require('fs').promises;
const path = require('path');

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
        console.log(`Moved "${sourcePath}" to ${destinationPath}`);
    }
}

// class FileMover {
    
//     static  moveFile(baseDir, sourcePath, destinationDir, callback) {
//         // Calculate the relative path of the file from the base directory
//         const relativePath = path.relative(baseDir, sourcePath);
        
//         // Construct the destination path by combining the destination directory and the relative path
//         const destinationPath = path.join(destinationDir, relativePath);

//         // Create subdirectories in the destination path if they don't exist
//         const destinationSubDir = path.dirname(destinationPath);
//         fs.mkdirSync(destinationSubDir, { recursive: true });

//         // Move the file
//         fs.rename(sourcePath, destinationPath, function(err) {
//             if (err) {
//                 console.error(`Error occurred while moving the file: ${sourcePath}`, err);
//                 if (callback) callback(err);
//                 return;
//             }
//             console.log(`Moved "${path.basename(sourcePath)}" to ${destinationPath}`);
//             if (callback) callback(null);
//         });
//     }
// }

module.exports = FileMover;
