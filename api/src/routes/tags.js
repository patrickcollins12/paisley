const express = require('express');
const router = express.Router();
const BankDatabase = require('../BankDatabase'); // Adjust the path as necessary

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: Retrieves a list of distinct tags from all transactions
 *     description: This endpoint returns an array of distinct tags from the transactions database, sorted alphabetically.
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: An array of distinct tags.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["groceries", "utilities", "salary"]
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

router.get('/tags', async (req, res) => {
  let db = new BankDatabase();
  let query = `
      SELECT DISTINCT json_each.value 
      FROM 'transaction' t, json_each(t.tags) 
      WHERE json_valid(t.tags)

      UNION

      SELECT DISTINCT json_each.value 
      FROM transaction_enriched, json_each(transaction_enriched.tags) 
      WHERE json_valid(transaction_enriched.tags);
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