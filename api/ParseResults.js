// const fs = require('fs');
// const fs = require('fs').promises;
// const path = require('path');
// const readline = require('readline');
// const { createReadStream } = require('fs');

class ParseResults {
    constructor(config,db) {
        this.lines = 0;
        this.inserted = 0;
        this.skipped = 0;
        this.faulty = 0;
        this.dates = {}
    }

    setMinMaxDate(rangeDescriptor, date) {
        const dateObj = new Date(date);
    
        // Create local references
        let dateArr = this.dates[rangeDescriptor];

        // 0 is low
        // 1 is high
        if (!dateArr) {
            const dawnOfTime = new Date('0000-01-01T00:00:00Z')
            const endOfDays  = new Date('9999-12-31T23:59:59Z')
            this.dates[rangeDescriptor] = [endOfDays, dawnOfTime];
        }
        else {
            if (dateObj < dateArr[0]) {
                this.dates[rangeDescriptor][0] = dateObj
            }
            if (dateObj > dateArr[1]) {
                this.dates[rangeDescriptor][1] = dateObj
            }
        }

    }

}

module.exports = ParseResults;
