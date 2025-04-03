const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require('./src/Config');
const { DateTime } = require('luxon');

const demoConfigFile = path.join(__dirname, 'demo/demo_config.js');
config.load(demoConfigFile)

const BankDatabase = require('./src/BankDatabase');
const logger = require('./src/Logger');

// on installation:
// - connect to the demo config and the demo database.
// - update the demo data's dates.
// - install config.template.js to the homedir (if it doesn't exist)
try {
    const db = new BankDatabase();

    // 1. get the max transaction date
    const { dt: maxDateTimeRaw } = db.db.prepare("SELECT max(datetime) dt FROM 'transaction'").get();
    const maxDateTime = DateTime.fromISO(maxDateTimeRaw, { setZone: true }); // preserves original TZ offset
    logger.info(`Latest transaction is: ${maxDateTimeRaw} --> ${maxDateTime.toISO()}`);

    // 2. Decide what date you want it to align with — e.g., yesterday at midnight UTC
    const targetDate = DateTime.utc().startOf('day').minus({ days: 1 });

    const dayOffset = targetDate.diff(maxDateTime.startOf('day'), 'days').days;
    logger.info(`Offset: ${dayOffset} days`);

    // 3. Check if the offset is less than 1 day
    if (Math.abs(dayOffset) < 1) {
        logger.info("No shift needed — already aligned.");
        return;
    }

    // 4. Shift all transactions
    const rows = db.db.prepare("SELECT * FROM 'transaction'").all();
    const updateStmt = db.db.prepare("UPDATE 'transaction' SET datetime = ? WHERE id = ?");

    for (const row of rows) {
        const original = DateTime.fromISO(row.datetime, { setZone: true });
        const updated = original.plus({ days: dayOffset });

        const formatted = updated.toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");

        logger.info(`From ${row.datetime} → ${formatted}`);
        updateStmt.run(formatted, row.id);
    }
    db.db.exec("VACUUM");
    logger.info("Database vacuumed.");
}

catch (error) {
    logger.error('Failed to complete setup:', error);
    process.exit(1);
}