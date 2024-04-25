const axios = require('axios');
const minimist = require('minimist');

// Load command line arguments
const args = minimist(process.argv);
const url = args['url'] || 'http://localhost:4000/transactions?page=1&page_size=25&ruleid=42';

async function makeRequest(url) {
    try {
        const response = await axios.get(url);
        return response;
    } catch (error) {
        console.error('Error making HTTP request:', error.message);
        return null;
    }
}

async function measurePerformance(url, numberOfExecutions) {
    let timings = [];
    let resultsString = "";

    for (let i = 0; i < numberOfExecutions; i++) {
        const start = process.hrtime.bigint();
        await makeRequest(url);
        const end = process.hrtime.bigint();

        // Convert nanoseconds to milliseconds
        const duration = Number(end - start) / 1000000;
        timings.push(duration);
        resultsString += `Request ${i + 1}: ${duration.toFixed(2)} ms\n`;
    }

    const minTime = Math.min(...timings);
    const maxTime = Math.max(...timings);
    const avgTime = timings.reduce((acc, cur) => acc + cur, 0) / timings.length;

    resultsString += `\nMinimum Time: ${minTime.toFixed(2)} ms\n`;
    resultsString += `Maximum Time: ${maxTime.toFixed(2)} ms\n`;
    resultsString += `Average Time: ${avgTime.toFixed(2)} ms\n`;
    resultsString += `Total Requests: ${numberOfExecutions}\n`;

    function binAndVisualize(numbers) {
        const bins = {};
      
        // Bin the numbers by rounding them to the nearest integer
        numbers.forEach(number => {
          const key = Math.round(number);
        //   console.log(key)
          bins[key] = (bins[key] || 0) + 1;
        });
      
        // Print the bins and their counts using "=" for visualization
        Object.keys(bins).sort((a, b) => a - b).forEach(key => {
          console.log(`${key} ${"=".repeat(bins[key])}`);
        });
      }
    
      
    // Optionally, you can print the results string to the console
    console.log(resultsString);
    binAndVisualize(timings);

    // Or, handle the results string further as needed
}

// Run the performance measurement
measurePerformance(url, 150);
