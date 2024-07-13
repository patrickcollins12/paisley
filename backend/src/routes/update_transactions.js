const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const BankDatabase = require('../BankDatabase'); // Adjust the path as necessary
const RulesClassifier = require('../RulesClassifier');

const JWTAuthenticator = require('../JWTAuthenticator');

router.post('/api/update_transaction', [
  // Validate and sanitize the ID
  body('id').trim().isLength({ min: 1 }).withMessage('ID is required.'),
  // Make 'tags' optional but validate if provided
  body('tags').optional().isArray().withMessage('Tags must be an array.'),
  body('party').optional().isArray().withMessage('Party must be an array.'),
  body('tags.*').optional().isString().withMessage('Each tag must be a string.')
    .isLength({ max: 1000 }).withMessage('Tag names must be under 1000 characters.'),
  // Make 'description' optional but validate if provided
  body('description').optional().isString().withMessage('Description must be a string.')
    .isLength({ max: 1000 }).withMessage('Description must be under 1000 characters.'),
  // Validate 'auto_categorize' as an optional boolean
  body('auto_categorize').optional().isBoolean().withMessage('Auto categorize must be a boolean.'),
], async (req, res) => {

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id, tags, party, description, auto_categorize } = req.body;

  let db = new BankDatabase();

  try {
    // Simplified check if the ID exists in the 'transaction' table
    let checkQuery = `SELECT id FROM 'transaction' WHERE id = ? LIMIT 1`;
    const checkStmt = db.db.prepare(checkQuery);
    const result = checkStmt.get(id);
    if (!result) {
      // If the result is undefined or null, the ID does not exist
      return res.status(404).json({ "error": "ID does not exist in 'transaction' table" });
    }

    let fields = ['id'];
    let placeholders = ['?'];
    let updateSet = [];
    let params = [id];

    if (tags) {
      fields.push('tags');
      placeholders.push('json(?)');
      updateSet.push('tags = excluded.tags');
      params.push(JSON.stringify(tags));
    }

    if (party) {
      fields.push('party');
      placeholders.push('json(?)');
      updateSet.push('party = excluded.party');
      params.push(JSON.stringify(party));
    }

    if (description !== undefined) {
      fields.push('description');
      placeholders.push('?');
      updateSet.push('description = excluded.description');
      params.push(description);
    }

    if (auto_categorize === 0 || auto_categorize === 1) {
      fields.push('auto_categorize');
      placeholders.push('?');
      updateSet.push('auto_categorize = excluded.auto_categorize');
      params.push(auto_categorize ? 1 : 0); // Assuming SQLite, convert boolean to 1 or 0
    }

    // Construct the query only with the necessary fields
    let query = `INSERT INTO transaction_enriched (${fields.join(', ')})
                 VALUES (${placeholders.join(', ')})
                 ON CONFLICT(id) DO UPDATE SET ${updateSet.join(', ')};`;

    // console.log(query)
    db.db.prepare(query).run(params);

    // Reclassify all of the rules onto this txid
    // Performance optimization... this could be expensive
    const classifier = new RulesClassifier();
    const cnt = classifier.applyAllRules([id])
    console.log(`Reapplied all rules to ${id} and matched ${cnt} rules`)

    res.json({ "success": true });

  } catch (err) {
    console.log("error: ", err);
    res.status(400).json({ "error": err.message });
  }
});

module.exports = router;

/**
 * @swagger
 * /api/update_transaction:
 *   post:
 *     summary: Updates the details of an existing transaction including optional auto categorization
 *     description: >
 *       Allows updating the tags, description, and auto categorization status of a transaction identified by its ID.
 *       If the specified ID does not exist, a 404 error is returned. Tags, description, and auto_categorize fields
 *       are optional; however, if provided, they are validated for type and appropriate values or length.
 *     tags:
 *       - Transactions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: The unique identifier of the transaction. This field is required and must not be empty.
 *                 example: "txn_123456"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: An optional array of tag strings associated with the transaction. Each tag must be a string under 1000 characters.
 *                 example: ["urgent", "food"]
 *               description:
 *                 type: string
 *                 description: An optional description for the transaction. Must be a string under 1000 characters.
 *                 example: "Weekly grocery shopping at supermarket."
 *               auto_categorize:
 *                 type: boolean
 *                 description: An optional flag to indicate if the transaction should be automatically categorized.
 *                 example: false
 *     responses:
 *       200:
 *         description: Transaction details updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad request. Possible reasons include validation errors such as missing ID, incorrect field types, strings exceeding maximum length, or invalid boolean value.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                         example: "ID is required."
 *                       param:
 *                         type: string
 *                         example: "id"
 *                       location:
 *                         type: string
 *                         example: "body"
 *       404:
 *         description: The specified transaction ID does not exist in the database.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ID does not exist in 'transaction' table"
 */
