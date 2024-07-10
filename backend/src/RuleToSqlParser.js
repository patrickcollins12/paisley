const moo = require('moo');

const lexer = moo.compile({
    WS: /[ \t]+/,
    number: /0|[1-9][0-9]*/,
    string: /'(?:[^'\\]|\\['\\])*'/, // Updated to handle apostrophes and backslashes inside string literals
    regex: /\/(?:[^\/\\]|\\.)*\/[a-z]*/, // Updated to handle escaped slashes within regex literals
    lparen: '(',
    rparen: ')',
    and: ['and', 'AND'],
    or: ['or', 'OR'],
    eq: /=/,
    neq: /<>/,
    gte: />=/,  // This needs to come before 'gt'
    gt: />/,
    lte: /<=/,  // This needs to come before 'lt'
    lt: /</,
    startsWith: /starts with/,
    isblank: /is blank/,
    notisblank: /not is blank|notisblank/,
    'in': ['in', 'IN'], // Recognize the IN keyword
    comma: ',',
    field: /[a-zA-Z_][a-zA-Z0-9_]*/,
    NL: { match: /\n/, lineBreaks: true },
});

// Custom next function to skip whitespace
lexer.nextToken = function() {
    let token;
    do {
        token = lexer.next();
    } while (token && token.type === 'WS');
    return token;
}

class RuleToSqlParser {
    constructor() {
        this.allowedFieldList = [
            'description', 'revised_description', 'orig_description',
            'account', 'account_shortname', 'account_number',
            'manual_tags', 'auto_tags', 'tags', 
            'party', 'manual_party', 'auto_party', 
            'type', 
            'amount', 'credit', 'debit'
        ];

        this.setup();
    }

    setup() {
        this.sql = '';
        this.input = '';
        this.params = [];
        this.lastField = null;
        this.lastOperator = null;
    }

    parse(input) {
        this.setup();

        this.input = input;
        lexer.reset(input);
        let token;

        while (token = lexer.nextToken()) {
            this.handleToken(token);
        }

        return { sql: this.sql, params: this.params };
    }

    handleToken(token) {
        switch (token.type) {
            case 'and':
            case 'or':
                this.sql += ` ${token.text.toUpperCase()} `;
                break;
            case 'eq':
            case 'neq':
            case 'gt':
            case 'gte':
            case 'lt':
            case 'lte':
            case 'startsWith':
                this.handleComparisonOperators(token);
                break;
            case 'isblank':
                this.handleIsBlank();
                break;
            case 'notisblank':
                this.handleNotIsBlank();
                break;
            case 'in':
                this.handleInCondition();
                break;
            case 'string':
                this.handleString(token);
                break;
            case 'number':
                this.handleNumber(token);
                break;
            case 'regex':
                this.handleRegex(token);
                break;
            case 'field':
                this.lastField = this.validateField(token);
                break;
            case 'lparen':
            case 'rparen':
                this.sql += token.value;
                break;
            case 'NL':
                break;
            default:
                throw new Error(`Unhandled token type: ${token.type}`);
        }
    }

    handleComparisonOperators(token) {
        if (['eq', 'neq', 'startsWith'].includes(token.type)) {
            this.lastOperator = token.type;
        } else {
            this.sql += `${this.lastField} ${token.text} `;
        }
    }

    handleString(token) {
        const str = token.value.slice(1, -1);
        if (this.lastOperator === 'eq') {
            this.sql += `${this.lastField} LIKE ?`;
            this.params.push(`%${str}%`);
        } else if (this.lastOperator === 'neq') {
            this.sql += `${this.lastField} NOT LIKE ?`;
            this.params.push(`%${str}%`);
        } else if (this.lastOperator === 'startsWith') {
            this.sql += `${this.lastField} LIKE ?`;
            this.params.push(`${str}%`);
        }
        this.lastOperator = null;
    }

    handleNumber(token) {
        this.sql += `?`;
        this.params.push(token.value);
        this.lastOperator = null;
    }

    handleRegex(regex) {
        const flagMatch = /\/(.*)\/([a-z]*)$/.exec(regex);
        let regexContent = "";
        regexContent += flagMatch ? flagMatch[1] : regex;
        regexContent += flagMatch[2] ? "/" + flagMatch[2] : ''; // add the modifier

        if (this.lastOperator === 'eq') {
            this.sql += `${this.lastField} REGEXP ?`;
        } else if (this.lastOperator === 'neq') {
            this.sql += `${this.lastField} NOT REGEXP ?`;
        }

        this.params.push(regexContent);
        this.lastField = null;
        this.lastOperator = null;
    }

    handleIsBlank() {
        const f = this.lastField;
        this.sql += `(${f} IS NULL OR ${f} = '' OR ${f} = '[]')`;
        this.lastOperator = null;
    }

    handleNotIsBlank() {
        const f = this.lastField;
        this.sql += `NOT (${f} IS NULL OR ${f} = '' OR ${f} = '[]')`;
        this.lastOperator = null;
    }

    handleInCondition() {
        let values = [];
        let token;

        // Expect '(' after 'IN'
        token = lexer.nextToken();
        if (token.type !== 'lparen') {
            throw new Error(`Expected '(' after 'IN', found ${token.type}`);
        }

        // Collect values until ')'
        while ((token = lexer.nextToken()).type !== 'rparen') {
            if (token.type === 'comma') continue;
            if (token.type === 'string') {
                values.push(token.value.slice(1, -1)); // Remove the surrounding quotes
            } else {
                throw new Error(`Unexpected token type ${token.type} in 'IN' condition`);
            }
        }

        this.sql += `${this.lastField} IN (${values.map(() => '?').join(', ')})`;
        this.params.push(...values);
        this.lastOperator = null;
    }

    validateField(token) {
        if (this.allowedFieldList.includes(token.value)) {
            return token.value;
        } else {
            throw new Error(`Field '${token.value}' is not allowed in ${this.input}.`);
        }
    }
}

module.exports = RuleToSqlParser;
