-- Add is_reference column to track reference balances set by the user
ALTER TABLE account_history
ADD COLUMN is_reference BOOLEAN DEFAULT FALSE;

-- Optional: Index for potentially faster lookups of reference balances
-- CREATE INDEX idx_account_history_is_reference ON account_history(accountid, is_reference);