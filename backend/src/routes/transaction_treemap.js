const express = require('express');
const { query, validationResult } = require('express-validator');
const router = express.Router();
const BankDatabase = require('../BankDatabase'); // Adjust the path as necessary
const { DateTime } = require("luxon");

const disableAuth = false; // false means apply auth, true means disable auth

router.get(
    '/api/transaction_treemap',
    [
        query('start_date').optional().isISO8601().withMessage('start_date must be a valid ISO 8601 date'),
        query('end_date').optional().isISO8601().withMessage('end_date must be a valid ISO 8601 date'),
    ],
    async (req, res) => {
        // Validate incoming query parameters
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        let db = new BankDatabase();

        // Extract query parameters
        const { start_date, end_date } = req.query;

        // Dynamically build filters
        let dateFilter = "";
        let filterParams = [];

        if (start_date) {
            dateFilter += 'AND dt >= ?';
            filterParams.push(new Date(start_date).toISOString());
        }

        if (end_date) {
            dateFilter += 'AND dt <= ?';
            filterParams.push(new Date(end_date).toISOString());
        }

        let queryStr = `
      SELECT *
      FROM (
          SELECT t.id,
              t.datetime as dt,
              t.account AS account_number,
              a.shortname AS account_shortname,
              t.description as orig_description,
              te.description as revised_description,
              CASE
                  WHEN te.description NOT NULL
                  AND te.description != '' THEN te.description
                  ELSE t.description
              END AS description,
              t.credit,
              t.debit,
              CASE
                  WHEN t.debit != ''
                  AND t.debit > 0.0 THEN - t.debit
                  WHEN t.credit != ''
                  AND t.credit > 0.0 THEN t.credit
                  ELSE 0.0
              END AS amount,
              t.balance,
              t.type,
              CASE
                  WHEN t.tags = '' OR t.tags IS NULL THEN '{}'
                  ELSE t.tags
              END AS auto_tags,
              CASE
                  WHEN te.tags = '' OR te.tags IS NULL THEN '[]'
                  ELSE te.tags
              END AS manual_tags,
              CASE
                  WHEN t.party = '' OR t.party IS NULL THEN '{}'
                  ELSE t.party
              END AS auto_party,
              CASE
                  WHEN te.party = '' OR te.party IS NULL THEN '[]'
                  ELSE te.party
              END AS manual_party,
              te.auto_categorize
          FROM 'transaction' t
              LEFT JOIN 'transaction_enriched' te ON t.id = te.id
              LEFT JOIN 'account' a ON t.account = a.accountid
      ) AS main
      WHERE 1=1
        ${dateFilter}
        AND NOT (
            EXISTS (
                SELECT 1
                FROM json_each(json_extract(auto_tags, '$.tags'))
                WHERE json_each.value LIKE 'Transfer%'
                  OR json_each.value LIKE 'Financial > Investment > Proceeds%'
                    OR json_each.value LIKE 'Financial > Balance Check%'
            )
            OR EXISTS (
                SELECT 1
                FROM json_each(main.manual_tags)
                WHERE json_each.value LIKE 'Transfer%'
                  OR json_each.value LIKE 'Financial > Investment > Proceeds%'
                    OR json_each.value LIKE 'Financial > Balance Check%'
            )
        )
      ORDER BY manual_tags
    `;

        try {
            const stmt = db.db.prepare(queryStr);
            const rows = stmt.all(...filterParams);

            const tree = turnTransactionQueryIntoTreemapStucture(rows)
            res.json(tree)

        } catch (err) {
            console.log("error: ", err.message);
            res.status(400).json({ error: err.message });
        }
    }
);

function turnTransactionQueryIntoTreemapStucture(rows) {
    const tree = []
    for (let row of rows) {
        processRow(row,tree);
    }
    return tree
}

function processRow(row,tree) {

    // manual_tags + auto_tags > allTags || "Uncategorized"
    row.allTags = [
        ...(JSON.parse(row.manual_tags || "[]")),
        ...(JSON.parse(row.auto_tags || "{}").tags || []),
    ].map(tag => tag.replace(/\s*>\s*/g, ' > '))
    if (row.allTags.length === 0) { row.allTags.push('Uncategorized'); }

    // manual_party + auto_party > allParty || "Uncategorized"
    row.allParty = [
        ...(JSON.parse(row.manual_party || "[]")),
        ...(JSON.parse(row.auto_party || "{}").party || []),
    ].map(tag => tag.replace(/\s*>\s*/g, ' > '));
    if (row.allParty.length === 0) { row.allParty.push('Uncategorized'); }

    // Prep the description row into a Node
    const node = {
        "credit": parseFloat(row.credit) || 0,
        "debit": parseFloat(row.debit) || 0,
        "amount": parseFloat(row.amount) || 0,
        "value": Math.abs(parseFloat(row.amount)) || 0.0,
        "description": row.description,
        "account_shortname": row.account_shortname,
        "account_number": row.account_number,
        "datetime": DateTime.fromISO(row.datetime)
    }

    // node.date = format(node.datetime, "yyyy-MM-dd")
    node.date = DateTime.fromISO(node.datetime).toFormat("yyyy-MM-dd");
    
    // node.path = `${node.date} ${node.description}`;
    node.path = `${node.description}`;
    node.name = node.description;
    node.tagsString = row.allTags?.join(", ");
    node.partyString = row.allParties?.join(", ");
    // console.log(node)

    // use the first tag to build the tree
    const tag = row.allTags[0]

    // autovivifyTree
    const segments = tag.split(/\s*>\s*/)

    // prepend the Income/Expense tag based on the amount
    if (node.amount > 0) {
        segments.unshift("Income")
    } else {
        segments.unshift("Expense")
    }


    autovivifyTree(tree, segments, node);
}

function autovivifyTree(root, pathSegments, newNode) {
    let currentLevel = root;

    for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        const fullPath = pathSegments.slice(0, i + 1).join(' / ');

        // Find the node with the matching path or create a new one
        let node = currentLevel.find(node => node.path === fullPath);
        if (!node) {
            node = { path: fullPath, name: segment, children: [] };
            currentLevel.push(node);
        }

        // Move to the next level (children of the current node)
        currentLevel = node.children;
    }

    // Add the new node at the last level
    currentLevel.push(newNode);
}

module.exports = router;

/**
 * @swagger
 * /api/transaction_treemap:
 *   get:
 *     summary: Retrieve filtered transactions for treemap visualization
 *     description: Returns a list of transactions enriched with account, tags, and party data, excluding transfers and other filtered categories.
 *     tags:
 *       - Transactions
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional start date for filtering transactions (any valid ISO format).
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional end date for filtering transactions (any valid ISO format).
 *     responses:
 *       200:
 *         description: A list of filtered transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Bad Request - Invalid date format
 */
