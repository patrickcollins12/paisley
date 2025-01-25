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
    // 1. fields:  [ 'auto_tags', 'manual_tags' ]
    // 2. paramsToAdd:  [ 'Transfer > CDIA outbound', 'Business > Legal' ]
    // 3. NOT:  NOT
    // OUTPUT:
    //     query output:
    //     EXISTS (
    //         SELECT 1 
    //         FROM json_each(main.manual_tags) 
    //         WHERE json_each.value LIKE ? OR json_each.value LIKE ?
    //     )
    //     params:
    //     [ 'Transfer%', 'Financial > Balance Check%' ]
    _addSqlTagsWhere(fields, paramsToAdd, NOT = '') {
        // basic guard, but shouldn't happen
        if (!paramsToAdd.length) return;

        let expressionArray = []
        for (const field of fields) {

            let query = "";
            let params = paramsToAdd.map(value => `${value}%`); // Adjust values for LIKE patterns
            let likeConditions = params.map(() => `json_each.value LIKE ?`).join(' OR ');

            // Determine the JSON field to process based on the input field
            let jsonField = "";
            switch (field) {
                case "auto_tags":
                    jsonField = "json_extract(auto_tags, '$.tags')";
                    break;
                case "auto_party":
                    jsonField = "json_extract(auto_party, '$.party')";
                    break;
                case "manual_party":
                case "manual_tags":
                    jsonField = `main.${field}`;
                    break;
                default:
                    throw new Error(`Unsupported field: ${field}`);
            }

            // Build the query using the simplified structure
            query = `EXISTS (
                        SELECT 1 
                        FROM json_each(${jsonField}) 
                        WHERE ${likeConditions}
                    )`;

            // console.log("query", query)
            // console.log("params", params)

            expressionArray.push(query)
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
            'account', 'account_number', 'account_shortname',
            'datetime', "datetime_without_timezone"
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
            fields = ["orig_description", "revised_description", "account_shortname", "auto_tags", "manual_tags", "type", "auto_party", "manual_party"]
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
                            this._addSqlConditionField(`ABS(%%) ${operator} CAST(? AS NUMERIC) AND %% NOT NULL AND %% != '' AND %% <> 0`, fields, [value], NOT)
                        } else {
                            this._addSqlConditionField(`%% ${operator} CAST(? AS NUMERIC) AND %% NOT NULL AND %% != '' AND %% <> 0`, fields, [value], NOT)
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
                    this._addSqlConditionField(`(%% IS NULL OR %% = '' OR %% = '{}' OR %% = '[]')`, fields, [], NOT, "AND")
                } else {
                    this._addSqlConditionField(`(%% IS NULL OR %% = '' OR %% = '{}' OR %% = '[]')`, fields, [], NOT, "OR")
                }

                break;

            default:
                throw new Error(`Invalid operator: "${operator}". Expected, startsWith, in, not null, <,>, etc`)
        }
    }

}

module.exports = TransactionQueryFilter
