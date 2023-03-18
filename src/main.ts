import express from "express";
import { router } from "./routes/router";

async function main() {
  const app = express();

  app.use(router);

  app.listen(8888, () => {
    console.log("listening on http://localhost:8888/");
  });
}

main();
