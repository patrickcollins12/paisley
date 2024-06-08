const axios = require('axios');
const ExpressServer = require('../src/ExpressServer.js');
const config = require('../src/Config.js');
config.load();
const database_setup = require('./BankDatabaseDummy.js');
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
        expect(response.data?.results.length).toBe(3)
        expect(response.data?.resultSummary?.count).toBe(3)
    });

    test('test /transactions v2', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[amount][<]=0`
        const response = await axios.get(url);
        expect(response.data?.resultSummary?.count).toBe(2)
    });

    test('test /transactions v3', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[amount][>]=0`
        const response = await axios.get(url);
        expect(response.data?.resultSummary?.count).toBe(1)
    });
    
    test('test /transactions v4', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[description][regex]=Book+Store`
        const response = await axios.get(url);
        expect(response.data?.resultSummary?.count).toBe(1)
    });

    test('test /transactions v4', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[description][regex]=book+store`
        const response = await axios.get(url);
        expect(response.data?.resultSummary?.count).toBe(0)
    });

    test('test /transactions v4', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[description][regex]=book+store/i`
        const response = await axios.get(url);
        expect(response.data?.resultSummary?.count).toBe(1)
    });
});
