const express = require('express');
const router = express.Router();
const BankDatabase = require('../BankDatabase'); // Adjust the path as necessary
const RulesClassifier = require('../RulesClassifier'); // Adjust the path as necessary
const config = require('../Config');

const JWTAuthenticator = require('../JWTAuthenticator');

router.get('/rules', JWTAuthenticator.authenticateToken,
  async (req, res) => {
    let db = new BankDatabase();
    let query = "SELECT * from rule order by id desc";

    let classifier = new RulesClassifier();

    try {
      const stmt = db.db.prepare(query);
      const rows = stmt.all();

      for (const row of rows) {
        row.matching_transactions = "" //classifier.applyOneRule(row.id)
      }


      res.json(rows);
    } catch (err) {
      console.log("error: ", err.message);
      res.status(400).json({ "error": err.message });
    }

  });

router.get('/rerun_rules', JWTAuthenticator.authenticateToken,
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
 * /rules:
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
 * /rerun_rules:
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