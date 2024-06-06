const RuleToSqlParser = require('./RuleToSqlParser');

describe('SQL WHERE Clause Parser', () => {
  let parser;

  beforeEach(() => {
    parser = new RuleToSqlParser(); // Initialize a new instance of the parser for each test
  });

  test('parses simple equality using LIKE', () => {
    const input = "description = 'amazon'";
    const result = parser.parse(input);
    expect(result.sql).toBe("description LIKE ?");
    expect(result.params).toEqual(['%amazon%']);
  });

  test('parses starts with condition', () => {
    const input = "description starts with 'Al'";
    const result = parser.parse(input);
    expect(result.sql).toBe("description LIKE ?");
    expect(result.params).toEqual(['Al%']);
  });

  test('parses inequality using NOT LIKE', () => {
    const input = "description <> 'amazon'";
    const result = parser.parse(input);
    expect(result.sql).toBe("description NOT LIKE ?");
    expect(result.params).toEqual(['%amazon%']);
  });

  test('parses escaped string literals', () => {
    const input = "description = 'ama\\'zon'";
    const result = parser.parse(input);
    expect(result.sql).toBe("description LIKE ?");
    expect(result.params).toEqual(['%ama\\\'zon%']);
  });

  test('parses regular expressions', () => {
    const input = "description = /amaz?n/";
    const result = parser.parse(input);
    expect(result.sql).toBe("description REGEXP ?");
    expect(result.params).toEqual(['amaz?n']);
  });

  test('parses combined conditions with AND', () => {
    const input = "description = 'amazon' AND amount > 30";
    const result = parser.parse(input);
    expect(result.sql).toBe("description LIKE ? AND amount > ?");
    expect(result.params).toEqual(['%amazon%', '30']);
  });

  test('parses combined conditions with OR', () => {
    const input = "description = 'amazon' or amount <= 20";
    const result = parser.parse(input);
    expect(result.sql).toBe("description LIKE ? OR amount <= ?");
    expect(result.params).toEqual(['%amazon%', '20']);
  });

  test('handles parentheses and complex expressions', () => {
    const input = "(description = 'amazon' and amount > 30) or (description = /prime/ and amount < 100)";
    const result = parser.parse(input);
    expect(result.sql).toBe("(description LIKE ? AND amount > ?) OR (description REGEXP ? AND amount < ?)");
    expect(result.params).toEqual(['%amazon%', '30', 'prime', '100']);
  });

  test('handles very complex expressions', () => {
    const input = `
      (
        (description starts with 'amazon' and description <> 'amazon') 
        or 
        (description = 'amazon' and amount > 30)
      ) or 
      (description = /prime/ and amount < 100)`;
    const result = parser.parse(input);
    expect(result.sql).toBe("((description LIKE ? AND description NOT LIKE ?) OR (description LIKE ? AND amount > ?)) OR (description REGEXP ? AND amount < ?)");
    expect(result.params).toEqual(['amazon%', '%amazon%', '%amazon%', '30', 'prime', '100']);
  });

  // New test case for unallowed field
  test('throws an error when field is not allowed', () => {
    const input = "unallowedField = 'test'";
    expect(() => parser.parse(input)).toThrow(/Field 'unallowedField' is not allowed/);
  });

  // New test case for unhandled token type
  test('throws an error for unhandled token types', () => {
    const input = "@invalidToken = 'test'";
    expect(() => parser.parse(input)).toThrow(/invalid syntax at line/);
  });

  // New test case for is blank
  test('parses is blank condition', () => {
    const input = "description is blank";
    const result = parser.parse(input);
    expect(result.sql).toBe("(description=\"\" OR description IS NULL)");
    expect(result.params).toEqual([]);
  });

  // New test case for not is blank
  test('parses not is blank condition', () => {
    const input = "description not is blank";
    const result = parser.parse(input);
    expect(result.sql).toBe("NOT (description=\"\" OR description IS NULL)");
    expect(result.params).toEqual([]);
  });
});
