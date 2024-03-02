class UniqueKey {

    constructor(config,db) {
        this.lines = 0;
        this.inserted = 0;
        this.skipped = 0;
        this.invalid = 0;
        this.dates = {}
        this.inserted_ids = []
    }


}

module.exports = UniqueKey;
