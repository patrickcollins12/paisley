// This file now directly parallels how accounts.js is set up.
// We expect the final route to be /api/tags (e.g. /api/tags/rename) because the
// front-end calls httpClient.get("tags") which resolves to /api/tags. That must
// hit router.get('/api/tags') here. In accounts.js, we also do router.get('/api/accounts').

const express = require('express');
const BankDatabase = require('../BankDatabase');
const TagManager = require('../TagManager');
// const RulesClassifier = require('../RulesClassifier');
const logger = require('../Logger.js');

const router = express.Router();

// GET /api/tags
router.get('/api/tags', async (req, res) => {
  let db = new BankDatabase();
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

    const result = Array.from(allTags).sort();
    res.json({ success: true, tags: result });
  } catch (err) {
    logger.error(`error: ${err.message}`);
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH /api/tags/rename
router.patch('/api/tags/rename', async (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) {
    return res.status(400).json({ success: false, error: 'Missing oldName or newName in request body.' });
  }

  const db = new BankDatabase();
  try {
    // First rename the tags
    TagManager.renameTagInDb(db.db, oldName, newName);
    
    // Then trigger a rule rerun
    // const classifier = new RulesClassifier();
    // logger.info("Starting rule reclassification after tag rename");
    // await classifier.applyAllRules();
    // logger.info("Finished rule reclassification");
    
    res.json({ success: true, oldName, newName });
  } catch (err) {
    logger.error(`rename failed: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
