import { DateTime } from "luxon"

/**
 * @typedef {Object} OperatorDefinition
 * @property {string} id
 * @property {string} label
 * @property {string} operator
 * @property {string} short
 * @property {boolean} default
 */

/**
 * @typedef {Object} FilterExpression
 * @property {string} field Field ID that the filter expression applies to (e.g. 'account').
 * @property {OperatorDefinition} operatorDefinition Filter operator to apply to the field.
 * @property value Value to filter for using the operator.
 */

export const stringOperators = {
  string_contains: {
    id: 'string_contains',
    label: "contains",
    operator: 'contains',
    short: '',
    default: true
  },
  string_not_contains: {
    id: 'string_not_contains',
    label: "does not contain",
    operator: 'not_contains',
    short: "not"
  },
  string_regex: {
    id: 'string_regex',
    label: "matches regex",
    operator: 'regex',
    short: '',
    getValue: (expression) => `/${expression.value}/i`
  },
  string_not_regex: {
    id: 'string_not_regex',
    label: "does not match regex",
    operator: 'not_regex',
    short: 'not',
    getValue: (expression) => `/${expression.value}/i`
  },
  string_match_word: {
    id: 'string_match_word',
    label: "matches word",
    operator: 'regex',
    short: '',
    getValue: (expression) => `/\\b${expression.value}\\b/i`
  },
  string_blank: {
    id: 'string_blank',
    label: "is blank",
    operator: 'empty',
    operatorOnly: true,
  },
  string_not_blank: {
    id: 'string_not_blank',
    label: "is not blank",
    operator: 'not_empty',
    short: "not blank",
    operatorOnly: true,
  },
  string_edited: {
    id: 'string_edited',
    label: "is edited",
    operator: 'edited',
    operatorOnly: true,
  },
};

export const lookupOperators = {
  lookup_is: {
    id: 'lookup_is',
    label: "is",
    operator: 'in',
    short: ''
  },
  lookup_any_of: {
    id: 'lookup_any_of',
    label: "is any of",
    operator: 'in',
    short: '',
    default: true
  },
  lookup_not_any_of: {
    id: 'lookup_not_any_of',
    label: "is not any of",
    operator: 'not_in',
    short: 'not'
  },
  lookup_blank: {
    id: 'lookup_blank',
    label: "is blank",
    operator: 'empty',
    operatorOnly: true,
  },
  lookup_not_blank: {
    id: 'lookup_not_blank',
    label: "is not blank",
    operator: 'not_empty',
    operatorOnly: true,
  }
};


export const lookupTagOperators = {
  lookup_any_of: {
    id: 'lookup_any_of',
    label: "starts with",
    operator: 'in',
    short: '',
    default: true
  },
  lookup_not_any_of: {
    id: 'lookup_not_any_of',
    label: "does not start with",
    operator: 'not_in',
    short: 'not'
  },
  lookup_blank: {
    id: 'lookup_blank',
    label: "is blank",
    operator: 'empty',
    operatorOnly: true,
  },
  lookup_not_blank: {
    id: 'lookup_not_blank',
    label: "is not blank",
    operator: 'not_empty',
    operatorOnly: true,
  }
};

