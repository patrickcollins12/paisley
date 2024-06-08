const axios = require('axios');
const ExpressServer = require('./ExpressServer');
const config = require('./Config');
config.load();
const database_setup = require('../test/BankDatabaseDummy.js');
// const TransactionQueryFilter = require('./TransactionQueryFilter.cjs');
const port = 4005

describe('Test TransactionQuery', () => {
    let expressServer;
    let db;

    beforeAll(async () => {

        db = database_setup()

        // Start the Express Server
        expressServer = new ExpressServer({
            enableApiDocs: false,
            port: port,
            globalDisableAuth: true
        });
        await expressServer.start();
        console.log('Server started for test.');
    });

    afterAll(async () => {
        await expressServer.stop();
    });

    test('test /transactions', async () => {
        const response = await axios.get(`http://localhost:${port}/api/transactions/`);
        // console.log(response.data);
        expect(response.data?.results.length).toBe(3)
        expect(response.data?.resultSummary?.count).toBe(3)
    });

    test('test /transactions v2', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[amount][<]=0`
        // const url = `http://localhost:${port}/api/transactions/?${encodeURIComponent("filter[amount][<]")}=0`
        const response = await axios.get(url);
        expect(response.data?.resultSummary?.count).toBe(2)
    });

    test('test /transactions v3', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[amount][>]=0`
        // const url = `http://localhost:${port}/api/transactions/?${encodeURIComponent("filter[amount][<]")}=0`
        const response = await axios.get(url);
        expect(response.data?.resultSummary?.count).toBe(1)
    });
    
});
