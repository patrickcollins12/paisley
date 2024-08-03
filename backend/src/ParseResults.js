const { DateTime } = require('luxon');
let chalk;

class ParseResults {

    constructor(config, db) {
        this.lines = 0;
        this.inserted = 0;
        this.skipped = 0;
        this.invalid = 0;
        this.dates = {}
        this.inserted_ids = []

    }

    hadInserts() {
        return (this.inserted) ? true : false;
    }

    isSuccess() {
        return (this.invalid) ? false : true;
    }

    insert(newid) {
        this.inserted++;
        this.inserted_ids.push(newid)
    }

    setMinMaxDate(rangeDescriptor, date) {
        const dateObj = new Date(date);

        // Create local references
        let dateArr = this.dates[rangeDescriptor];

        // 0 is low
        // 1 is high
        if (!dateArr) {
            const dawnOfTime = new Date('0000-01-01T00:00:00Z')
            const endOfDays = new Date('9999-12-31T23:59:59Z')
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
    /*
    
    
    {
            "lines": 221,
            "inserted": 0,
            "skipped": 221,
            "invalid": 0,
            "dates": {
                "in_file": [
                    "2024-02-11T13:00:00.000Z",
                    "2024-03-11T13:00:00.000Z"
                ],
                "skipped": [
                    "2024-02-11T13:00:00.000Z",
                    "2024-03-11T13:00:00.000Z"
                ]
            },
            "inserted_ids": [],
            "file": "bankwest_4667_Transactions_12_03_2024.csv",
            "parser": "BankwestCSVParser"
        },
    BankwestCSVParser - bankwest_4667_Transactions_12_03_2024.csv 
        227 of 227 lines imported, 100% imported
        0 of 227 lines imported, 100% skipped
        133 of 227 lines imported (94 skipped)
        2024-02-11T13:00 to 2024-03-11T13:00
    \n
    
        */

    async loadChalk() {
        if (!chalk) {
            const c = await import('chalk');
            chalk = c.default;
        }
    }

    async print() {
        await this.loadChalk();

        console.log(`${chalk.magenta(this.parser)} ${chalk.blue(this.file)}`)

        if (!this.lines) {
            console.log(chalk.red(`   No transactions in file`))
            return
        }

        let color
        if (this.inserted == this.lines) {
            color = chalk.green
        }
        else if (this.skipped == this.lines) {
            color = chalk.gray
        }
        else {
            color = chalk.yellow
        }

        const percent_imported = this.lines > 0 ? Math.round((this.inserted / this.lines) * 100) : 0;
        console.log(color(`   ${this.inserted} of ${this.lines}, ${percent_imported}% imported (${this.skipped} skipped)`))

        if (this.dates?.in_file) {
            const from_date = DateTime.fromJSDate(this.dates?.in_file[0]).toFormat('yyyy-MM-dd');
            const to_date = DateTime.fromJSDate(this.dates?.in_file[1]).toFormat('yyyy-MM-dd');

            if (! to_date.startsWith('0000')) {
                console.log(chalk.gray(`   ${from_date} to ${to_date}`))
            }
        }

        // console.log(JSON.stringify(this, null, "\t"))
        console.log()

    }

}

module.exports = ParseResults;