export const namedDateRangePrefix = '__named_range__::';
export const namedDateRanges = [
  {
    id: 'last_7_days', label: 'Last 7 days', group: 1, getDateRange: () => {
      return {
        from: DateTime.now().minus({days: 7}),
        to: DateTime.now()
      };
    }
  },
  {
    id: 'last_1_month', label: 'Last 1 month', group: 1, getDateRange: () => {
      return {
        from: DateTime.now().minus({months: 1}),
        to: DateTime.now()
      };
    }
  },
  {
    id: 'last_3_months', label: 'Last 3 months', group: 1, getDateRange: () => {
      return {
        from: DateTime.now().minus({months: 3}),
        to: DateTime.now()
      };
    }
  },
  {
    id: 'last_6_months', label: 'Last 6 months', group: 1, getDateRange: () => {
      return {
        from: DateTime.now().minus({months: 6}),
        to: DateTime.now()
      };
    }
  },
  {
    id: 'last_12_months', label: 'Last 12 months', group: 1, getDateRange: () => {
      return {
        from: DateTime.now().minus({months: 12}),
        to: DateTime.now()
      };
    }
  },
  {
    id: 'this_month', label: 'This month', group: 2, getDateRange: () => {
      return {
        from: DateTime.now().startOf('month'),
        to: DateTime.now()
      };
    }
  },
  {
    id: 'this_month', label: 'This quarter', group: 2, getDateRange: () => {
      return {
        from: DateTime.now().startOf('quarter'),
        to: DateTime.now()
      };
    }
  },
  {
    id: 'this_year', label: 'This year', group: 2, getDateRange: () => {
      return {
        from: DateTime.now().startOf('year'),
        to: DateTime.now()
      };
    }
  },
  {
    id: 'last_week', label: 'Last week', group: 3, getDateRange: () => {
      return {
        from: DateTime.now().minus({weeks: 1}).startOf('week'),
        to: DateTime.now().minus({weeks: 1}).endOf('week')
      };
    }
  },
  {
    id: 'last_month', label: 'Last month', group: 3, getDateRange: () => {
      return {
        from: DateTime.now().minus({months: 1}).startOf('month'),
        to: DateTime.now().minus({months: 1}).endOf('month')
      };
    }
  },
  {
    id: 'last_quarter', label: 'Last quarter', group: 3, getDateRange: () => {
      return {
        from: DateTime.now().minus({quarters: 1}).startOf('quarter'),
        to: DateTime.now().minus({quarters: 1}).endOf('quarter')
      };
    }
  },
  {
    id: 'last_year', label: 'Last year', group: 3, getDateRange: () => {
      return {
        from: DateTime.now().minus({years: 1}).startOf('year'),
        to: DateTime.now().minus({years: 1}).endOf('year')
      };
    }
  },
];
export const dateOperators = {
  date_after: {
    id: 'date_after',
    label: 'On or after',
    operator: '>=',
    short: '>',
    /**
     * @param {FilterExpression} expression
     */
    getValue: (expression) => {
      const namedRangeIndex = expression.value.toString().indexOf(namedDateRangePrefix);
      if (namedRangeIndex === -1) return expression.value;

      const namedRangeName = expression.value.toString().substring(namedRangeIndex + namedDateRangePrefix.length);
      const namedRange = namedDateRanges.find(x => x.id === namedRangeName);
      if (!namedRange) return expression.value;

      return namedRange.getDateRange().from.toISODate();
    }
  },
  date_before: {
    id: 'date_before',
    label: 'On or before',
    operator: '<=',
    short: '<',
    /**
     * @param {FilterExpression} expression
     */
    getValue: (expression) => {
      const namedRangeIndex = expression.value.toString().indexOf(namedDateRangePrefix);
      if (namedRangeIndex === -1) return expression.value;

      const namedRangeName = expression.value.toString().substring(namedRangeIndex + namedDateRangePrefix.length);
      const namedRange = namedDateRanges.find(x => x.id === namedRangeName);
      if (!namedRange) return expression.value;

      return namedRange.getDateRange().to.toISODate();
    }
  },
  date_between: {
    id: 'date_between',
    label: "between",
    operator: '',
    short: '',
  }
};

export const numberOperators = {
  number_abs_equals: {
    id: 'number_abs_equals',
    label: "equals",
    operator: 'abs=',
    short: '',
    default: true
  },
  number_abs_gt: {
    id: 'number_abs_gt',
    label: "greater than",
    operator: 'abs>',
    short: '>',
  },
  number_abs_lt: {
    id: 'number_abs_lt',
    label: "less than",
    operator: 'abs<',
    short: '<',
  },
  number_between: {
    id: 'number_between',
    label: "between",
    operator: '',
    short: '',
  }
};

export const allFilterOperators = {
  all_contains: {
    id: 'all_contains',
    label: 'contains',
    operator: 'contains',
    short: ''
  }
};

// Collect all operator definitions into a single map for easy lookup
const allOperators = {
  ...stringOperators,
  ...lookupOperators,
  ...lookupTagOperators,
  ...dateOperators,
  ...numberOperators,
  ...allFilterOperators
}

/**
 * Returns an operator definition matching the given ID.
 * @param {string} id 
 * @returns {OperatorDefinition | undefined}
 */
export function getOperatorById(id) {
  const operator = allOperators[id];
  if (!operator) {
    console.warn(`[FilterExpression] Operator not found for id: '${id}'. Available operators:`, Object.keys(allOperators));
  }
  return operator;
}

/**
 * Creates a new filter expression object from a field name, operator definition and filter value.
 * @param {string} field Field ID that the filter expression applies to (e.g. 'account').
 * @param {OperatorDefinition} operatorDefinition Filter operator to apply to the field.
 * @param value Value to filter for using the operator.
 * @returns {FilterExpression}
 */
export function filterExpression(field, operatorDefinition, value) {
  return {
    field,
    operatorDefinition,
    value
  };
}

export function defaultOperator(operators) {
  for (const operatorId of Object.keys(operators)) {
    const operatorDef = operators[operatorId];
    if ('default' in operatorDef) {
      return operatorId;
    }
  }

  return Object.keys(operators)[0];
}