// This file now directly parallels how accounts.js is set up.
// We expect the final route to be /api/tags (e.g. /api/tags/rename) because the
// front-end calls httpClient.get("tags") which resolves to /api/tags. That must
// hit router.get('/api/tags') here. In accounts.js, we also do router.get('/api/accounts').

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const BankDatabase = require('../BankDatabase');
const TagManager = require('../TagManager');
// const RulesClassifier = require('../RulesClassifier');
const logger = require('../Logger.js');

const router = express.Router();

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * @swagger
 * /api/tags:
 *   get:
 *     summary: Retrieve all unique tags
 *     description: Fetches all unique tags from transactions and transaction_enriched tables, with optional parent tag chain expansion.
 *     tags: [Tags]
 *     parameters:
 *       - in: query
 *         name: expand_parents
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: true
 *         description: Whether to expand parent tag chains (e.g., "Food" -> ["Food", "Food > Restaurant"])
 *     responses:
 *       200:
 *         description: List of tags retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Food", "Food > Restaurant", "Transport", "Utilities"]
 *       400:
 *         description: Invalid query parameters or error retrieving tags
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
 *                       param:
 *                         type: string
 *                       location:
 *                         type: string
 *                 error:
 *                   type: string
 *                   example: "Error message describing the specific issue."
 */
// GET /api/tags
router.get('/api/tags', [
  query('expand_parents')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('expand_parents must be either "true" or "false"'),
  handleValidationErrors
], async (req, res) => {
  let db = new BankDatabase();
  const expandParents = req.query.expand_parents !== 'false'; // Default to true, only false if explicitly set to 'false'
  
  let query = `
      SELECT DISTINCT CASE
        WHEN json_valid(json_extract(t.tags, '$.tags')) THEN json_each.value
        ELSE value
      END AS tags
      FROM 'transaction' t
      LEFT JOIN json_each(CASE
        WHEN json_valid(json_extract(t.tags, '$.tags')) THEN json_extract(t.tags, '$.tags')
        ELSE t.tags
      END)
      WHERE json_valid(t.tags)

      UNION

      SELECT DISTINCT CASE
        WHEN json_valid(json_extract(te.tags, '$.tags')) THEN json_each.value
        ELSE value
      END AS tags
      FROM transaction_enriched te
      LEFT JOIN json_each(CASE
        WHEN json_valid(json_extract(te.tags, '$.tags')) THEN json_extract(te.tags, '$.tags')
        ELSE te.tags
      END)
      WHERE json_valid(te.tags);
  `;

  try {
    const stmt = db.db.prepare(query);
    const rows = stmt.all();
    // Extract the tags from the query result
    // Filter out null/undefined tags and extract non-null values
    const originalTags = rows
      .map(row => row.tags)
      .filter(tag => tag != null);

    let result;
    if (expandParents) {
      // Create a Set to store all unique tags (including parent expansions)
      const allTags = new Set();

      // Process each tag to include its parent chain
      originalTags.forEach(tag => {
        try {
          const parts = tag.split(/\s>\s/);
          let parentChain = '';
          parts.forEach((part, idx) => {
            if (part) {
              parentChain = idx === 0 ? part : `${parentChain} > ${part}`;
              allTags.add(parentChain);
            }
          });
        } catch (err) {
          logger.warn(`Error processing tag "${tag}": ${err.message}`);
        }
      });

      result = Array.from(allTags).sort();
    } else {
      // Just return the original tags without parent expansion
      result = [...new Set(originalTags)].sort();
    }

    res.json(result);
  } catch (err) {
    logger.error(`error: ${err.message}`);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * @swagger
 * /api/tags/rename:
 *   patch:
 *     summary: Rename a tag
 *     description: Renames all occurrences of a tag from oldName to newName in the database.
 *     tags: [Tags]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldName
 *               - newName
 *             properties:
 *               oldName:
 *                 type: string
 *                 description: The current name of the tag
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: "Food"
 *               newName:
 *                 type: string
 *                 description: The new name for the tag
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: "Groceries"
 *     responses:
 *       200:
 *         description: Tag renamed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 oldName:
 *                   type: string
 *                   example: "Food"
 *                 newName:
 *                   type: string
 *                   example: "Groceries"
 *                 transactions:
 *                   type: integer
 *                   description: Number of transactions updated
 *                   example: 15
 *                 rules:
 *                   type: integer
 *                   description: Number of rules updated
 *                   example: 2
 *                 errors:
 *                   type: integer
 *                   description: Number of errors encountered
 *                   example: 0
 *       400:
 *         description: Invalid request body or validation errors
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
 *                       param:
 *                         type: string
 *                       location:
 *                         type: string
 *       500:
 *         description: Server error during rename operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Error message describing the specific issue."
 */
// PATCH /api/tags/rename
router.patch('/api/tags/rename', [
  body('oldName')
    .notEmpty()
    .withMessage('oldName is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('oldName must be between 1 and 1000 characters'),
  body('newName')
    .notEmpty()
    .withMessage('newName is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('newName must be between 1 and 1000 characters'),
  handleValidationErrors
], async (req, res) => {
  const { oldName, newName } = req.body;

  const db = new BankDatabase();
  try {
    // First rename the tags
    const results = TagManager.renameTagInDb(db.db, oldName, newName);
    
    // Then trigger a rule rerun
    // const classifier = new RulesClassifier();
    // logger.info("Starting rule reclassification after tag rename");
    // await classifier.applyAllRules();
    // logger.info("Finished rule reclassification");
    
    res.json({ 
      success: true, 
      oldName, 
      newName, 
      transactions: results.transactions,
      rules: results.rules,
      errors: results.errors
    });
  } catch (err) {
    logger.error(`rename failed: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @swagger
 * tags:
 *   name: Tags
 *   description: API for managing transaction tags
 */

module.exports = router;
