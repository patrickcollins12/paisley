const crypto = require('crypto');
let chalk = null;

/**
 * Creates a 64-character SHA256 hash key from an input object based on specified keys of interest.
 *
 * @param {Object} obj - The input object from which to generate the hash.
 * @param {string[]} keysOfInterest - An array of strings representing the keys in the object to be included in the hash.
 * @returns {string} A 64-character hexadecimal SHA256 hash string.
 */
// exports.generateSHAFromObject = function (obj, keysOfInterest) {
exports.generateSHAFromObject = function (orig, processed, keysOfInterest) {
    const obj = { ...orig, ...processed };

    let s = ""
    for (let k of keysOfInterest) {
        let val = obj[k]
        if ((k in obj)) {
            if (['description'].includes(k)) {
                // keep the same
            } else {
                val = val.toString().replace(/[^a-zA-Z0-9\.\,]/g, '');
            }
            s += val + ";"
        }
    }

    return crypto.createHash('sha256').update(s).digest('hex')
}


/**
 * Dynamically imports and returns the chalk library.
 * Subsequent calls will return the cached instance.
 * @returns {Promise<import('chalk').Chalk>}
 */
exports.loadChalk = async function() {
    if (!chalk) {
        const c = await import('chalk');
        chalk = c.default;
    }
    return chalk;
}



