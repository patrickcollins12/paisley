const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const KeyValueStore = require('../KeyValueStore');
const store = new KeyValueStore();

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Set a keyvalue pair
router.post(
  '/api/store/:namespace',
  [
    body('key').notEmpty().withMessage('Key is required'),
    body('value').notEmpty().withMessage('Value is required'),
    handleValidationErrors
  ],
  (req, res) => {
    const { namespace } = req.params;
    const { key, value } = req.body;

    try {
      const result = store.setKey(namespace, key, value);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Return a list of keys
router.get('/api/store/:namespace', (req, res) => {
  const { namespace } = req.params;

  try {
    const keys = store.listKeys(namespace);
    res.json(keys);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a key
router.delete('/api/store/:namespace/:key', (req, res) => {
  const { namespace, key } = req.params;

  try {
    const result = store.deleteKey(namespace, key);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

/**
 * @swagger
 * /api/store/{namespace}:
 *   post:
 *     summary: Create or update a key-value pair
 *     description: Creates or updates a key-value pair in the specified namespace.
 *     tags: [Store]
 *     parameters:
 *       - in: path
 *         name: namespace
 *         required: true
 *         schema:
 *           type: string
 *         description: The namespace to create/update the key-value pair in
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *             required:
 *               - key
 *               - value
 *     responses:
 *       201:
 *         description: Key Value saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *   get:
 *     summary: Return a list of keys
 *     description: Retrieves a list of keys in the specified namespace.
 *     tags: [Store]
 *     parameters:
 *       - in: path
 *         name: namespace
 *         required: true
 *         schema:
 *           type: string
 *         description: The namespace to retrieve keys from
 *     responses:
 *       200:
 *         description: A list of keys
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   key:
 *                     type: string
 *                   value:
 *                     type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *   delete:
 *     summary: Delete a key
 *     description: Deletes a key from the specified namespace.
 *     tags: [Store]
 *     parameters:
 *       - in: path
 *         name: namespace
 *         required: true
 *         schema:
 *           type: string
 *         description: The namespace of the key to delete
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: The key to delete
 *     responses:
 *       200:
 *         description: Key deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
