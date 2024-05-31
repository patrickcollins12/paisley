const express = require('express');
const router = express.Router();
const BankDatabase = require('../BankDatabase'); // Adjust the path as necessary

const JWTAuthenticator = require('../JWTAuthenticator');

router.get('/api/balances', JWTAuthenticator.authenticateToken, async (req, res) => {
  let db = new BankDatabase();
  let query = `select a.*, l.account, t.balance, l.latest_balance_date from 
  account a
  LEFT JOIN 'transaction' t on a.accountid = t.account
  INNER JOIN
  (select id, account, max(datetime) latest_balance_date from 'transaction' 
  group by account ) l
  on t.account = l.account
  AND t.id = l.id
  order by a.institution asc, a.name asc
`;

  try {
    const stmt = db.db.prepare(query);
    const rows = stmt.all()

    let accountsObject = {};
    for (let row of rows) {
      accountsObject[row.account] = row;
    }
        
    res.json(accountsObject);

  } catch (err) {
    console.log("error: ", err.message);
    res.status(400).json({ "error": err.message });
  }
});

module.exports = router;



/**
 * @swagger
 * components:
 *   schemas:
 *     Balance:
 *       type: object
 *       properties:
 *         account:
 *           type: string
 *           description: The account identifier
 *         balance:
 *           type: number
 *           description: The current balance of the account
 *         latest_balance_date:
 *           type: string
 *           format: date-time
 *           description: The date and time of the latest balance update
 */

/**
 * @swagger
 * tags:
 *   name: Balances
 *   description: API for managing bank balances
 * /api/balances:
 *   get:
 *     summary: Get all account balances
 *     tags: [Balances]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: The list of account balances
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 $ref: '#/components/schemas/Balance'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */