const axios = require('axios');
const ExpressServer = require('../src/ExpressServer.js');
const config = require('../src/Config.js');
config.load();
const database_setup = require('./BankDatabaseDummy.js');
const port = 4005

describe('Test TransactionQuery', () => {
    let expressServer;
    let db;

    // removes double spaces, newlines and trims
    const cln = (str) => str.replace(/\s+/g, ' ').replace(/\n/g, '').trim()
    const areStringsEqual = (str1, str2) => {cln(str1) === cln(str2)};

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

    // [
    //     {
    //       id: 'tx4',
    //       datetime: '2023-04-04 12:00:00',
    //       account: 'A345',
    //       orig_description: 'Hardware Store',
    //       description: 'Hardware Store',
    //       credit: 0,
    //       debit: 5,
    //       amount: -5,
    //       balance: 500,
    //       type: 'TXN',
    //       auto_tags: '[]',
    //       manual_tags: '[]',
    //       auto_party: '["Shop 4"]',
    //       manual_party: '[]'
    //     },
    //     {
    //       id: 'tx3',
    //       datetime: '2023-04-03 12:00:00',
    //       account: 'A123',
    //       orig_description: 'Book Store',
    //       description: 'Book Store',
    //       credit: 0,
    //       debit: 200,
    //       amount: -200,
    //       balance: 700,
    //       type: 'TXN',
    //       auto_tags: '["tag2","tag3"]',
    //       manual_tags: '[]',
    //       auto_party: '["Shop 3"]',
    //       manual_party: '["Shop 3"]',
    //       auto_categorize: 0
    //     },
    //     {
    //       id: 'tx2',
    //       datetime: '2023-04-02 12:00:00',
    //       account: 'A123',
    //       orig_description: 'Coffee Shop',
    //       revised_description: 'Coffee Shop (revised)',
    //       description: 'Coffee Shop (revised)',
    //       credit: 0,
    //       debit: 100,
    //       amount: -100,
    //       balance: 900,
    //       type: 'DEP',
    //       auto_tags: '["tag1","tag2"]',
    //       manual_tags: '["tag8","tag9"]',
    //       auto_party: '["Shop 2"]',
    //       manual_party: '["Shop 2a"]',
    //       auto_categorize: 1
    //     },
    //     {
    //       id: 'tx1',
    //       datetime: '2023-04-01 12:00:00',
    //       account: 'A123',
    //       orig_description: 'Initial Deposit',
    //       revised_description: 'Initial Deposit (revised)',
    //       description: 'Initial Deposit (revised)',
    //       credit: 1000,
    //       debit: 0,
    //       amount: 1000,
    //       balance: 1000,
    //       type: 'DEP',
    //       auto_tags: '["tag1","tag2"]',
    //       manual_tags: '["tag6","tag7"]',
    //       auto_party: '["Shop 1"]',
    //       manual_party: '["Shop 1a"]',
    //       auto_categorize: 1
    //     }
    //   ]

    // ['tx3', '2023-04-03 12:00:00', 'A123', 'Book Store', 0, 200, 700, "TXN", JSON.stringify(['tag2', 'tag3']), 'Shop 3']  
    
    test('/transactions string - all', async () => {
        const url = `http://localhost:${port}/api/transactions/`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(4)
    });

    test('/transactions string - exact match', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[description][=]=Book+Store`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(1)
        expect(cln(res.data?.resultSummary?.where)).toBe(cln("AND (description = ?)"))
        expect(res.data.results[0].id).toBe("tx3")
    });

    test('/transactions string - exact match (correct negative)', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[description][=]=Book`
        const res = await axios.get(url);
        expect(cln(res.data?.resultSummary?.where)).toBe(cln("AND (description = ?)"))
        expect(res.data?.resultSummary?.count).toBe(0) // expect 0 record
    });


    test('/transactions string - contains', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[description][contains]=Book`
        const res = await axios.get(url);
        
        expect(cln(res.data?.resultSummary?.where)).toBe(cln("AND ((description LIKE ? ))"))
        expect(res.data?.resultSummary?.count).toBe(1) // expect 1 record
        expect(res.data.results[0].id).toBe("tx3")
    });

    test('/transactions string - not_contains', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[description][not_contains]=Book`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(3)
    });

    test('/transactions string - endswith', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[description][endsWith]=Store`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(2) 
    });

    test('/transactions string - endswith', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[description][endsWith]=Blah`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(0) 
    });

    test('/transactions string - startswith', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[description][startsWith]=book`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(1) 
    });

    test('/transactions string - startswith', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[description][startsWith]=Blah`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(0) 
    });

    test('/transactions string - empty', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[orig_description][empty]`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(0) 
    });

    test('/transactions revised_description not empty', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[revised_description][empty]`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(2) 
    });


    test('/transactions revised_description not empty', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[revised_description][not_empty]`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(2) 
    });


    test('/transactions regex - case sensitive positive', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[description][regex]=Book+Store`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(1) // expect 1 record
        expect(res.data.results[0].id).toBe("tx3")
    });

    test('/transactions regex - case sensitive negative', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[description][regex]=book+store`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(0) // expect 0 records
    });

    test('/transactions regex 3 case insensitive', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[description][regex]=book+store/i`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(1) // expect 1 records
        expect(res.data.results[0].id).toBe("tx3")
    });

    test('/transactions amount <0', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[amount][<]=0`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(3)
    });

    test('/transactions amount >1000', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[amount][>=]=1000`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(1)
    });
    
    test('/transactions amount =1000', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[amount][=]=1000`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(1)
    });

    test('/transactions amount =1000 v2', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[amount]=1000`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(1)
    });

    test('/transactions abs credit >1000', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[amount][abs<=]=5`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(1)
    });

    test('/transactions abs amount is between', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[amount][abs<=]=300&filter[amount][abs>=]=50`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(2)
    });

    test('/transactions debit is between', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[debit][<=]=300&filter[debit][>=]=50`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(2)
    });


    test('/transactions amount is empty', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[amount][empty]`
        const res = await axios.get(url);
        expect(cln(res.data?.resultSummary?.where)).toBe(cln("AND ((amount IS NULL OR amount = '' OR amount = '[]'))"))
        expect(res.data?.resultSummary?.count).toBe(0)
    });

    test('/transactions datetime > 2023-04-02', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[datetime][>=]=2023-04-02`
        const res = await axios.get(url);
        // console.log(res.data)
        expect(res.data?.resultSummary?.count).toBe(3)
    });

    test('/transactions datetime between ', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[datetime][>=]=2023-04-02&filter[datetime][<]=2023-04-04`
        const res = await axios.get(url);
        expect(cln(res.data?.resultSummary?.where)).toBe(cln("AND (date(datetime) >= date(?)) AND (date(datetime) < date(?))"))
        expect(res.data?.resultSummary?.count).toBe(2)
    });

    ////////////////
    // Lists
    test('/transactions manual_tags in ', async () => {
        const url = `http://localhost:${port}/api/transactions/?filter[manual_tags][in][0]=tag8`
        const res = await axios.get(url);
        expect(cln(res.data?.resultSummary?.where)).toBe(cln("AND EXISTS (SELECT 1 FROM json_each(main.manual_tags) WHERE value IN (?))"))
        expect(res.data?.resultSummary?.count).toBe(1)
    });

    test('/transactions manual_tags in v2', async () => {
        const url = `http://localhost:${port}/api/transactions/?` +
                    `filter[manual_tags][in][0]=tag8&` +
                    `filter[manual_tags][in][1]=tag7`
        const res = await axios.get(url);
        expect(cln(res.data?.resultSummary?.where)).toBe(cln("AND EXISTS (SELECT 1 FROM json_each(main.manual_tags) WHERE value IN (?,?))"))
        expect(res.data?.resultSummary?.count).toBe(2)
    });
    
    test('/transactions manual_tags in v2', async () => {
        const url = `http://localhost:${port}/api/transactions/?` +
                    `filter[manual_tags][empty]`
        const res = await axios.get(url);
        expect(cln(res.data?.resultSummary?.where)).toBe(cln("AND ((manual_tags IS NULL OR manual_tags = '' OR manual_tags = '[]'))"))
        expect(res.data?.resultSummary?.count).toBe(2)
    });


    test('/transactions tags in x', async () => {
        const url = `http://localhost:${port}/api/transactions/?` +
                    `filter[tags][in][]=tag3&` +
                    `filter[tags][in][]=tag9&`
        const res = await axios.get(url);
        expect(cln(res.data?.resultSummary?.where)).toBe(cln("AND ( ( EXISTS ( SELECT 1 FROM json_each(json_extract(auto_tags, '$.tags')) WHERE json_each.value IN (?,?) )) OR EXISTS (SELECT 1 FROM json_each(main.manual_tags) WHERE value IN (?,?)) )"))
        expect(res.data?.resultSummary?.count).toBe(2)
    });

    test('/transactions tags in x v2', async () => {
        const url = `http://localhost:${port}/api/transactions/?` +
                    `filter[tags][in][0]=tag2&`
                  + `filter[tags][in][1]=tag8&`
        const res = await axios.get(url);
        expect(cln(res.data?.resultSummary?.where)).toBe(cln("AND ( ( EXISTS ( SELECT 1 FROM json_each(json_extract(auto_tags, '$.tags')) WHERE json_each.value IN (?,?) )) OR EXISTS (SELECT 1 FROM json_each(main.manual_tags) WHERE value IN (?,?)) )"))
        expect(res.data?.resultSummary?.count).toBe(3)
    });


    test('/transactions tags not_in x', async () => {
        const url = `http://localhost:${port}/api/transactions/?` +
                    `filter[tags][not_in][0]=tag2&` +
                    `filter[tags][not_in][1]=tag8&`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(1)
    });

    /////////////
    // list empty/not_empty
    test('/transactions tags empty', async () => {
        const url = `http://localhost:${port}/api/transactions/?` +
                    `filter[tags][empty]`
        const res = await axios.get(url);
        expect(cln(res.data?.resultSummary?.where)).toBe(cln("AND (( (auto_tags IS NULL OR auto_tags = '' OR auto_tags = '[]') AND (manual_tags IS NULL OR manual_tags = '' OR manual_tags = '[]')) )"))
        expect(res.data?.resultSummary?.count).toBe(1)
    });

    test('/transactions tags not empty', async () => {
        const url = `http://localhost:${port}/api/transactions/?` +
                    `filter[tags][not_empty]`
        const res = await axios.get(url);
        expect(res.data?.resultSummary?.count).toBe(3)
    });

    test('/transactions party empty', async () => {
        const url = `http://localhost:${port}/api/transactions/?` +
                    `filter[party][empty]`
        const res = await axios.get(url);
        expect(cln(res.data?.resultSummary?.where)).toBe(cln("AND (( (auto_party IS NULL OR auto_party = '' OR auto_party = '[]') AND (manual_party IS NULL OR manual_party = '' OR manual_party = '[]')) )"))
        expect(res.data?.resultSummary?.count).toBe(1)
    });

});