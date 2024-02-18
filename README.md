## Install
```
$ cd api
$ npm install
$ npx install playwright
$ mkdir ~/paisley
$ cp config.template.js ~/paisley
```

## Back up the Schema occassionally
``` 
$ sqlite3 ~/paisley/transactions.db .schema > schema.sql 
```

## Generate a new demo database

```
# generate a csv file and a rules file. put them in demo.
$ node demo/generate_transactions/generate_transactions.js

move the generated tansactions file into ~/paisley/demo/bank_statements

$ node server.js --config ~/paisley/demo/demo_config.js
```

## Use existing demo database and configuration
```
$ cd api
$ mkdir -p ~/paisley/demo/bank_statements/processed
$ cp demo/demo_* ~/paisley/demo/
$ node server.js --config ~/paisley/demo/demo_config.js
```


## Running your scrapers
```
$ npm test
$ npx playwright test
```


