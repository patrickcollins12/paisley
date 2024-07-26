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
    formatValue: (value) => `/${value}/i`
  },
  string_not_regex: {
    id: 'string_not_regex',
    label: "does not match regex",
    operator: 'not_regex',
    short: 'not',
    formatValue: (value) => `/${value}/i`
  },
  string_match_word: {
    id: 'string_match_word',
    label: "matches word",
    operator: 'regex',
    short: '',
    formatValue: (value) => `/\\b${value}\\b/i`
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

export const dateOperators = {
  date_after: {
    id: 'date_after',
    label: 'On or after',
    operator: '>=',
    short: '>'
  },
  date_before: {
    id: 'date_before',
    label: 'On or before',
    operator: '<=',
    short: '<'
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

export function getOperatorById(id) {
  const mergedLookup = {
    ...stringOperators,
    ...lookupOperators,
    ...dateOperators,
    ...numberOperators,
    ...allFilterOperators
  }

  if (!(id in mergedLookup)) return null;

  return mergedLookup[id];
}

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