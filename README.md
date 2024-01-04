## Install
```
$ cd api
$ npm install
$ npx install playwright
$ mkdir ~/paisley
$ cp config.template.js ~/paisley
```

## Testing
```
$ npm test
$ npx playwright test
```

## Back up the Schema occassionally:
``` 
$ sqlite3 ~/paisley/transactions.db .schema > schema.sql 
```

