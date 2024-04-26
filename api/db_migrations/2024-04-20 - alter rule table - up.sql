-- up
ALTER TABLE "rule"
ADD COLUMN "comment" TEXT;

update "rule"
set "comment" = "rule"
-- down
-- drop table 'rule'