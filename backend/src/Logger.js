const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../src/Config');

config.load(); // Ensure config is loaded

// Load log level with a default
const logLevel = config['log_level'] || 'info';

// Ensure log_directory is set (mandatory)
const logDirectory = config['log_directory'];
if (!logDirectory) {
    throw new Error("Missing required 'log_directory' in config.");
}

// Ensure the log directory exists
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

// Create logger
const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) =>
            `${timestamp} [${level.toUpperCase()}]: ${message}`
        )
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.colorize(),
        }),
        new winston.transports.File({
            filename: path.join(logDirectory, 'app.log'),
            maxsize: 5 * 1024 * 1024, // 5MB per file
            maxFiles: 5, // Keep last 5 logs
        })
    ]
});

module.exports = logger;
