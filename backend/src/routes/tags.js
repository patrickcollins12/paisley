const express = require('express');
const router = express.Router();
const BankDatabase = require('../BankDatabase'); // Adjust the path as necessary

// const JWTAuthenticator = require('../JWTAuthenticator');
const disableAuth = false; // false means apply auth, true means disable auth

router.get('/api/tags', async (req, res) => {
  let db = new BankDatabase();
  let query = `
      SELECT DISTINCT json_each.value AS tags
      FROM 'transaction' t, json_each(json_extract(t.tags, '$.tags')) 
      WHERE json_valid(t.tags)

      UNION

      SELECT DISTINCT json_each.value 
      FROM transaction_enriched, json_each(transaction_enriched.tags) 
      WHERE json_valid(transaction_enriched.tags);
      `;

  try {
    const stmt = db.db.prepare(query);
    const rows = stmt.all()

    // Extract the tags from the query result
    const originalTags = rows
      .map(row => row.tags)
      // .filter(tag => tag && typeof tag === 'string' && tag.trim() !== ''); // Filter out null, empty, or invalid tags
      console.log("originalTags: ", originalTags);
    // Create a Set to store all unique tags (including parents)
    const allTags = new Set();

    // Process each tag to include its parent tags
    originalTags.forEach(tag => {
      
      // Split the tag into parts using the regex for " > " with surrounding spaces
      const parts = tag.split(/\s>\s/);

      // Reconstruct and add each parent tag to the Set
      let parentTag = '';
      parts.forEach((part, index) => {
        parentTag = index === 0 ? part : `${parentTag} > ${part}`;
        allTags.add(parentTag);
      });
    });

    // Convert the Set to an array for the response
    const result = Array.from(allTags);

    // Send the result as JSON
    res.json(result.sort());
    // res.json(rows);
  } catch (err) {
    console.log("error: ", err.message);
    res.status(400).json({ "error": err.message });
  }
});

module.exports = router;

/**
 * @swagger
 * /api/tags:
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
