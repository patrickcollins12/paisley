
const TransactionQueryFilter = require('./TransactionQueryFilter.cjs');

describe('Test TransactionQuery', () => {

    function clean(str){
        var regex = new RegExp("[\n\s]+", "g");
        return str.replace(regex,' ').trim()
      }
    
    let basicFilter = {
        "amount": {
            "<": "5"
        }
    }

    beforeEach(() => {
    });

    test('test constructor', () => {
        tq = new TransactionQueryFilter(basicFilter);

        console.log("query:", tq.where)
        console.log("tq:", tq)

        // tq._addSqlConditionField(`%% ${''} LIKE ?`, ["tags", "manual_tags"], [`startsWif%`])

        expect(clean(tq.where)).toBe(clean(' AND  (amount < CAST(? AS NUMERIC))'));
        expect(tq.params[0]).toBe("5");

    });
})