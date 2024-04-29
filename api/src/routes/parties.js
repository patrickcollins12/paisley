const express = require('express');
const router = express.Router();
const BankDatabase = require('../BankDatabase'); // Adjust the path as necessary

router.get('/parties', async (req, res) => {
  let db = new BankDatabase();
  let query = `
      SELECT DISTINCT json_each.value 
      FROM 'transaction' t, json_each(t.party) 
      WHERE json_valid(t.party)

      UNION

      SELECT DISTINCT json_each.value 
      FROM transaction_enriched, json_each(transaction_enriched.party) 
      WHERE json_valid(transaction_enriched.party)

      UNION
      SELECT DISTINCT json_each.value 
      FROM rule, json_each(rule.party) 
      WHERE json_valid(rule.party)
  `;

  try {
    const stmt = db.db.prepare(query);
    const rows = stmt.all().map(obj => obj.value);
    res.json(rows);
  } catch (err) {
    console.log("error: ", err.message);
    res.status(400).json({ "error": err.message });
  }
});

module.exports = router;

/**
 * @swagger
 * /parties:
 *   get:
 *     summary: Retrieves a list of distinct parties from all transactions
 *     description: This endpoint returns an array of distinct parties from the transactions database, sorted alphabetically.
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: An array of distinct parties.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Ampol", "Bankwest", "7-Eleven"]
 *       400:
 *         description: Bad request, possibly due to a query error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error message describing the specific issue."
 */
