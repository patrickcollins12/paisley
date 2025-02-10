CREATE TABLE "account_history" (
    "historyid" INTEGER PRIMARY KEY AUTOINCREMENT,
    "accountid" TEXT NOT NULL,
    "datetime" TEXT,
    "balance" REAL,
    "data" JSON,
    FOREIGN KEY("accountid") REFERENCES "account"("accountid") ON DELETE CASCADE
);

CREATE INDEX idx_account_history_accountid ON account_history(accountid);
CREATE INDEX idx_account_history_time      ON account_history(datetime DESC);

