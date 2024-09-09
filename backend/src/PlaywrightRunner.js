const fs = require('fs').promises;
const os = require('os');
const config = require('./Config');
const { spawn } = require('child_process');
const path = require('path');
const { pid } = require('node:process');
var cron = require('node-cron');

class PlaywrightRunner {
    constructor() {
    }

    // config.json:
    //    scheduled_scrape: true,
    //    scheduled_scrape_cron: "40 * * * *", // on the 5th minute of every hour. See node-cron
    //    scheduled_scrape_command: "/opt/homebrew/bin/npx playwright test --reporter json --retries 1",
    startCronScheduler() {

        // skip scrape?
        if (config.scheduled_scrape == false) { return }

        // run at startup
        const cronstr = config.scheduled_scrape_cron
        if (cronstr == "startup") {
            this.start()

        // cron.schedule('1-5 * * * *', () => {
        } else {
            console.log("Running playwright on this schedule: ", cronstr)
            cron.schedule(cronstr, () => {
                console.log('Scheduled start');
                this.start()
            });
        }
    }

    parseResults(data) {
        try {
            // console.log(data)

            // Parse the JSON data
            const jsonData = JSON.parse(data);

            // Define a mapping for statuses to avoid repetitive if/else
            const statusMap = {
                passed: '✅ Success',
                failed: '❌ Failed',
                flaky: '⚠️ Flaky',
                timedOut: '⏰ Timed Out',
            };

            // Process the results
            jsonData.suites.forEach(suite => {
                console.log(`Suite: ${suite.title}`);

                suite.specs.forEach(spec => {
                    // Log spec title and whether all tests in this spec were OK
                    const specStatus = spec.ok ? '✅ passed' : '❌ failed';
                    console.log(`  ${specStatus}`);

                    spec.tests.forEach(test => {
                        // Extract test results
                        test.results.forEach(result => {
                            const { status, duration } = result; // Destructure result for cleaner code
                            const statusText = statusMap[status] || 'Unknown status'; // Default message for unknown statuses

                            // Log the status and duration
                            console.log(`   Duration: ${duration}ms, Status: ${statusText}`);
                        });
                    });
                });
            });

        } catch (error) {
            console.error('Error loading or processing the JSON file:', error);
        }
    }

    async loadResultsFromFile(file) {
        return await fs.readFile(file, 'utf-8');
    }

    async start() {

        // const data = await this.loadResultsFromFile(path.join(__dirname, 'playwright.json'))
        // this.parseResults(data);
        // return

        // Get the system's temporary directory in a platform-safe way
        const tempDir = os.tmpdir();  // Cross-platform temp directory (works on Windows, macOS, and Linux)

        // Create the temp file path in a cross-platform manner
        const jsontmpfile = path.join(tempDir, `playwright_${pid}_results.json`);

        const options = {
            cwd: path.join(__dirname, '..'), // This sets the cwd to the parent directory
            env: { ...process.env, "PLAYWRIGHT_JSON_OUTPUT_NAME": jsontmpfile }
        };
        // console.log(options)

        console.log(`Beginning Playwright test run...`);

        // RUN THE COMMAND
        // const cmd = '/opt/homebrew/bin/npx playwright test --reporter json --retries 1';
        const cmd = config.scheduled_scrape_command
        const cmdarr = cmd.split(' ')
        const npx = spawn(cmdarr.shift(), cmdarr, options);

        // PROCESS STDOUT
        npx.stdout.on('data', (data) => {
            console.log(data.toString());
        });

        // PROCESS STDERR
        npx.stderr.on('data', (data) => {
            console.error(`stderr: ${data.toString()}`);
        });

        npx.on('close', async (code) => {
            try {
                if (code === 0 || code === 1) {
                    const data = await this.loadResultsFromFile(jsontmpfile);
                    this.parseResults(data);
                } else {
                    console.error(`Unexpected exit code: ${code}`);
                }
            } catch (error) {
                console.error('Error loading or parsing results:', error);
            } finally {
                try {
                    await fs.unlink(jsontmpfile);
                } catch (e) { }

            }
        });

    }

}

module.exports = PlaywrightRunner;