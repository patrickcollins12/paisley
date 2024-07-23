const express = require('express');
const router = express.Router();
const BankDatabase = require('../BankDatabase'); // Adjust the path as necessary
const RulesClassifier = require('../RulesClassifier'); // Adjust the path as necessary
const config = require('../Config');

const disableAuth = false; // false means apply auth, true means disable auth

router.get('/api/rules',
  async (req, res) => {
    let db = new BankDatabase();

    // This query might look a bit scary, all it's doing is:
    // it gets the list of tx where it uses the rule id in either the party or tag field
    let query = `SELECT
        r.*,
        COUNT(DISTINCT combined.id) AS tx_count
        FROM
            rule r
        LEFT JOIN (
            SELECT
                t.id,
                json_each.value AS rule
            FROM
                "transaction" t,
                json_each(t.tags, '$.rule')

            UNION ALL

            SELECT
                t.id,
                json_extract(t.party, '$.rule') AS rule
            FROM
                "transaction" t
            WHERE
                json_extract(t.party, '$.rule') IS NOT NULL
        ) combined ON r.id = combined.rule
        GROUP BY
            r.id
        ORDER BY
            r.id DESC;
        `;


    try {
      const stmt = db.db.prepare(query);
      const rows = stmt.all();

      res.json(rows);
    } catch (err) {
      console.log("error: ", err.message);
      res.status(400).json({ "error": err.message });
    }

  });

router.get('/api/rerun_rules',
  async (req, res) => {
    // config.load()
    let db = new BankDatabase();
    let query = "SELECT * from rule order by id desc";


    try {

      let classifier = new RulesClassifier();
      console.log("Starting full classification")
      classifier.applyAllRules()
      console.log("   Finished processing");

      res.json("finished processing");

    } catch (err) {
      console.log("error: ", err.message);
      res.status(400).json({ "error": err.message });
    }

  });

module.exports = router;

/**
 * @swagger
 * /api/rules:
 *   get:
 *     summary: Retrieves all the transaction rules
 *     description: This endpoint returns a list of all transaction rules stored in the database, including their tags and related parties.
 *     tags: [Rules]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: An array of rules detailing transaction descriptions, groups, tags, and parties involved.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 227
 *                   rule:
 *                     type: string
 *                     example: "description = 'div234'"
 *                   group:
 *                     type: string
 *                     example: ""
 *                   tag:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["Tax > Payment"]
 *                   party:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["ATO"]
 *                   comment:
 *                     type: string
 *                     example: "description: div234"
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
 * /api/rerun_rules:
 *   get:
 *     summary: Rerun all transaction rules
 *     description: This endpoint triggers the reclassification of all transactions based on the current set of rules.
 *     tags: [Rules]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully reclassified transactions.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "finished processing"
 *       400:
 *         description: Bad request, possibly due to a processing error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error message describing the specific issue."
 */