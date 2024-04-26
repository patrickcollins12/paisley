const RuleToSqlParser = require('./RuleToSqlParser')
const BankDatabase = require('./BankDatabase')

class TransactionQuery {

    // Step 1
    // const tq = new TransactionQuery(req.query)
    constructor(params) {
        this._resetQueries()
        this.queryParams = params
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

        return {
            pages: this.pages,
            count: this.count,
            pageSize: this.pageSize,
            page: this.pageNumber
        };
    }

    getTransactions(limitOffsetEnabled = true, cleanOutNullAndEmptyValues = true) {

        this.db = new BankDatabase()

        const mainQuery = this.getTransactionQuery(limitOffsetEnabled, true)

        const stmt = this.db.db.prepare(mainQuery);
        let rows = stmt.all(this.getParams(limitOffsetEnabled));

        if (cleanOutNullAndEmptyValues) {
            rows = rows.map(row => {
                return Object.fromEntries(Object.entries(row).filter(([key, value]) => value !== null && value !== ""));
            })
        }

        return rows
    }


    // Helper method to add SQL conditions
    _addSqlCondition(condition, paramsToAdd) {
        this.where += ` AND (${condition})\n`
        this.params.push(...paramsToAdd)
    }
    
    // Helper method to add SQL conditions
    _addSqlConditionField(condition, fields, paramsToAdd) {
        var conditions = []

        this.where += ` AND (${condition})\n`
        this.params.push(...paramsToAdd)
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
            this.order_by += ` ORDER BY datetime DESC`
        }
    }

    // GET /transactions?
    //   &filter[description]="exact string"
    //   &filter[description][startsWith]=Employer
    //   &filter[description][endsWith]="bye"
    //   &filter[description][contains]="partial string"
    //   &filter[tags][0]=Tag>1
    //   &filter[tags][1]=Tag>2
    //   &filter[tags][is null]=
    //   &filter[tags][is not null]=
    //   &filter[merchant][in][0]=Bunnings
    //   &filter[merchant][in][1]=Kmart
    //   &filter[date][>=]=2023-03-01
    //   &filter[date][<=>]=2023-03-31
    //   &filter[amount]=50
    //   &filter[amount][>]=50
    //   &filter[amount][>=]=100
    // go through each parameter one-by-one
    _processFilterParams() {
        if (this.queryParams.filter) {
            const filters = this.queryParams.filter
            // console.log(JSON.stringify(filters, null, "\t"))

            for (const [field, filter] of Object.entries(filters)) {

                if (typeof filter === 'string') {
                    this.processFilter(field, "=", filter)
                }
                else if (typeof filter === 'object' && filter !== null) {
                    for (const [operator, value] of Object.entries(filter)) {
                        this.processFilter(field, operator, value)
                    }
                }
            }
        }
    }

    isNumeric(str) {
        return /^[\+\-]?\d*\.?\d+$/.test(str);
    }

    _validateFilterField(field,operator,value) {
        const validFields = ['description','tags','type','debit','credit','amount','balance','account','datetime']
        if ( ! validFields.includes(field.toLowerCase())) {
            throw new Error(`Invalid filter field: "${field}". Must be one of ${validFields}`)
        }
        const validOperators = ['>=','>','<','<=','=',]
        if ( ! validFields.includes(field.toLowerCase())) {
            throw new Error(`Invalid filter field: "${field}". Must be one of ${validFields}`)
        }    
    }

    processFilter(field, operator, value) {
        this._validateFilterField(field,operator,value)

        let abs_val = false
        if (operator.startsWith('abs')) {
            operator = operator.slice(3)
            abs_val = true
        }

        let fields = [field]
        if (field === "description") {
            fields = ["description","revised_description"]
        }
        if (field === "tags") {
            fields = ["tags","manual_tags"]
        }

        switch (operator.toLowerCase()) {
            case '>=':
            case '>':
            case '<':
            case '<=':
            case '=':
                if (field === "datetime") {
                    this._addSqlCondition(`date(${field}) ${operator} date(?)`, [value])
                } else {
                    if (this.isNumeric(value)) {
                        if (abs_val) {
                            this._addSqlCondition(`ABS(${field}) ${operator} CAST(? AS NUMERIC)`, [value])
                        } else {
                            this._addSqlCondition(`${field} ${operator} CAST(? AS NUMERIC)`, [value])
                        }
                    } else {
                        this._addSqlCondition(`${field} ${operator} ?`, [value])
                    }
                }
                break;
            case 'startswith':
                this._addSqlCondition(`${field} LIKE ?`, [`${value}%`])
                break;
            case 'endswith':
                this._addSqlCondition(`${field} LIKE ?`, [`%${value}`])
                break;
            case 'contains':
                this._addSqlCondition(`${field} LIKE ?`, [`%${value}%`])
                break;
            case 'regex':
                this._addSqlCondition(`${field} REGEXP ?`, [value])
                break;
            case 'in':
                this._addSqlCondition(`${field} IN (${value.map(() => '?').join(',')})`, [...value])
                break;
            case 'is null':
                this._addSqlCondition(`${field} IS NULL OR ${field} = ''`, [])
                break;
            case 'is not null':
                this._addSqlCondition(`${field} IS NOT NULL AND ${field} <> ''`, [])
                break;
    
            default:
                throw new Error(`Invalid operator: "${operator}". Expected, startsWith, in, not null, <,>, etc`)
        }
    }

    // NEED TO DEPRECATE THIS
    _processDescriptionAndTagsParams() {

        // Description filter
        if (this.queryParams.description) {
            const d = this.queryParams.description
            this._addSqlCondition('description LIKE ? OR tags LIKE ? OR manual_tags LIKE ?', [`%${d}%`, `%${d}%`, `%${d}%`])
        }

        // Tags filter
        if (this.queryParams.tags) {
            const t = this.queryParams.tags
            this._addSqlCondition('tags LIKE ? OR manual_tags LIKE ?', [`%${t}%`, `%${t}%`])
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
            const where = parser.parse(rule)

            // console.log(`${rule} where: ${JSON.stringify(where)}`)
            this._addSqlCondition(where.sql, where.params)
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


    static allTransactionsSubView = `
        SELECT 
        t.id,
        t.datetime,
        t.account,

        t.description as description,
        te.description as revised_description,

        t.credit,
        t.debit,

        CASE
            WHEN t.debit != '' AND t.debit > 0.0 THEN  -t.debit
            WHEN t.credit != '' AND t.credit > 0.0 THEN  t.credit
            ELSE 0.0
        END AS amount,

        t.balance,
        t.type,

        CASE
            WHEN t.tags = '' OR t.tags IS NULL THEN ''
            ELSE t.tags
        END AS tags,

        te.tags AS manual_tags,
        te.auto_categorize 
        FROM 'transaction' t
        LEFT JOIN 'transaction_enriched' te ON t.id = te.id
    `

    static allTransactionsSizeQuery = `
SELECT count(id) as cnt
FROM (${TransactionQuery.allTransactionsSubView})
WHERE 1 = 1 
`

    static allTransactionsQuery = `
SELECT * 
FROM (${TransactionQuery.allTransactionsSubView})
WHERE 1=1
`

}

module.exports = TransactionQuery
