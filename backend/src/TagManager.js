"use strict";
const logger = require("./Logger");

/**
 * Updates a single tag string, handling both direct and hierarchical matches.
 * Note: This function preserves the original's distinct logic for full vs. partial matches,
 * including how whitespace is handled.
 */
function _updateTagInString(originalTagStr, oldName, newName) {
  // Logic for a full tag match (e.g., "Travel" matches "Travel")
  if (originalTagStr.trim() === oldName.trim()) {
    const newTagStr = newName.trim();
    return { newTag: newTagStr, changed: newTagStr !== originalTagStr };
  }

  // Logic for hierarchical tag match (e.g., "Travel" in "Travel > Flights")
  const segments = originalTagStr.split(/\s*>\s*/);
  const replacedSegments = segments.map((seg) => (seg === oldName ? newName : seg));
  const rejoined = replacedSegments.join(">");
  return { newTag: rejoined, changed: rejoined !== originalTagStr };
}

/**
 * Processes a single database row: parses JSON, renames tags, and updates the database if necessary.
 */
function _processRow(db, row, tableName, columnName, pkName, oldName, newName) {
  let tagsArray;
  let originalStructure = null; // Used to reconstruct the original JSON structure

  try {
    const extractedData = JSON.parse(row.tags);
    if (Array.isArray(extractedData)) {
      tagsArray = extractedData; // Format: ["Tag1", "Tag2"]
    } else if (extractedData && Array.isArray(extractedData.tags)) {
      tagsArray = extractedData.tags; // Format: {"tags": ["Tag1"], "rule": [1]}
      originalStructure = extractedData;
    } else {
      logger.warn(`pk=${row.pkVal} in ${tableName}.${columnName} has unexpected JSON format. Skipping.`);
      return;
    }
  } catch (err) {
    logger.warn(`pk=${row.pkVal} in ${tableName}.${columnName} has invalid JSON. Skipping.`);
    return;
  }

  let hasChanged = false;
  const newTagsArray = tagsArray.map((tag) => {
    const { newTag, changed } = _updateTagInString(tag, oldName, newName);
    if (changed) {
      hasChanged = true;
    }
    return newTag;
  });

  if (hasChanged) {
    const updatedJson = originalStructure
      ? JSON.stringify({ ...originalStructure, tags: newTagsArray })
      : JSON.stringify(newTagsArray);

    const updateStmt = db.prepare(`UPDATE '${tableName}' SET ${columnName} = ? WHERE ${pkName} = ?`);
    updateStmt.run(updatedJson, row.pkVal);
    return "UPDATED";
  } else {
    return "UNCHANGED";
  }
}

/**
 * Finds and renames tags within a JSON column of a specified table.
 */
function renameTagsInJsonColumn(db, tableName, columnName, oldName, newName, pkName = "rowid") {
  // logger.info(`Checking table="${tableName}" column="${columnName}" for references to "${oldName}", using pk="${pkName}".`);

  const selectSql = `
    SELECT ${pkName} AS pkVal, ${columnName} AS tags
    FROM '${tableName}'
    WHERE json_valid(${columnName}) AND ${columnName} LIKE '%' || json_quote(?) || '%'
  `;
  const rows = db.prepare(selectSql).all(oldName);
  // logger.info(`Found ${rows.length} rows in ${tableName}.${columnName} to scan for "${oldName}".`);

  if (rows.length === 0) {
    return;
  }

  const summary = { updated: 0, unchanged: 0, error: 0 };

  for (const row of rows) {
    const result = _processRow(db, row, tableName, columnName, pkName, oldName, newName);
    summary[result ? result.toLowerCase() : 'error']++;
  }

  logger.info(`Summary for ${tableName}.${columnName}: ${summary.updated} updated, ${summary.unchanged} unchanged, ${summary.error} errors.`);
}

/**
 * Renames a tag across all relevant tables in the database.
 */
function renameTagInDb(db, oldName, newName) {
  if (!oldName || !newName) {
    throw new Error("Invalid tag names: Both oldName and newName must be non-empty strings.");
  }
  logger.info(`Starting renameTagInDb from "${oldName}" to "${newName}"...`);

  // Rename in tables with 'tags' column (assumed to use rowid)
  renameTagsInJsonColumn(db, "transaction", "tags", oldName, newName, "rowid");
  renameTagsInJsonColumn(db, "transaction_enriched", "tags", oldName, newName, "rowid");

  // Rename in the 'rule' table, which uses 'id' as the PK and 'tag' as the column
  renameTagsInJsonColumn(db, "rule", "tag", oldName, newName, "id");

  logger.info(`Finished renameTagInDb`);
}

module.exports = { renameTagInDb };
