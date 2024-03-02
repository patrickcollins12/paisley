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


const createCsvWriter = require('csv-writer').createObjectCsvWriter;

exports.saveDataToCSV = async function(filename, data) {

    if (!data || data.length === 0) {
        console.log('No data to write');
        throw new Error("Empty data object, no CSV to write");
    }

    const headers = Object.keys(data[0]).map(key => ({ id: key, title: key }));

    const csvWriter = createCsvWriter({
        path: filename,
        header: headers
    });

    await csvWriter.writeRecords(data)
        // .then(() => {
        //     console.log('...Done');
        // });
}
