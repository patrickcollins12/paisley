const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');
const BankDatabase = require('../BankDatabase'); // Adjust the path as necessary
const RuleToSqlParser = require('../RuleToSqlParser');

const { validateTransactions } = require('./transactions_validator');
const TransactionQuery = require('../TransactionQuery.cjs');

// TODO
// GET /transactions?
//   filter[accounts]=account b,account c
//   &filter[tags][startsWith]=Employer
//   &filter[tags][contains]=Secure
//   &filter[tags]=Tag>1,Tag>2
//   &filter[merchant][is_empty]
//   &filter[merchant][is_any]=Bunnings,Kmart
//   &filter[merchant][is_not]=Bunnings
//   &filter[date][gte]=2023-03-01
//   &filter[date][lte]=2023-03-31
//   &filter[date][btwn]=2023-03-01,2023-03-31
//   &filter[amount][between]=100,300
//   &filter[amount][lte]=100
//   &filter[amount][gte]=100
//   &sort=-date,-amount
//   &page=1
//   &pageSize=10


router.get('/transactions', validateTransactions, async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {

    let db = new BankDatabase();

    console.log(JSON.stringify(req.query,null,"\t"))

    // calculate the where clause based on the request
    const tq = new TransactionQuery(req.query)
    tq.processParams()

    // results Summary query
    let resultSummary = tq.getSummaryOfTransactions()

    // page of results query = actual query results
    let finalResults = tq.getTransactions(true,true)

    res.json(
      {
        'resultSummary': resultSummary,
        'results': finalResults,
      });

  } catch (err) {
    console.error("error: ", err.message);
    res.status(500).json({ "error": err.message });
  }

});

module.exports = router;

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Retrieve a list of transactions
 *     description: >
 *       Retrieve a list of transactions with optional filters for description, tags, pagination, and dynamic rule-based filtering. Supports ordering by specified columns and directions. Returns both the transactions and a summary of results including total count, pages, page size, and the current page.
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
 *       - in: query
 *         name: rule
 *         required: false
 *         description: Apply a custom rule filter to transactions, encoded as a URL parameter.
 *         schema:
 *           type: string
 *           example: "description%20%3D%20%2FDEPOSIT%20ZIP%20CORPORATE%20FU%20*REPORT%2F"
 *       - in: query
 *         name: ruleid
 *         required: false
 *         description: Apply a stored rule filter by rule ID to transactions.
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
