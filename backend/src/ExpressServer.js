// express_server.js
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
// const conditionalAuth = require('./ConditionalAuth');
const JWTAuthenticator = require('./JWTAuthenticator');
const logger = require('./Logger');
const config = require('./Config');

class ExpressServer {
    constructor({ enableApiDocs = true, port = 4000, globalDisableAuth = false }) {

        config.load();
        if (! config['jwt'] || config['jwt'] === "" || config['jwt'] === "XXXX") {
            logger.error(`Missing required 'jwt' secret in your config file: ${config.configFilePath}`);
            process.exit(1); // Fail fast
        }


        this.routeDirs = [
            path.join(__dirname, 'src', 'routes'),
            path.join(__dirname, 'routes')
        ];

        this.enableApiDocs = enableApiDocs;
        this.port = port;
        this.globalDisableAuth = globalDisableAuth;
        this.app = express();
        this.configureMiddleware();
        this.loadRoutes();
        if (this.enableApiDocs) {
            this.setupSwaggerDocs();
        }
        else {
            logger.info("Swagger API docs NOT enabled")
        }

    }

    configureMiddleware() {
        // Secure CORS configuration
        const corsOptions = {
            origin: [
                'http://localhost:3000',    // Development frontend
                'https://yourdomain.com',   // Production frontend
                'https://www.yourdomain.com'
            ],
            credentials: true,              // Allow cookies/auth headers
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            maxAge: 86400                   // Cache preflight for 24 hours
        };
        
        this.app.use(cors(corsOptions));
        this.app.use(express.json());
        this.app.set('query parser', 'extended');
        this.app.use(JWTAuthenticator.authenticateToken(this.globalDisableAuth));

        // for security reasons lets disable some unnecessary headers
        this.app.set('etag', false);
        this.app.disable('x-powered-by');

        // Logger
        // this.app.use((req, res, next) => {
        //     logger.info(`${req.method} ${req.path}`);
        //     next();
        // });
    }

    loadRoutes() {  
        if (this.globalDisableAuth) {
            logger.warn("Warning: Disabling auth globally for express.")
        }

        const routes = this.getRoutes();

        for (const routePath of routes) {
            const routeModule = require(routePath);
            const router = routeModule.router || routeModule; // Use the module directly if it doesn't have a router property
            this.app.use(router);
        }
    }

    getRoutes() {
        let routes = [];
        for (const dir of this.routeDirs) {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    if (file.endsWith('.js')) {
                        routes.push(path.join(dir, file));
                    }
                }
            }
        }
        return routes;
    }

    setupSwaggerDocs() {
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
            apis: [...this.getRoutes()],
        };

        const swaggerDocs = swaggerJsdoc(swaggerOptions);
        const apidocs = '/api/docs'
        this.app.use(apidocs, swaggerUi.serve, swaggerUi.setup(swaggerDocs));
        logger.info(`Swagger backend API docs enabled at ${apidocs}`)

    }

    async start() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, () => {
                logger.info(`Paisley backend API server is running on port ${this.port}`);
                resolve();
            }).on('error', reject);
        });
    }

    async stop() {
        if (this.server) {
            return new Promise((resolve, reject) => {
                this.server.close(err => {
                    if (err) {
                        return reject(err);
                    }
                    logger.info(`Server on port ${this.port} has been stopped.`);
                    resolve();
                });
            });
        }
    }

}

module.exports = ExpressServer;
