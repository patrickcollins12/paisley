const RuleToSqlParser = require('./RuleToSqlParser')
const BankDatabase = require('./BankDatabase')
const TransactionQueryFilter = require('./TransactionQueryFilter.cjs')

class TransactionQuery {

    // Step 1
    // const tq = new TransactionQuery(req.query)
    constructor(params) {
        this._resetQueries()
        this.queryParams = params
        this.db = new BankDatabase()
    }

        // Resets the SQL and parameters to their base queries
        _resetQueries() {
            this.where = ""
            this.order_by = ""
            this.limit = ""

            this.params = []
            this.limitParams = []
        }

    // Processes all of the params and sets up the where, order by and limit clauses.
    processParams() {
        this._resetQueries(); // Reset queries to handle new request cleanly
        this._processRuleParams()
        this._processDescriptionAndTagsParams()
        this._processFilterParams()
        this._processOrderByParams()
        this._processPaginationParams()
        this._processLimitOffsetParams()
    }

    /**
     * Constructs the SQL query based on the provided flags.
     * @param {boolean} limitOffsetEnabled - Indicates if pagination should be applied.
     * @param {boolean} orderByEnabled - Indicates if sorting should be applied.
     * @returns {string} The constructed SQL query.
     */
    getTransactionQuery(limitOffsetEnabled = true, orderByEnabled = true) {
        // Start with the base query
        let query = TransactionQuery.allTransactionsQuery;

        // Append the WHERE clause to the query
        query += this.where;

        // Append the ORDER BY clause if sorting is enabled
        if (orderByEnabled) {
            query += this.order_by;
        }

        // Append the LIMIT clause if pagination is enabled
        if (limitOffsetEnabled) {
            query += this.limit;
        }

        return query;
    }

    sizeQuery() {
        const sizeQuery = TransactionQuery.allTransactionsSizeQuery + this.where
        return sizeQuery
    }

    getParams(limitOffsetEnabled = true) {
        if (limitOffsetEnabled) {
            return [...this.params, ...this.limitParams]
        } else {
            return this.params
        }

    }

    getSummaryOfTransactions() {
        let resultSummary = {}

        let query = this.sizeQuery()
        let params = this.getParams(false)

        this.db = new BankDatabase()

        const summarystmt = this.db.db.prepare(query);
        const summaryrows = summarystmt.all(params);
        this.count = summaryrows[0].cnt
        this.pages = Math.ceil(this.count / this.pageSize)

        const cln = (str) => str.replace(/\s+/g, ' ').replace(/\n/g, '').trim()

        return {
            pages: this.pages,
            count: this.count,
            debit_total: Math.abs(summaryrows[0].debit_total),
            credit_total: Math.abs(summaryrows[0].credit_total),
            amount_total: Math.abs(summaryrows[0].amount_total),
            pageSize: this.pageSize,
            page: this.pageNumber,
            // TODO: remove this soon for prod
            where: cln(this.where)
        };
    }

    getTransactions(limitOffsetEnabled = true, cleanOutNullAndEmptyValues = true) {

        this.db = new BankDatabase()

        const query = this.getTransactionQuery(limitOffsetEnabled, true)

        // console.log("xxxx",query)
        const stmt = this.db.db.prepare(query);
        let rows = stmt.all(this.getParams(limitOffsetEnabled));

        if (cleanOutNullAndEmptyValues) {
            rows = rows.map(row => {
                return Object.fromEntries(Object.entries(row).filter(([key, value]) => value !== null && value !== ""));
            })
        }

        return rows
    }

    _processPaginationParams() {
        // Pagination parameters setup
        this.pageNumber = this.queryParams.page ? parseInt(this.queryParams.page, 10) : 1;
        this.pageSize = this.queryParams.page_size ? parseInt(this.queryParams.page_size, 10) : 1000;
        this.pageOffset = (this.pageNumber - 1) * this.pageSize;
    }

    // Order By
    // note that the transactions_validator is expected to have validated the column and desc|asc.
    // const validSortColumns = ['datetime', 'account', 'description', ... 'type', 'tags', 'manual_tags'];
    _processOrderByParams() {
        if (this.queryParams.order_by) {
            const [column, direction] = this.queryParams.order_by.split(',')
            this.order_by += ` ORDER BY ${column.trim()} ${direction.trim().toUpperCase()}`
        } else {
            this.order_by += ` ORDER BY datetime DESC, amount desc`
        }
    }

