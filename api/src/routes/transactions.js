const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const BankDatabase = require('../BankDatabase'); // Adjust the path as necessary

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Retrieve a list of transactions
   *     description: >
 *       Retrieve a list of transactions with optional filters for description, tags, and pagination. Supports ordering by specified columns and directions. Returns both the transactions and a summary of results including total count, pages, page size, and the current page.
 *     tags:
 *       - Transactions
 *     parameters:
 *       - in: query
 *         name: description
 *         required: false
 *         description: Filter transactions by description (max length 200 characters).
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         required: false
 *         description: Filter transactions by tags (max length 200 characters).
 *         schema:
 *           type: string
 *       - in: query
 *         name: order_by
 *         required: false
 *         description: Order transactions by a specified column and direction (e.g., datetime,desc). Supported columns include datetime, account, description, credit, debit, amount, balance, type, tags, manual_tags.
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         required: false
 *         description: Specify the page of transactions to retrieve. Must be a positive integer.
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page_size
 *         required: false
 *         description: Specify the number of transactions to retrieve per page. Must be a positive integer and cannot exceed 10000.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of transactions and a summary of the result set.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 resultSummary:
 *                   $ref: '#/components/schemas/ResultSummary'
 *       400:
 *         description: Input validation error.
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The transaction ID (hash).
 *           example: "a88f32a5e80f9c2ee131af93b716b1c7bdd51abf6b1134e8ceb8ee8d198d182e"
 *         datetime:
 *           type: string
 *           format: date-time
 *           description: The date and time of the transaction.
 *         account:
 *           type: string
 *           description: The account number associated with the transaction.
 *         description:
 *           type: string
 *           description: The transaction description.
 *         orig_description:
 *           type: string
 *           description: The original transaction description before any modifications.
 *         credit:
 *           type: number
 *           format: float
 *           description: The credit amount.
 *         debit:
 *           type: number
 *           format: float
 *           description: The debit amount.
 *         amount:
 *           type: number
 *           format: float
 *           description: The net transaction amount (negative for debits, positive for credits).
 *         balance:
 *           type: number
 *           format: float
 *           description: The account balance after the transaction.
 *         type:
 *           type: string
 *           description: The type of transaction.
 *         tags:
 *           type: string
 *           description: The tags associated with the transaction.
 *           example: "[\"Blah blah\"]"
 *         manual_tags:
 *           type: string
 *           description: Manually assigned tags for the transaction.
 *           example: "[\"Household > Utilities > Mobile\",\"MobileMatters (Merchant)\"]"
 *         auto_categorize:
 *           type: integer
 *           format: boolean
 *           description: Indicates if the transaction was auto-categorized.
 *           example: 1
 *     ResultSummary:
 *       type: object
 *       properties:
 *         count:
 *           type: integer
 *           description: Total number of transactions matching the filter criteria.
 *           example: 388
 *         pages:
 *           type: integer
 *           description: Total number of pages available.
 *           example: 16
 *         pageSize:
 *           type: integer
 *           description: Number of transactions per page.
 *           example: 25
 *         page:
 *           type: integer
 *           description: The current page number.
 *           example: 2
 */

router.get('/transactions', [

  // Validation chains
  query('description').optional().isLength({ max: 200 }).withMessage('Description input exceeds the maximum length of 200 characters.'),
  query('tags').optional().isLength({ max: 200 }).withMessage('Tags input exceeds the maximum length of 200 characters.'),
  query('order_by').optional().custom(value => {
    const validSortColumns = ['datetime', 'account', 'description', 'credit', 'debit', 'amount', 'balance', 'type', 'tags', 'manual_tags'];
    const parts = value.split(',');
    if (parts.length !== 2 || !validSortColumns.includes(parts[0].trim()) || !['asc', 'desc', 'ASC', 'DESC'].includes(parts[1].trim().toUpperCase())) {
      throw new Error('Invalid order_by parameter');
    }
    return true;
  }),
  query('page').optional().isInt({ min: 1 }).withMessage("'page' must be a positive integer."),
  query('page_size').optional().isInt({ min: 1, max: 10000 }).withMessage("'page_size' must be a positive integer and cannot exceed 10000."),
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Pagination parameters setup
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.page_size ? parseInt(req.query.page_size, 10) : 1000;


  let db = new BankDatabase();
  let params = [];
  let andQuery = ""

  // Description filter
  if (req.query.description) {
    const d = req.query.description
    andQuery += ` AND (t.description LIKE ? OR t.tags LIKE ? OR te.tags LIKE ?)`;
    params.push(`%${d}%`,`%${d}%`,`%${d}%`);
  }
  
  // // Description filter
  // if (req.query.description) {
  //   andQuery += ` AND t.description LIKE ?`;
  //   params.push(`%${req.query.description}%`);
  // }

  // Tags filter
  if (req.query.tags) {
    andQuery += ` AND (t.tags LIKE ? OR te.tags LIKE ?)`;
    params.push(`%${req.query.tags}%`, `%${req.query.tags}%`);
  }

//   CASE
//   WHEN te.description IS NOT NULL THEN te.description
//   ELSE t.description
// END AS description,
// CASE
//   WHEN te.description IS NOT NULL THEN t.description
//   ELSE NULL
// END AS orig_description,


  let query = `
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
      WHERE 1=1
      ${andQuery}
      `;

  let sizeQuery = `
      SELECT count(t.id) 'count'
      FROM 'transaction' t
      LEFT JOIN 'transaction_enriched' te ON t.id = te.id
      WHERE 1 = 1
      ${andQuery}
      `

  // Order By
  if (req.query.order_by) {
    const [column, direction] = req.query.order_by.split(',');
    query += ` ORDER BY ${column.trim()} ${direction.trim().toUpperCase()}`;
  } else {
    query += ` ORDER BY datetime DESC`;
  }

  // results Summary query
  let resultSummary = {}
  try {
    const stmt = db.db.prepare(sizeQuery);
    const rows = stmt.all(params);
    // console.log("sizeQuery response>> ", rows)
    const count = rows[0].count
    const pages = Math.ceil(count / pageSize)

    resultSummary = {
      count: count,
      pages: pages,
      pageSize: pageSize,
      page: page
    };

    // console.log(resultSummary)

  } catch (err) {
    console.error("error: ", err.message);
    res.status(500).json({ "error": err.message });
  }

  // Pagination
  const offset = (page - 1) * pageSize;
  query += ` LIMIT ? OFFSET ?`;
  params.push(pageSize, offset);

  // page of results query = actual query results
  let finalResults = {}
  try {

    // console.log(query)
    const stmt = db.db.prepare(query);
    const rows = stmt.all(params);

    finalResults = rows.map(row => {
      return Object.fromEntries(Object.entries(row).filter(([key, value]) => value !== null && value !== ""));
    });

  } catch (err) {
    console.error("error: ", err.message);
    res.status(500).json({ "error": err.message });
  }

  res.json(
    {
      'results': finalResults,
      'resultSummary': resultSummary,
    });

});

module.exports = router;