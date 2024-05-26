const minimist = require('minimist');

const UserManager = require('./src/UserManager');
const config = require('./src/Config');

// load command line arguments
const args = minimist(process.argv);

// load the config
config.load(args["config"])
const username = args["user"]
const password = args["password"]

// user manager
const manager = new UserManager()
manager.saveUser(username, password)
console.log(`saved username ${username}`)
console.log(manager)