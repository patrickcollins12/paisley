

describe('Utils', () => {
    let util
    beforeEach(() => {
        util = require('../src/Util');
        // util = require('../src/AccountHistoryDataTransform');

    });

    test('should be instantiated correctly', () => {
        expect(util.generateSHAFromObject).toBeDefined();
    });

    test('test SHA', () => {
        // const util = require('../src/Util');
        expect(util.generateSHAFromObject).toBeDefined();
        let obj = {
            'account': '123456 89765',
            'description': "DEPOSIT JENNY,DAVID        Transfer",
            'balance': '419.54'
        }
        let k = ['account', 'description', 'balance']
        let uniqueID = util.generateSHAFromObject({}, obj, k)
        expect(uniqueID).toBe("742b614f4cb15bf508e8aa5067bccd8d2b70070da0c2b77a53ff1fe593364f30");
    });

});