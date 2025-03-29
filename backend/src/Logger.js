const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../src/Config');
const logLevel = config['log_level'] || 'info';
const logFile = config['log_file'] || 'paisley.log';
const logDirectory = config['log_directory'] || 
    (() => { throw new Error("Missing required 'log_directory' in config."); })();
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory, { recursive: true });
const logFilePath = path.join(logDirectory, logFile);


const logFormat = winston.format.printf(({ timestamp, level, message }) =>
    `${timestamp} [${level.toUpperCase()}]: ${message}`
);


// Create logger
const logger = winston.createLogger({
    level: logLevel,
    transports: [
        new winston.transports.Console({
            level: 'info',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
        new winston.transports.File({
            filename: logFilePath,
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                logFormat
            ),
            maxsize: 50 * 1024 * 1024, // 50MB per file
            maxFiles: 5,
        })
    ]
});

module.exports = logger;
