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
    field: /[a-zA-Z_][a-zA-Z0-9_]*/,
    NL: { match: /\n/, lineBreaks: true },
});

class RuleToSqlParser {
    constructor() {
        this.allowedFieldList = ['description', 'account', 'type', 'amount', 'credit', 'debit'];

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

        while (token = lexer.next()) {
            if (token.type === 'WS' || token.type === 'NL') continue;
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
        this.sql += `(${this.lastField}="" OR ${this.lastField} IS NULL)`;
        this.lastOperator = null;
    }

    handleNotIsBlank() {
        this.sql += `NOT (${this.lastField}="" OR ${this.lastField} IS NULL)`;
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
