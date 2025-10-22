import mongoose from "mongoose";
import { CONFIG } from "../config";

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    console.log("MongoDB: Using existing connection");
    return;
  }

  try {
    const db = await mongoose.connect(CONFIG.mongodb.uri);
    isConnected = db.connections[0].readyState === 1;
    console.log("MongoDB: Connected successfully");
  } catch (error) {
    console.error("MongoDB: Connection failed", error);
    throw error;
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB: Disconnected");
  isConnected = false;
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB: Connection error", error);
});
