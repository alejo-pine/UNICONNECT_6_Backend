import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Uniconnect Profile Service API',
      version: '1.0.0',
      description: 'API documentation for the Profile Service',
    },
    servers: [
      {
        url: `http://localhost:3002`,
        description: 'Profile Service (Direct)',
      },
      {
        url: `http://localhost:3000/profiles`,
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
