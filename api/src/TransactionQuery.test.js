const TransactionQuery = require('./TransactionQuery.cjs');

describe('Test TransactionQuery', () => {
  let tq;

  beforeEach(() => {
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
        "tags": {
          "startsWith": "Misc"
        },
      }
    });

    tq.processParams()
    expect(tq.where).toBe(" AND (tags LIKE ?)\n");
    expect(tq.params[0]).toBe("Misc%");
  });

  test('test simple parameter', () => {
    tq = new TransactionQuery({
      filter: {
        "tags": {
          "endsWith": "Misc"
        }
      }
    });

    tq.processParams()
    expect(tq.where).toBe(" AND (tags LIKE ?)\n");
    expect(tq.params[0]).toBe("%Misc");
  });

  test('test simple parameter', () => {
    tq = new TransactionQuery({
      filter: {
        "amount": {
          ">": "30"
        }
      }
    });

    tq.processParams()
    expect(tq.where).toBe(" AND (amount > CAST(? AS NUMERIC))\n");
    expect(tq.params[0]).toBe('30');
  });

  test('test between', () => {
    tq = new TransactionQuery({
      filter: {
        "datetime": {
          "<": "2019-03-01",
        }
      }
    });

    tq.processParams()
    expect(tq.where).toBe(" AND (date(datetime) < date(?))\n");
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
    expect(tq.where).toBe(" AND (date(datetime) >= date(?))\n AND (date(datetime) <= date(?))\n");
    expect(tq.params[0]).toBe("2019-03-01");
    expect(tq.params[1]).toBe("2024-03-01");
  });

  test('test is null', () => {
    tq = new TransactionQuery({
      filter: {
        "tags": {
          "IS NULL": "",
        }
      }
    });

    tq.processParams()
    expect(tq.where).toBe(" AND (tags IS NULL OR tags = '')\n");
    expect(tq.params.length).toBe(0);

  });

  test('test is not null', () => {
    tq = new TransactionQuery({
      filter: {
        "tags": {
          "IS NOT NULL": "",
        }
      }
    });

    tq.processParams()
    expect(tq.where).toBe(" AND (tags IS NOT NULL)\n");
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
    expect(tq.where).toBe(" AND (description REGEXP ?)\n");
    expect(tq.params[0]).toBe('manoosh/i');

  });


  test('test regex', () => {
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


  let s = {
    "account": {
      "in": [
        "306821 4715409",
        "732002 671776"
      ]
    },
    "tags": {
      "startsWith": "Misc"
    },
    "debit": {
      "<=": "1"
    },
    "description": {
      "in": [
        "fee",
        "manoosh"
      ]
    },
    "datetime": {
      ">=": "2019-03-01",
      "<=": "2024-03-01"
    }
  }
});
