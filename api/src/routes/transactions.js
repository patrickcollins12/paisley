const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const BankDatabase = require('../BankDatabase'); // Adjust the path as necessary

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Retrieve a list of transactions
 *     description: Retrieve a list of transactions with optional filters for description, tags, and pagination.
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: description
 *         required: false
 *         description: Filter transactions by description.
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         required: false
 *         description: Filter transactions by tags.
 *         schema:
 *           type: string
 *       - in: query
 *         name: order_by
 *         required: false
 *         description: Order transactions by a specified column and direction (e.g., datetime,desc).
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         required: false
 *         description: Specify the page of transactions to retrieve.
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page_size
 *         required: false
 *         description: Specify the number of transactions to retrieve per page.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of transactions.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Input validation error.
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The transaction ID.
 *         datetime:
 *           type: string
 *           format: date-time
 *           description: The date and time of the transaction.
 *         description:
 *           type: string
 *           description: The transaction description.
 *         credit:
 *           type: number
 *           format: float
 *           description: The credit amount.
 *         debit:
 *           type: number
 *           format: float
 *           description: The debit amount.
 *         balance:
 *           type: number
 *           format: float
 *           description: The account balance after the transaction.
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
    andQuery += ` AND t.description LIKE ?`;
    params.push(`%${req.query.description}%`);
  }

  // Tags filter
  if (req.query.tags) {
    andQuery += ` AND (t.tags LIKE ? OR te.tags LIKE ?)`;
    params.push(`%${req.query.tags}%`, `%${req.query.tags}%`);
  }

  let query = `
      SELECT 
        t.id,
        t.datetime,
        t.account,
        CASE
          WHEN te.description IS NOT NULL THEN te.description
          ELSE t.description
        END AS description,
        CASE
          WHEN te.description IS NOT NULL THEN t.description
          ELSE NULL
        END AS orig_description,
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