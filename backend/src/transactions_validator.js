const { query } = require('express-validator')

const validateTransactions = [
  // NOTE: for simplicity filter[] validation occurs in TransactionQuery.processFilter()
  query('rule')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Rule input exceeds the maximum length of 2000 characters.'),
  query('ruleid')
    .optional()
    .isInt({ min: 0 })
    .withMessage("'ruleid' must be a positive integer."),
  query('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description input exceeds the maximum length of 200 characters.'),
  query('tags')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Tags input exceeds the maximum length of 200 characters.'),
  query('order_by')
    .optional()
    .custom(value => {
      const validSortColumns = ['datetime', 'account', 'account_number', 'account_shortname', 'description', 'credit', 'debit', 'amount', 'balance', 'type', 'tags', 'manual_tags'];
      const parts = value.split(',');
      if (parts.length !== 2 || !validSortColumns.includes(parts[0].trim()) || !['asc', 'desc', 'ASC', 'DESC'].includes(parts[1].trim().toUpperCase())) {
        throw new Error('Invalid order_by parameter');
      }
      return true;
    }),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage("'page' must be a positive integer."),
  query('page_size')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("'page_size' must be a positive integer and cannot exceed 10000."),
]

module.exports = { validateTransactions }