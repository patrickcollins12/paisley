CREATE TABLE IF NOT EXISTS "category" (
	"transaction_id"	INTEGER,
	"category"	TEXT
);
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE IF NOT EXISTS "import_history" (
	"id"	INTEGER NOT NULL UNIQUE,
	"start_datetime"	TEXT,
	"end_datetime"	TEXT,
	"filename"	TEXT,
	"status"	JSON,
	PRIMARY KEY("id" AUTOINCREMENT)
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
	jsondata JSON, 
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "account" (
	"accountid"	TEXT NOT NULL UNIQUE,
	"institution"	TEXT,
	"name"	TEXT,
	"holders"	TEXT,
	"currency"	TEXT, "type" TEXT,
	PRIMARY KEY("accountid")
);
CREATE VIEW "account_summary" AS SELECT 
    t1.account, 
    a.institution, 
    a.name, 
    a.type, 
    a.currency, 
    t2.balance AS recent_balance,
    COUNT(*) AS txns, 
    MIN(t1.datetime) AS oldest, 
    MAX(t1.datetime) AS newest

FROM 
    'transaction' t1
LEFT JOIN 
    account a ON t1.account = a.accountid
LEFT JOIN (
    SELECT 
        account, 
        balance,
        MAX(datetime) AS max_datetime
    FROM 
        'transaction'
    WHERE 
        balance IS NOT NULL
    GROUP BY 
        account
) t2 ON t1.account = t2.account AND t1.datetime = t2.max_datetime
GROUP BY 
    t1.account 
ORDER BY 
    a.currency, a.institution
/* account_summary(account,institution,name,type,currency,recent_balance,txns,oldest,newest) */;
CREATE VIEW "transaction_with_account" AS SELECT 
    a.institution || ", " || a.name || " (..." || SUBSTR(t.account, -4) || ")" AS "account",
    t.datetime,
    t.description,
    printf("%,d", t.credit) AS credit_formatted,
    t.debit,
    t.balance,
    a.currency,
    t.type AS transaction_type,
    a.type AS account_type,
    t.jsondata
FROM 
    'transaction' t
LEFT JOIN 
    'account' a ON a.accountid = t.account
ORDER BY 
    t.datetime DESC
/* transaction_with_account(account,datetime,description,credit_formatted,debit,balance,currency,transaction_type,account_type,jsondata) */;
CREATE TABLE IF NOT EXISTS "transaction_enriched" (
	"id"	TEXT NOT NULL UNIQUE,
	"tags"	JSON,
	"description"	TEXT,
	PRIMARY KEY("id")
);
