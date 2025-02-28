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


// Get a key
router.delete('/api/store/:namespace/:key', (req, res) => {
  const { namespace, key } = req.params;

  try {
    const result = store.getKey(namespace, key);
    res.json(result);
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
 * tags:
 *   - name: Store
 *     description: Operations related to the key-value store
 * 
 * paths:
 *   /api/store/{namespace}:
 *     get:
 *       summary: Retrieve a list of keys
 *       description: Fetches all keys within the specified namespace.
 *       tags: [Store]
 *       parameters:
 *         - in: path
 *           name: namespace
 *           required: true
 *           schema:
 *             type: string
 *           description: The namespace from which to retrieve keys.
 *       responses:
 *         200:
 *           description: A list of key-value pairs.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                       description: The key name.
 *                     value:
 *                       type: string
 *                       description: The value associated with the key.
 *         400:
 *           description: Invalid request parameters.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: string
 *                     description: Error message detailing the issue.
 *
 *   /api/store/{namespace}/{key}:
 *     get:
 *       summary: Retrieve a specific key
 *       description: Fetches the value associated with a specific key within the given namespace.
 *       tags: [Store]
 *       parameters:
 *         - in: path
 *           name: namespace
 *           required: true
 *           schema:
 *             type: string
 *           description: The namespace containing the key.
 *         - in: path
 *           name: key
 *           required: true
 *           schema:
 *             type: string
 *           description: The key to retrieve.
 *       responses:
 *         200:
 *           description: The key-value pair retrieved successfully.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   key:
 *                     type: string
 *                     description: The key name.
 *                   value:
 *                     type: string
 *                     description: The value associated with the key.
 *         400:
 *           description: Invalid request parameters.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: string
 *                     description: Error message detailing the issue.
 *         404:
 *           description: Key not found.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: string
 *                     description: Error message indicating the key was not found.
 * 
 * 
 *     post:
 *       summary: Create or update a key-value pair
 *       description: Creates or updates a key-value pair in the specified namespace.
 *       tags: [Store]
 *       parameters:
 *         - in: path
 *           name: namespace
 *           required: true
 *           schema:
 *             type: string
 *           description: The namespace to create/update the key-value pair in.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 key:
 *                   type: string
 *                   description: The key to be created or updated.
 *                 value:
 *                   type: string
 *                   description: The value to associate with the key.
 *               required:
 *                 - key
 *                 - value
 *       responses:
 *         201:
 *           description: Key-Value pair saved successfully.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   key:
 *                     type: string
 *                     description: The key that was saved.
 *                   value:
 *                     type: string
 *                     description: The value associated with the key.
 *         400:
 *           description: Invalid request parameters.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: string
 *                     description: Error message detailing the issue.

 *     delete:
 *       summary: Delete a key
 *       description: Deletes a specific key from the specified namespace.
 *       tags: [Store]
 *       parameters:
 *         - in: path
 *           name: namespace
 *           required: true
 *           schema:
 *             type: string
 *           description: The namespace of the key to delete.
 *         - in: path
 *           name: key
 *           required: true
 *           schema:
 *             type: string
 *           description: The key to delete.
 *       responses:
 *         200:
 *           description: Key deleted successfully.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     description: Confirmation message of deletion.
 *         400:
 *           description: Invalid request parameters.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: string
 *                     description: Error message detailing the issue.
 *         404:
 *           description: Key not found.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: string
 *                     description: Error message indicating the key was not found.
 */
