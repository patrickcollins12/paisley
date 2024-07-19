module.exports = {
apps: [
    {
        name: "transaction-retriever",
        script: "npx playwright test",
        cron_restart: "5 * * * *", // This runs the task on the 5th minute of every hour
        autorestart: false, // No need to restart after task completion
        watch: false
      }
    ]
  };