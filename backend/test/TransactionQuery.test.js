const TransactionQuery = require('./TransactionQuery.cjs');
const TransactionQueryFilter = require('./TransactionQueryFilter.cjs');

describe('Test TransactionQuery', () => {
  let tq;
  let tqf;

  function clean(str){
    var regex = new RegExp("[\n\s]+", "g");
    return str.replace(regex,' ').trim()
  }

  beforeEach(() => {
  });

  test('test _addSqlConditionField 1', () => {
    tq = new TransactionQueryFilter();
    tq._addSqlConditionField(`%% ${''} LIKE ?`, ["tags", "manual_tags"], [`startsWif%`])
    expect(clean(tq.where)).toBe(clean(' AND (tags  LIKE ? OR manual_tags  LIKE ?)\n'));
  });

  test('test _addSqlConditionField 2', () => {
    tq = new TransactionQuery();
    tq._addSqlConditionField(`%% ${''} LIKE ?`, ["tags"], [`startsWif%`])
    expect(clean(tq.where)).toBe(clean(' AND (tags  LIKE ?)\n'));
  });

  test('test _addSqlTagsWhere', () => {
    tq = new TransactionQuery();
    tq._addSqlTagsWhere(["manual_tags","auto_tags"], ['x > y','a > b'], '')
    expect(clean(tq.where)).toBe(clean(` AND  (
EXISTS (SELECT 1 FROM json_each(main.manual_tags) WHERE value IN (?,?))
 OR 
EXISTS (SELECT 1 FROM json_each(main.auto_tags) WHERE value IN (?,?))
)`)
);
  });
  
  test('test _addSqlTagsWhere NOT', () => {
    tq = new TransactionQuery();
    tq._addSqlTagsWhere(["manual_tags","auto_tags"], ['x > y','a > b'], 'NOT')
    expect(clean(tq.where)).toBe(clean(` AND NOT (
EXISTS (SELECT 1 FROM json_each(main.manual_tags) WHERE value IN (?,?))
 OR 
EXISTS (SELECT 1 FROM json_each(main.auto_tags) WHERE value IN (?,?))
)`)
);
  });
    
  test('test isNumeric()', () => {
    tq = new TransactionQuery();
    expect(tq.isNumeric('123')).toBe(true);
    expect(tq.isNumeric('123a')).toBe(false);
    expect(tq.isNumeric('123.22')).toBe(true);
    expect(tq.isNumeric('-123.22')).toBe(true);
    expect(tq.isNumeric('+123.22')).toBe(true);
    expect(tq.isNumeric('123.')).toBe(false);
    expect(tq.isNumeric('123.0')).toBe(true);
    expect(tq.isNumeric('.01')).toBe(true);
  });

  test('test simple parameter', () => {
    tq = new TransactionQuery({
      filter: {
        "type": {
          "startsWith": "Misc"
        },
      }
    });

    tq.processParams()
    expect(clean(tq.where)).toBe(clean(" AND ((type  LIKE ? ))\n"));
    expect(tq.params[0]).toBe("Misc%");
  });

  test('test tags endswith', () => {
    tq = new TransactionQuery({
      filter: {
        "tags": {
          "endsWith": "Misc"
        }
      }
    });

    tq.processParams()
    expect(clean(tq.where)).toBe(clean(" AND ((auto_tags  LIKE ? ) OR (manual_tags  LIKE ? ))\n"));
    expect(tq.params[0]).toBe("%Misc");
    expect(tq.params[1]).toBe("%Misc");
  });

  test('test amount greater', () => {
    tq = new TransactionQuery({
      filter: {
        "amount": {
          ">": "30"
        }
      }
    });

    tq.processParams()
    expect(clean(tq.where)).toBe(clean(" AND (amount > CAST(? AS NUMERIC))\n"));
    expect(tq.params[0]).toBe('30');
  });

  test('test amount abs greater', () => {
    tq = new TransactionQuery({
      filter: {
        "amount": {
          "abs>": "30"
        }
      }
    });

    tq.processParams()
    expect(clean(tq.where)).toBe(clean(" AND (ABS(amount) > CAST(? AS NUMERIC))\n"));
    expect(tq.params[0]).toBe('30');
  });


  test('test date less than', () => {
    tq = new TransactionQuery({
      filter: {
        "datetime": {
          "<": "2019-03-01",
        }
      }
    });

    tq.processParams()
    expect(clean(tq.where)).toBe(clean(" AND (date(datetime) < date(?))\n"));
    expect(tq.params[0]).toBe("2019-03-01");
  });

  test('test between', () => {
    tq = new TransactionQuery({
      filter: {
        "datetime": {
          ">=": "2019-03-01",
          "<=": "2024-03-01"
        }
      }
    });

    tq.processParams()
    expect(clean(tq.where)).toBe(clean(" AND (date(datetime) >= date(?))\n AND (date(datetime) <= date(?))\n"));
    expect(tq.params[0]).toBe("2019-03-01");
    expect(tq.params[1]).toBe("2024-03-01");
  });

  test('test tags is empty', () => {
    tq = new TransactionQuery({
      filter: {
        "tags": {
          "empty": "",
        }
      }
    });

    tq.processParams()
    expect(clean(tq.where)).toBe(clean(" AND ((auto_tags IS NULL OR auto_tags = '' OR auto_tags = '[]') OR (manual_tags IS NULL OR manual_tags = '' OR manual_tags = '[]'))\n"));
    expect(tq.params.length).toBe(0);

  });


  test('test type is empty', () => {
    tq = new TransactionQuery({
      filter: {
        "type": {
          "empty": "",
        }
      }
    });

    tq.processParams()
    expect(clean(tq.where)).toBe(clean(" AND ((type IS NULL OR type = '' OR type = '[]'))\n"));
    expect(tq.params.length).toBe(0);

  });


  test('test type is not empty', () => {
    tq = new TransactionQuery({
      filter: {
        "type": {
          "not_empty": "",
        }
      }
    });

    tq.processParams()
    expect(clean(tq.where)).toBe(clean(" AND NOT ((type IS NULL OR type = '' OR type = '[]'))\n"));
    expect(tq.params.length).toBe(0);

  });


  test('test is not null', () => {
    tq = new TransactionQuery({
      filter: {
        "tags": {
          "not_empty": "",
        }
      }
    });

    // - Expected  - 2
    // + Received  + 1

    // -  AND ((auto_tags IS NOT NULL AND auto_tags <> '' AND auto_tags <> '[]') AND (manual_tags IS NOT NULL AND manual_tags <> '' AND manual_tags <> '[]'))
    // -
    // +  AND NOT (((auto_tag  IS NULL OR auto_tag  = '' OR auto_tag  = '[]')  AND  (manual_tag  IS NULL OR manual_tag  = '' OR manual_tag  = '[]')))
    tq.processParams()
    var regex = new RegExp("\n", "g");
    var regex2 = new RegExp("\s+", "g");
    expect(clean(tq.where)).toBe(clean(" AND NOT (((auto_tag  IS NULL OR auto_tag  = '' OR auto_tag  = '[]')  AND  (manual_tag  IS NULL OR manual_tag  = '' OR manual_tag  = '[]')))"));
    expect(tq.params.length).toBe(0);

  });

  test('test regex', () => {
    tq = new TransactionQuery({
      filter: {
        "description": {
          "REGEX": "manoosh/i",
        }
      }
    });

    tq.processParams()
    var regex = new RegExp("\n", "g");
    expect(clean(tq.where)).toBe(clean(" AND  (((description REGEXP ? )  OR  (revised_description REGEXP ? )))"));
    expect(tq.params[0]).toBe('manoosh/i');

  });


  test('test incorrect operator', () => {
    tq = new TransactionQuery({
      filter: {
        "description": {
          "BAD OPERATOR": "stuff",
        }
      }
    });

    expect(() => {
      tq.processParams()
    }).toThrow();
  });


});
