// system imports
const minimist = require('minimist');
const cors = require('cors');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { body, validationResult } = require('express-validator');
const app = express();

const JWTAuthenticator = require('./src/JWTAuthenticator'); // Update the path as necessary
const config = require('./src/Config');
const TransactionFileProcessor = require('./src/TransactionFileProcessor');

////////////////
// load command line arguments
const args = minimist(process.argv);

////////////////
// load the config
config.load(args["config"])

////////////////
// Start the Transaction CSV File Processor
const tfp = new TransactionFileProcessor()
tfp.start()

////////////////
// EXPRESS SERVER at localhost:3000/data

app.use(cors());
app.use(express.json());

// Load the protected routes
const routes = [
  './src/routes/transactions.js',
  './src/routes/update_transactions.js',
  './src/routes/tags.js',
  './src/routes/balances.js',
  './src/routes/rule.js',
  './src/routes/rules.js',
  './src/routes/parties.js',
  './src/routes/login.js',
  './src/routes/signup.js'
]

for (const route of routes) {
  app.use(require(route));
}

// Setup the swagger docs
// const swaggerOptions = {
//   swaggerDefinition: {
//     openapi: '3.0.0',
//     info: {
//       title: 'Paisley API',
//       version: '1.0.0',
//       description: 'The official API for interacting with Paisley Finance',
//     },
//   },
//   apis: routes // Path to the API docs
// };

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Paisley API',
      version: '1.0.0',
      description: 'The official API for interacting with Paisley Finance',
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: [...routes],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

//start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
