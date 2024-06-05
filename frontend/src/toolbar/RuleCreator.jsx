export const stringOperators = {
  contains: { label: "contains", operator: '=', short: null },
  doesnotcontain: { label: "does not contain", operator: '<>', short: "not" },
  regex: { label: "regex", operator: '=', short: null, surround: "/", postProcess: (value) => `/${value}/i` },
  matchesword: { label: "matches word", operator: '', short: null, surround: "'", postProcess: (value) => `/\b${value}\b/i` },
  isblank: { label: "is blank", short: "is blank", operator: 'isblank' },
  isnotblank: { label: "is not blank", short: "not blank", operator: 'notisblank' },
  isedited: { label: "is edited", short: "is edited", operator: 'isedited' },
}