    _processFilterParams() {
        if (this.queryParams.filter) {
            let tqf = new TransactionQueryFilter(this.queryParams.filter)
            this.where += tqf.where
            this.params.push(...tqf.params)
        }
    }

    // NEED TO DEPRECATE THIS
    _processDescriptionAndTagsParams() {

        // Description filter
        if (this.queryParams.description) {
            const d = this.queryParams.description
            this.where += ' AND description LIKE ? OR auto_tags LIKE ? OR manual_tags LIKE ?'
            this.params.push(`%${d}%`, `%${d}%`, `%${d}%`)
        }

        // Tags filter
        if (this.queryParams.tags) {
            const t = this.queryParams.tags
            this.where += ' AND auto_tags LIKE ? OR manual_tags LIKE ?'
            this.params.push(`%${t}%`, `%${t}%`)

        }
    }

    _processRuleParams() {
        // RuleID filter
        let rule = ""
        if (this.queryParams.ruleid) {
            rule = this.fetchRule(this.queryParams.ruleid).rule
        }

        // Rule RAW filter
        // rule="description = /DEPOSIT ZIP CORPORATE FU *REPORT/"
        // we assume it is already decoded
        if (this.queryParams.rule) {
            rule = this.queryParams.rule
        }

        if (rule) {
            const parser = new RuleToSqlParser();

            // where= { sql: , params: , regexEnabled:  };
            const ruleWhere = parser.parse(rule)
            this.where += " AND " + ruleWhere.sql
            this.params.push(...ruleWhere.params)
        }
    }

    _processLimitOffsetParams() {
        this.limit = ` LIMIT ? OFFSET ?`
        this.limitParams.push(this.pageSize, this.pageOffset)
    }


    fetchRule(id) {
        const row = this.db.db.prepare('SELECT * FROM "rule" WHERE id = ?').get(id)
        if (!row) {
            throw new Error(`No rule record found for id ${id}`)
        }
        return row
    }


    // TODO: Changed it so that description is the merged one. So frontend grid has to be adjusted
    static allTransactionsSubView = `
        SELECT 
        t.id,

        t.datetime,
        substr(t.datetime, 1, instr(t.datetime, 'T')-1) AS datetime_without_timezone,

        t.account AS account_number,
        a.shortname AS account_shortname,

        t.description as orig_description,
        te.description as revised_description,
        
        CASE
        WHEN te.description NOT NULL AND te.description != '' THEN 
            te.description
        ELSE
            t.description
        END AS description,

        t.credit,
        t.debit,
        CASE
            WHEN t.debit != '' AND t.debit > 0.0 THEN -t.debit
            WHEN t.credit != '' AND t.credit > 0.0 THEN t.credit
            ELSE 0.0
        END AS amount,
        t.balance,
        t.type,

        /* tags */
        CASE
            WHEN t.tags = '' OR t.tags IS NULL THEN '{}' -- Ensuring valid JSON array
            ELSE t.tags
        END AS auto_tags,
        CASE
            WHEN te.tags = '' OR te.tags IS NULL THEN '[]' -- Ensuring valid JSON array
            ELSE te.tags
        END AS manual_tags,


        /* party */
        CASE
            WHEN t.party = '' OR t.party IS NULL THEN '{}' -- Ensuring valid JSON array
            ELSE t.party
        END AS auto_party,
        CASE
            WHEN te.party = '' OR te.party IS NULL THEN '[]' -- Ensuring valid JSON array
            ELSE te.party
        END AS manual_party,
		

        te.auto_categorize 
        FROM 'transaction' t
        LEFT JOIN 'transaction_enriched' te ON t.id = te.id
        LEFT JOIN 'account' a ON t.account = a.accountid
    `

    static allTransactionsSizeQuery = `
SELECT count(id) as cnt, sum(amount) as amount_total, sum(credit) as credit_total, sum(debit) as debit_total
FROM (${TransactionQuery.allTransactionsSubView}) AS main
WHERE 1=1  
-- AND type<>'BAL'
`
    static allTransactionsQuery = `
SELECT * 
FROM (${TransactionQuery.allTransactionsSubView}) AS main
WHERE 1=1 
-- AND type<>'BAL'
`

}

module.exports = TransactionQuery
