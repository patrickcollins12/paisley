/**
 * @file PlaywrightRunner.js
 * @description This file defines the PlaywrightRunner class, which is responsible for managing 
 * the execution of Playwright tests in a Node.js environment. It includes functionality for 
 * scheduling test runs using cron jobs, parsing test results, and handling temporary files 
 * for storing test output.
 * 
 * The configuration for the scraper and scheduled test runs is loaded from a `config.json` file. 
 * The class supports running tests at startup, scheduling periodic test runs, and processing 
 * the results to generate a summary.
 * 
 * Dependencies:
 * - `fs` for file system operations.
 * - `os` for accessing system-specific information.
 * - `path` for handling file paths.
 * - `child_process` for spawning subprocesses to execute Playwright commands.
 * - `node-cron` for scheduling tasks.
 * - `Logger` for logging information, warnings, and errors.
 * 
 * Usage:
 * - Instantiate the `PlaywrightRunner` class.
 * - Call the `startCronScheduler` method to initialize the cron scheduler and optionally run tests at startup.
 * - The class handles the execution of Playwright commands and processes the results.
 */

const fs = require('fs').promises;
const os = require('os');
const config = require('./Config');
const { spawn } = require('child_process');
const path = require('path');
const { pid } = require('node:process');
var cron = require('node-cron');
const logger = require('./Logger');


class PlaywrightRunner {

    constructor() {
    }

    // config.json:
    //    enable_scraper: true,
    //    scrape_at_startup: true,
    //    scheduled_scrape_cron: "40 * * * *", // on the 5th minute of every hour. See node-cron
    //    scheduled_scrape_command: "/opt/homebrew/bin/npx playwright test --reporter json --retries 1",

    startCronScheduler() {

        // scraper enabled?
        if (config.enable_scraper == false) { 
            logger.warn(`Warn: Scraper disabled 'enable_scraper: ${config.enable_scraper}'`);
            return;
        }

        // run at startup
        if (config.scrape_at_startup) {
            logger.info(`Running playwright 'scrape_at_startup: ${config.scrape_at_startup}'`);
            this.start();
        }

        // cron.schedule('1-5 * * * *', () => {
        const cronstr = config.scheduled_scrape_cron
        if (cronstr) {
            if (cron.validate(cronstr)) {
                cron.schedule(cronstr, () => {
                    logger.info(`Scheduled playwright run starting now: ${cronstr}`);
                    this.start();
                });
            } else {
                throw new Error(`Invalid cron schedule string - scheduled_scrape_cron: ${cronstr}`)
            }

        } else {
            throw new Error(`No scheduled_scrape_cron: ${cronstr}`)
        }

    }

    parseResults(data) {
        try {
            // logger.info(data);

            // Parse the JSON data
            const jsonData = JSON.parse(data);

            // Define a mapping for statuses to avoid repetitive if/else
            const statusMap = {
                passed: '✅ Success',
                failed: '❌ Failed',
                flaky: '⚠️ Flaky',
                timedOut: '⏰ Timed Out',
            };

            let resultsSummary = ""

            // add the current date, time and timezone to the resultsSummary, using the timezone of the current machine...
            const now = new Date();
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            resultsSummary += `\n\nResults as of: ${now.toLocaleString()} ${tz}\n`;

            // Process the results
            const scrapeData = []
            jsonData.suites.forEach(suite => {
                resultsSummary += `Suite: ${suite.title}  `;

                suite.specs.forEach(spec => {
                    // Log spec title and whether all tests in this spec were OK
                    const specStatus = spec.ok ? '✅ passed' : '❌ failed';
                    resultsSummary += `${specStatus}\n`;

                    let attemptData = []
                    spec.tests.forEach(test => {
                        // Extract test results
                        test.results.forEach(result => {
                            const { status, duration } = result; // Destructure result for cleaner code
                            const statusText = statusMap[status] || 'Unknown status'; // Default message for unknown statuses
                            resultsSummary += `   Duration: ${duration}ms, Status: ${statusText}\n`;
                            attemptData.push({duration,status,statusText})
                        });
                    });

                    scrapeData.push({scraper: suite.title, status: spec.ok, text_status: specStatus, attemptData})
                });
            });

            logger.info(resultsSummary);
            // logger.info(JSON.stringify(scrapeData, null, "\t"));
            // logger.info(JSON.stringify(jsonData.stats, null, "\t"));

            // TODO: Save the resultsSummary to the log

        } catch (error) {
            logger.error(`Error loading or processing the JSON file: ${error}`);
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

        // These are the options for the exec spawn
        const options = {
            cwd: path.join(__dirname, '..'), // This sets the cwd to the parent directory
            env: { ...process.env, "PLAYWRIGHT_JSON_OUTPUT_NAME": jsontmpfile }
        };

        // RUN THE COMMAND
        // const cmd = '/opt/homebrew/bin/npx playwright test --reporter json --retries 1';
        const cmd = config.scheduled_scrape_command
        const cmdarr = cmd.split(' ')
        const npx = spawn(cmdarr.shift(), cmdarr, options);

        // PROCESS STDOUT
        npx.stdout.on('data', (data) => {
            // TODO where to log this "error" output?
            // logger.info(data.toString());
        });

        // PROCESS STDERR
        npx.stderr.on('data', (data) => {
            logger.error(`stderr: ${data.toString()}`);
        });

        npx.on('close', async (code) => {
            try {
                if (code === 0 || code === 1) {
                    const data = await this.loadResultsFromFile(jsontmpfile);
                    this.parseResults(data);
                } else {
                    logger.error(`Unexpected exit code: ${code}`);
                }
            } catch (error) {
                logger.error(`Error loading or parsing results: ${error}`);
            } finally {
                try {
                    await fs.unlink(jsontmpfile);
                } catch (e) { }

            }
        });

    }

}

module.exports = PlaywrightRunner;