export default () => ({
  app: {
    port: Number(process.env.PORT || 7040),
    allowedOrigin: process.env.ALLOWED_ORIGIN || '*',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  swagger: {
    title: 'Booking Service',
    description: 'The MyManager Booking & Appointment API',
    version: '1.0',
  },
});
