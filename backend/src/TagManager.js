"use strict";
const logger = require("./Logger");

/**
 * TagManager handles all logic regarding tags, renaming them across transactions, transaction_enriched,
 * and rule tables (wherever they appear).
 *
 * Because rowid is showing as undefined for the rule table, we should use the primary key column (e.g. "id")
 * to identify rows and perform the UPDATE. Based on the user's feedback, the rule table has columns:
 *   rowid  |  id  |  rule  |  tag |  party | ...
 * We'll reference the 'id' column for updates instead of rowid.
 */

module.exports = {
  renameTagInDb(db, oldName, newName) {
    if (!oldName || !newName) {
      throw new Error("Invalid tag names: Both oldName and newName must be non-empty strings.");
    }

    logger.info(`Starting renameTagInDb from "${oldName}" to "${newName}"...`);

    function renameJsonColumn(tableName, columnName, pkName = "rowid") {
      logger.info(`Checking table="${tableName}" column="${columnName}" for references to "${oldName}", using pk="${pkName}".`);

      const selectSql = `
        SELECT ${pkName} AS pkVal, ${columnName} AS tags
        FROM '${tableName}'
        WHERE json_valid(${columnName})
          AND ${columnName} LIKE '%' || json_quote(?) || '%'
      `;
      const rows = db.prepare(selectSql).all(oldName);

      logger.info(`Found ${rows.length} rows in ${tableName}.${columnName} possibly containing "${oldName}".`);

      for (const row of rows) {
        let parsed;
        let originalStructure = null;
        try {
          // Parse the JSON data from the row
          const extracted = JSON.parse(row.tags);
          
          // We expect a structure with a tags array, like {"tags": ["tag1", "tag2"], "rule": [1,2]}
          if (extracted.tags && Array.isArray(extracted.tags)) {
            parsed = extracted.tags;
            originalStructure = extracted;
          } else {
            logger.warn(`pk=${row.pkVal} in ${tableName}.${columnName} has unexpected JSON format. Skipping.`);
            continue;
          }
        } catch (err) {
          logger.warn(`pk=${row.pkVal} in ${tableName}.${columnName} has invalid JSON. Skipping.`);
          continue;
        }

        if (!parsed) {
          logger.warn(`pk=${row.pkVal} in ${tableName}.${columnName} has tags, but not an array. Skipping.`);
          continue;
        }

        logger.info(`pk=${row.pkVal} original array: ${JSON.stringify(parsed)}`);

        let changed = false;
        const newTagsArray = parsed.map((originalTagStr) => {
          if (originalTagStr.trim() === oldName.trim()) {
            const newTagStr = newName.trim();
            if (newTagStr !== originalTagStr) {
              changed = true;
            }
            return newTagStr;
          } else {
            const segments = originalTagStr.split(/\s*>\s*/);
            const replacedSegments = segments.map((seg) => seg === oldName ? newName : seg);
            const rejoined = replacedSegments.join(">");
            if (rejoined !== originalTagStr) {
              changed = true;
            }
            return rejoined;
          }
        });

        if (changed) {
          logger.info(`pk=${row.pkVal} changed from ${JSON.stringify(parsed)} to ${JSON.stringify(newTagsArray)}`);
          
          // Update the tags array in the original structure and preserve the structure
          originalStructure.tags = newTagsArray;
          const updatedJson = JSON.stringify(originalStructure);
          
          const updateStmt = db.prepare(`
            UPDATE '${tableName}'
            SET ${columnName} = ?
            WHERE ${pkName} = ?
          `);
          const info = updateStmt.run(updatedJson, row.pkVal);
         logger.info(`pk=${row.pkVal} update - changes: ${info.changes}`);
        } else {
          logger.info(`pk=${row.pkVal} had no changes for tags array.`);
        }
      }
    }

    // For transaction & transaction_enriched, rowid is correct
    renameJsonColumn("transaction", "tags", "rowid");
    renameJsonColumn("transaction_enriched", "tags", "rowid");

    // For rule, use "id" as the primary key 
    renameJsonColumn("rule", "tag", "id");

    logger.info(`Finished renameTagInDb from "${oldName}" to "${newName}".`);
  },
};