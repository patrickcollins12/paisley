const os = require('os');
const path = require('path');

// $30,450.00 --> 30450.00
exports.cleanPrice = function (price) {
    return price.replace(/[^0-9.]/g, "");
}

exports.saveCSVFromPromise = async function (config, dir, download) {
    const fileName = [config['identifier'], process.pid, download.suggestedFilename()].join('_')
    let csv_location = path.join(dir, fileName);
    await download.saveAs(csv_location);
    console.log(`Saved to ${csv_location}`)
}
