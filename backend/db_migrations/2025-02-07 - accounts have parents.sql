PRAGMA foreign_keys = OFF;  -- Disable foreign key checks

CREATE TABLE "account_new" (
    "accountid" TEXT PRIMARY KEY,
    "institution" TEXT,
    "name" TEXT,
    "holders" TEXT,
    "currency" TEXT,
    "type" TEXT,
    "timezone" TEXT,
    "shortname" TEXT,
    "parentid" TEXT,  -- ✅ Define `parentid` before using it in FOREIGN KEY
    "metadata" TEXT,
    FOREIGN KEY("parentid") REFERENCES "account_new"("accountid") ON DELETE CASCADE
);

INSERT INTO account_new (accountid, institution, name, holders, currency, type, timezone, shortname, parentid, metadata)
SELECT accountid, institution, name, holders, currency, type, timezone, shortname, NULL, NULL FROM account;

ALTER TABLE account RENAME TO account_old;

ALTER TABLE account_new RENAME TO account;

PRAGMA foreign_keys = ON;  -- Re-enable foreign key enforcement

CREATE INDEX idx_account_parentid ON account(parentid);

DROP table account_old;