require('dotenv').config();
const http = require('http');
const app = require('./server/app');
const { connectDB } = require('./server/config/db');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await connectDB();
    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`API server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();