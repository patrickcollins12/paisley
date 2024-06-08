const express = require('express');
const BankDatabase = require('../BankDatabase'); // Adjust the path as necessary
const RulesClassifier = require('../RulesClassifier');
const RuleToSqlParser = require('../RuleToSqlParser');

const disableAuth = false; // false means apply auth, true means disable auth

const router = express.Router();

// Retrieve a specific rule by ID
router.get('/api/rule/:id',
    async (req, res) => {
        const db = new BankDatabase().db;
        const id = req.params.id;
        try {
            const rule = db.prepare('SELECT * FROM "rule" WHERE id = ?').get(id);
            if (!rule) {
                return res.status(404).send({ error: 'Rule not found' });
            }
            res.json(rule);
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

// Create a new rule
router.post('/api/rule', async (req, res) => {
    const db = new BankDatabase().db;
    const { rule, group, tag, party, comment } = req.body;

    if (!rule) {
        return res.status(400).send({ error: 'Required data missing' });
    }

    try {
        const query = 'INSERT INTO "rule" (rule, "group", tag, party, comment) VALUES (?, ?, ?, ?, ?)'
        const result = db.prepare(query).run(rule, group, JSON.stringify(tag), JSON.stringify(party), comment);
        const id = result.lastInsertRowid
        rule.id = id

        // // Classify this new rule across all transactions
        // const cnt = new RulesClassifier().applyOneRule(id)
        let cnt = 0
        cnt = new RulesClassifier().applyOneRuleDirectly(rule)

        res.status(201).send({ id: id, classified: cnt, message: `Rule created and classified ${cnt} txns` });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Update a specific rule by ID
router.patch('/api/rule/:id', async (req, res) => {
    const db = new BankDatabase().db;
    const id = req.params.id;
    const { rule, group, tag, party, comment } = req.body;

    const existingRule = db.prepare('SELECT * FROM "rule" WHERE id = ?').get(id);
    if (!existingRule) {
        return res.status(404).send({ error: 'Rule not found' });
    }

    const sql = `UPDATE "rule" SET 
                 rule = COALESCE(?, rule), 
                 "group" = COALESCE(?, "group"), 
                 tag = COALESCE(?, tag), 
                 party = COALESCE(?, party), 
                 comment = COALESCE(?, comment) 
                 WHERE id = ?`;
    try {

        // if a new rule string is supplied then this needs to validated FIRST
        // this can be done by attempting to parse it
        if (rule) {
            const parser = new RuleToSqlParser();
            parser.parse(rule);
        }

        // if you get this far then the parser hasn't thrown and the rule is 👍
        // so we (1) update the rule in the database
        db.prepare(sql).run(rule, group, JSON.stringify(tag), JSON.stringify(party), comment, id);

        // and (2) classify this rule across all transactions
        const cnt = new RulesClassifier().applyOneRule(id);

        return res.status(201).send({ id: id, classified: cnt, message: `Rule updated successfully and reclassified ${cnt} txns` });
    } catch (error) {
        return res.status(400).send({ error: error.message });
    }
});

// Delete a specific rule by ID
router.delete('/api/rule/:id', async (req, res) => {
    const db = new BankDatabase().db;
    const id = req.params.id;

    try {
        const result = db.prepare('DELETE FROM "rule" WHERE id = ?').run(id);
        if (result.changes === 0) {
            return res.status(404).send({ error: 'Rule not found' });
        }
        res.send({ message: 'Rule deleted successfully' });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});


// module.exports = { loadRouter };
module.exports = router;

// Swagger Documentation for Rule Endpoint

/**
 * @swagger
 * /api/rule/{id}:
 *   get:
 *     summary: Retrieves a specific rule by ID
 *     description: Fetch a single rule by its ID.
 *     tags: [Rule]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the rule to retrieve.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A rule object.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 rule:
 *                   type: string
 *                 group:
 *                   type: string
 *                 tag:
 *                   type: object
 *                 party:
 *                   type: object
 *                 comment:
 *                   type: string
 *       404:
 *         description: Rule not found.
 *       400:
 *         description: Bad request, possibly due to missing or invalid parameters.
 *   post:
 *     summary: Creates a new rule
 *     description: Add a new rule to the database.
 *     tags: [Rule]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rule
 *             properties:
 *               rule:
 *                 type: string
 *               group:
 *                 type: string
 *               tag:
 *                 type: object
 *               party:
 *                 type: object
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Rule created successfully.
 *       400:
 *         description: Bad request due to incorrect body format.
 *   patch:
 *     summary: Updates a specific rule by ID
 *     description: Update an existing rule in the database by specifying its ID and any fields you wish to update.
 *     tags: [Rule]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the rule to update.
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rule:
 *                 type: string
 *               group:
 *                 type: string
 *               tag:
 *                 type: object
 *               party:
 *                 type: object
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rule updated successfully.
 *       404:
 *         description: Rule not found.
 *       400:
 *         description: Bad request, possibly due to missing or invalid parameters.
 *   delete:
 *     summary: Deletes a specific rule by ID
 *     description: Remove a rule from the database by its ID.
 *     tags: [Rule]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the rule to delete.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rule deleted successfully.
 *       404:
 *         description: Rule not found.
 *       400:
 *         description: Bad request, possibly due to missing or invalid parameters.
 */
