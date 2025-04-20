CREATE TABLE IF NOT EXISTS "import_history" (
	"id"	INTEGER NOT NULL UNIQUE,
	"start_datetime"	TEXT,
	"end_datetime"	TEXT,
	"filename"	TEXT,
	"status"	JSON,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE IF NOT EXISTS "transaction_enriched" (
	"id"	TEXT NOT NULL UNIQUE,
	"tags"	JSON,
	"description"	TEXT, "auto_categorize" INTEGER, party JSON,
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "transaction" (
	"id"	TEXT NOT NULL UNIQUE,
	"datetime"	TEXT, 
	"account"	TEXT,
	"description"	TEXT,
	"credit" INTEGER,
    "debit" INTEGER,
	"balance"	INTEGER,
	"type"	INTEGER,
	"tags" JSON,
	jsondata JSON, "notes" TEXT, 'party' JSON, 'inserted_datetime' TEXT, 
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "rule" (
	"id"	INTEGER NOT NULL UNIQUE,
	"rule"	TEXT NOT NULL,
	"group"	TEXT,
	"tag"	JSON,
	"party"	JSON, "comment" TEXT,
	PRIMARY KEY("id" AUTOINCREMENT)
    );
CREATE TABLE IF NOT EXISTS "account" (
    "accountid" TEXT PRIMARY KEY,
    "institution" TEXT,
    "name" TEXT,
    "holders" TEXT,
    "currency" TEXT,
    "type" TEXT,
    "timezone" TEXT,
    "shortname" TEXT,
    "parentid" TEXT,  -- ✅ Define `parentid` before using it in FOREIGN KEY
    "metadata" TEXT, "status" TEXT DEFAULT 'active', "category" TEXT,
    FOREIGN KEY("parentid") REFERENCES "account"("accountid") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "account_history" (
    "historyid" INTEGER PRIMARY KEY AUTOINCREMENT,
    "accountid" TEXT NOT NULL,
    "datetime" TEXT,
    "balance" REAL,
    "data" JSON,
    FOREIGN KEY("accountid") REFERENCES "account"("accountid") ON DELETE CASCADE
);
CREATE INDEX idx_account_parentid ON account(parentid);
CREATE INDEX idx_account_history_accountid ON account_history(accountid);
CREATE INDEX idx_account_history_time      ON account_history(datetime DESC);
CREATE TABLE store (
        namespace TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        PRIMARY KEY (namespace, key)
      );
