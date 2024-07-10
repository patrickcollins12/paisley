class TransactionQueryFilter {

    constructor(filterObj) {
        this.filter = filterObj
        this.where = ""
        this.params = []
        this._processFilterParams()
    }

    _processFilterParams() {
        // console.log("FILTER!", JSON.stringify(this.filter, null, "\t"))

        for (const [field, filter] of Object.entries(this.filter)) {

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

    // tags, manual_tags and auto_tags need special treatment becasue they're json
    _addSqlTagsWhere(fields, paramsToAdd, NOT = '') {

        // (${value.map(() => '?').join(',')})
        let expressionArray = []
        for (const field of fields) {
            expressionArray.push(`EXISTS (SELECT 1 FROM json_each(main.${field}) WHERE value IN (${paramsToAdd.map(() => '?').join(',')}))\n`
            )
            this.params.push(...paramsToAdd)
        }
        this.where += ` AND ${NOT} ` + this._andOrJoin(expressionArray, "OR")
    }

    // _andOrJoin(["this is x","this is y"], "and|or" )
    _andOrJoin(expressions, condition) {
        if (expressions.length === 1) {
            return expressions[0]
        }
        else {
            return "(\n" + expressions.join(` ${condition} \n`) + ")\n"
        }

    }

    // Helper method to add SQL conditions
    // 'field LIKE ?'

    _addSqlConditionField(condition, fields, paramsToAdd, not = '', andOr) {
        var conditions = []
        for (const field of fields) {

            const re = new RegExp(/\%\%/, 'g')
            const expandedField = condition.replace(re, field)
            conditions.push(expandedField)

            this.params.push(...paramsToAdd)
        }

        let condstr
        if (andOr) {
            condstr = this._andOrJoin(conditions, andOr)
        } else {
            condstr = this._andOrJoin(conditions, not ? " AND " : " OR ")
        }
         
        this.where += ` AND ${not} (${condstr})\n`

        // this.params.push(...paramsToAdd)
    }


    isNumeric(str) {
        return /^[\+\-]?\d*\.?\d+$/.test(str);
    }

    _validateFilterField(field, operator, value) {
        const validFields = [
            'all', 'description', 'revised_description', 'orig_description',
            'tags', 'manual_tags', 'auto_tags',
            'party', 'manual_party', 'auto_party',
            'type', 'debit', 'credit', 'amount', 'balance',
            'account', 'account_number','account_shortname',  'datetime'
        ]
        // const validOperators = ['>=', '>', '<', '<=', '=',]

        if (!validFields.includes(field.toLowerCase())) {
            throw new Error(`Invalid filter field: "${field}". Must be one of ${validFields}`)
        }
        // if (!validOperators.includes(operator.toLowerCase())) {
        //     throw new Error(`Invalid operator: "${field}". Must be one of ${validOperators}`)
        // }
    }

    processFilter(field, operator, value) {
        this._validateFilterField(field, operator, value)

        let abs_val = false
        let NOT = ""
        let IS_NULL = ""

        // deal with modifiers abs and not_
        if (operator.startsWith('abs')) {
            operator = operator.slice(3)
            abs_val = true
        }

        if (operator.startsWith('not_')) {
            operator = operator.slice(4)
            NOT = "NOT"
            IS_NULL = " OR %% IS NULL"
        }

        let fields = [field]

        // if (field === "description") {
        //     fields = ["orig_description", "revised_description"]
        // }

        if (field === "tags") {
            fields = ["auto_tags", "manual_tags"]
        }

        if (field === "party") {
            fields = ["auto_party", "manual_party"]
        }

        if (field === "all") {
            fields = ["description", "auto_tags", "manual_tags", "type", "auto_party", "manual_party"]
        }


        switch (operator.toLowerCase()) {
            case '>=':
            case '>':
            case '<':
            case '<=':
            case '=':
            case '<>':
                if (field === "datetime") {
                    this._addSqlConditionField(`date(%%) ${operator} date(?)`, fields, [value], NOT)
                } else {
                    if (this.isNumeric(value)) {
                        if (abs_val) {
                            this._addSqlConditionField(`ABS(%%) ${operator} CAST(? AS NUMERIC)`, fields, [value], NOT)
                        } else {
                            this._addSqlConditionField(`%% ${operator} CAST(? AS NUMERIC)`, fields, [value], NOT)
                        }
                    } else {
                        this._addSqlConditionField(`%% ${operator} ?`, fields, [value], NOT)
                    }
                }
                break;
            case 'startswith':
                this._addSqlConditionField(`(%% LIKE ? ${IS_NULL})`, fields, [`${value}%`], NOT)
                break;
            case 'endswith':
                this._addSqlConditionField(`(%% LIKE ? ${IS_NULL})`, fields, [`%${value}`], NOT)
                break;
            case 'contains':
                this._addSqlConditionField(`(%% LIKE ? ${IS_NULL})`, fields, [`%${value}%`], NOT)
                break;
            case 'regex':
                this._addSqlConditionField(`(%% REGEXP ? ${IS_NULL})`, fields, [value], NOT)
                break;
            case 'in':
                if (/(tags|party)/.test(field)) {
                    this._addSqlTagsWhere(fields, value, NOT)

                } else {
                    this._addSqlConditionField(`(%% IN (${value.map(() => '?').join(',')}) ${IS_NULL})`, fields, [...value], NOT)
                }

                break;
            case 'empty':
                if (fields.length > 1) {
                    this._addSqlConditionField(`(%% IS NULL OR %% = '' OR %% = '[]')`, fields, [], NOT, "AND")
                } else {
                    this._addSqlConditionField(`(%% IS NULL OR %% = '' OR %% = '[]')`, fields, [], NOT, "OR")
                }

                break;

            default:
                throw new Error(`Invalid operator: "${operator}". Expected, startsWith, in, not null, <,>, etc`)
        }
    }

}

module.exports = TransactionQueryFilter
