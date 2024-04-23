const express = require('express');
const router = express.Router();
const BankDatabase = require('../BankDatabase'); // Adjust the path as necessary


router.get('/rule', async (req, res) => {
    const db = new BankDatabase().db;
    const id = req.query.id;
    if (!id) {
        return res.status(400).send({ error: 'Missing rule ID' });
    }

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

router.post('/rule', async (req, res) => {
    const db = new BankDatabase();
    const { rule, group, tag, party, comment } = req.body;
    if (!rule) {
        return res.status(400).send({ error: 'Required data missing' });
    }

    try {
        const result = db.prepare('INSERT INTO "rule" (rule, group, tag, party, comment) VALUES (?, ?, ?, ?, ?)').run(rule, group, JSON.stringify(tag), JSON.stringify(party), comment);
        res.status(201).send({ id: result.lastInsertRowid });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.delete('/rule', async (req, res) => {
    const db = new BankDatabase();
    const id = req.query.id;
    if (!id) {
        return res.status(400).send({ error: 'Missing rule ID' });
    }

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

module.exports = router;

// Swagger Documentation for Rule Endpoint

/**
 * @swagger
 * /rule:
 *   get:
 *     summary: Retrieves a specific rule by ID
 *     description: Fetch a single rule by its ID.
 *     tags: [Rule]
 *     parameters:
 *       - in: query
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
 *   delete:
 *     summary: Deletes a specific rule by ID
 *     description: Remove a rule from the database by its ID.
 *     tags: [Rule]
 *     parameters:
 *       - in: query
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
