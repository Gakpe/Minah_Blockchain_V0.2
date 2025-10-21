import * as dotenv from "dotenv";

dotenv.config();

export const CONFIG = {
  port: process.env.PORT || 8080,
};
