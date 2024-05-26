-- up
-- CREATE TABLE "rule" (
-- 	"id"	INTEGER NOT NULL UNIQUE,
-- 	"rule"	TEXT NOT NULL,
-- 	"group"	TEXT,
-- 	"tag"	JSON,
-- 	"party"	JSON,
--     "comment" TEXT,
-- 	PRIMARY KEY("id" AUTOINCREMENT)
--     );

-- down
drop table 'rule'