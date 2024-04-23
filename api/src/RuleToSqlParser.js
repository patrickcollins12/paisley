const moo = require('moo');

const lexer = moo.compile({
    WS: /[ \t]+/,
    number: /0|[1-9][0-9]*/,
    // string: /'[^']*'/,
    // string: /'(?:[^'\\]|\\.)*'/, // Updated to handle escaped characters
    string: /'(?:[^'\\]|\\['\\])*'/, // Updated to handle apostrophes and backslashes inside string literals
    // regex: /\/(?:[^\/\\]|\\.)+\/[g]*/,  // Adding flags as optional
    regex: /\/(?:[^\/\\]|\\.)*\//, // Updated to handle escaped slashes within regex literals
    // regex: /\/[^\/]*\//,
    lparen: '(',
    rparen: ')',
    and: ['and','AND'],
    or: ['or', 'OR'],
    eq: /=/,
    neq: /<>/,
    gte: />=/,  // This needs to come before 'gt'
    gt: />/,
    lte: /<=/,  // This needs to come before 'lt'
    lt: /</,
    startsWith: /starts with/,
    field: /[a-zA-Z_][a-zA-Z0-9_]*/,
    NL: { match: /\n/, lineBreaks: true },
});

class RuleToSqlParser {
    constructor() {
        this.sql = '';
        this.input = '';
        this.params = [];
        this.lastField = null;
        this.lastOperator = null;
        this.regexEnabled = false;
        this.allowedFieldList = ['description', 'account', 'type', 'amount', 'credit', 'debit'];
    }

    parse(input) {
        this.input=input
        lexer.reset(input);
        let token;

        while (token = lexer.next()) {
            if (token.type === 'WS' || token.type === 'NL') continue;
            this.handleToken(token);
        }

        return { sql: this.sql, params: this.params, regexEnabled: this.regexEnabled };
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

    handleRegex(token) {
        const regexContent = token.value.slice(1, -1);
        // const fieldModifier = this.lastField ? `lower(${this.lastField})` : this.lastField;
        // const fieldModifier = this.lastField;
        if (this.lastOperator === 'eq') {
            this.sql += `${this.lastField} REGEXP ?`;
        } else if (this.lastOperator === 'neq') {
            this.sql += `${this.lastField} NOT REGEXP ?`;
        }
        this.regexEnabled = true
        this.params.push(regexContent);
        this.lastField = null;
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
