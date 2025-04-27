#!/usr/bin/env bash
set -e

echo "🔧 Setting up Paisley..."

PAISLEY_DIR="$HOME/paisley"
CONFIG_TEMPLATE="./config.template.js"
DEMO_DB="./demo/demo_transactions.db"
DEMO_USERS="./demo/demo_users.json"
TARGET_DB="$PAISLEY_DIR/transactions.db"
BANK_STATEMENTS_DIR="$PAISLEY_DIR/bank_statements"
CONFIG_FILE="$PAISLEY_DIR/config.js"
USERS_FILE="$PAISLEY_DIR/users.json"


# Update the demo database dates
echo "⏱️  Updating demo database timestamps..."
node demo/demo_database_update.js

# Fail if config.js or transactions.db already exists
if [ -f "$CONFIG_FILE" ]; then
  echo "❌ $CONFIG_FILE already exists. Refusing to overwrite."
  exit 0
fi

if [ -f "$TARGET_DB" ]; then
  echo "❌ $TARGET_DB already exists. Refusing to overwrite."
  exit 0
fi

# Create local Paisley config directory
mkdir -p "$PAISLEY_DIR"
mkdir -p "$BANK_STATEMENTS_DIR"
echo "📁 Created directory: $PAISLEY_DIR"

# Copy config and users file
cp "$CONFIG_TEMPLATE" "$CONFIG_FILE"
echo "📄 Copied config.js to $CONFIG_FILE"

# Create a new empty database from demo schema
echo "🗃️ Creating empty transactions database from demo schema..."
sqlite3 "$DEMO_DB" .dump | grep -v '^INSERT INTO' | grep -v 'sqlite_sequence' | sqlite3 "$TARGET_DB"

# Setup a JWT key and replace XXXX in config.js with the key
echo "🔑 Setting up JWT key..."
JWT_KEY=$(openssl rand -base64 32) perl -i -pe 's/XXXX/\Q$ENV{JWT_KEY}\E/' "$CONFIG_FILE"

# Create an empty api_keys.json file
echo "🗝️  Creating empty api_keys.json file..."
echo '{}' > "$PAISLEY_DIR/api_keys.json"

# Create an empty users.json file
echo "👤 Creating empty users.json file..."
echo '{}' > "$USERS_FILE"
echo "🎉 Setup complete!"

echo ""

# Print instructions for how to setup a user
echo "👤 NEXT: To create a user you need to run the following command:"
echo "cd backend && node bin/user.js --user=<username> --password=<password>"
echo ""

echo "Then start the server:"
echo "cd .."
echo "npm run start"

