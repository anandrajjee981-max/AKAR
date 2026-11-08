import http from "node:http";
import app, { handleUpgrade } from "./src/app.js";

const server = http.createServer(app);
server.on("upgrade", handleUpgrade);

const port = process.env.PORT || 3003;
server.listen(port, () => {
  console.log(`Router is listening on port ${port}`);
});