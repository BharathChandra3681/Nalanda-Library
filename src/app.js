const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express5');
const connectDB = require('./config/db');
const config = require('./config/env');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { typeDefs } = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const { createContext } = require('./graphql/context');

const startServer = async () => {
  const app = express();

  // Connect to MongoDB
  await connectDB();

  // Security middleware (with modifications for GraphQL)
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
  }));
  app.use(cors());

  // Body parsing middleware
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Health check route
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      message: 'Nalanda Library API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // REST API routes
  app.use('/api', routes);

  // Setup Apollo Server
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return {
        message: error.message,
        path: error.path,
        extensions: {
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR'
        }
      };
    }
  });

  // Start Apollo Server
  await apolloServer.start();

  // Apply Apollo middleware
  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: createContext
    })
  );

  // 404 handler (after all routes)
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  // Start server
  const PORT = config.port;
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║       Nalanda Library Management System API                ║
╠════════════════════════════════════════════════════════════╣
║  Server running on port: ${PORT}                               ║
║  Health check:    http://localhost:${PORT}/health              ║
║  REST API:        http://localhost:${PORT}/api                 ║
║  GraphQL:         http://localhost:${PORT}/graphql             ║
╚════════════════════════════════════════════════════════════╝
    `);
  });
};

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});