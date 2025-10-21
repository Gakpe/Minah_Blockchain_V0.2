import app from "./app";
import { CONFIG } from "./config";
import { connectDB } from "./database/connection";

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start the server
    app.listen(CONFIG.port, () => {
      console.log(`Server running on port ${CONFIG.port}`);
      console.log(`API Documentation available at http://localhost:${CONFIG.port}/api-docs`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
