// express_server.js
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
// const conditionalAuth = require('./ConditionalAuth');
const JWTAuthenticator = require('./JWTAuthenticator');

class ExpressServer {
    constructor({ enableApiDocs = true, port = 4000, globalDisableAuth = false }) {
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
            console.log("Swagger API docs NOT enabled")
        }

    }

    configureMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(JWTAuthenticator.authenticateToken(this.globalDisableAuth));

        // Logger
        // this.app.use((req, res, next) => {
        //     console.log(`${req.method} ${req.path}`);
        //     next();
        // });
    }

    loadRoutes() {  
        if (this.globalDisableAuth) {
            console.warn("Warning: Disabling auth globally for express.")
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
        console.log(`Swagger backend API docs enabled at ${apidocs}`)

    }
    async start() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, () => {
                console.log(`Paisley backend API server is running on port ${this.port}`);
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
                    console.log(`Server on port ${this.port} has been stopped.`);
                    resolve();
                });
            });
        }
    }

}

module.exports = ExpressServer;
