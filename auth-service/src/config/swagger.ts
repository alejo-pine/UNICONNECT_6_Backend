import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Uniconnect Auth Service API',
      version: '1.0.0',
      description: 'API documentation for the Auth Service',
    },
    servers: [
      {
        url: `http://localhost:3001`,
        description: 'Auth Service (Direct)',
      },
      {
        url: `http://localhost:3000/auth`,
        description: 'Via API Gateway',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/**/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
