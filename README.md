## Install
```
$ cd api
$ npm install
$ npx install playwright
$ mkdir ~/paisley
$ cp config.template.js ~/paisley
```

## Back up the Schema occassionally:
``` 
$ sqlite3 ~/paisley/transactions.db .schema > schema.sql 
```

## Setup a demo database

```
$ cd api
mkdir -p ~/paisley/demo/bank_statements
cat schema.sql | sqlite3 ~/paisley/demo/demo_transactions.db

# generate a csv file and a rules file. put them in demo.
node demo/generate_transactions/generate_transactions.js

# the config tells the server to look at ~/paisley/demo for everything
`cp demo/demo_config.js ~/paisley/demo`

node server.js --config ~/paisley/demo/demo_config.js
```

## Running your scrapers
```
$ npm test
$ npx playwright test
```


