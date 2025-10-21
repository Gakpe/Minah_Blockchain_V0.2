import app from "./app";
import { CONFIG } from "./config";

app.listen(CONFIG.port, () => {
  console.log(`Server running on port ${CONFIG.port}`);
});
