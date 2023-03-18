import { Request, Router } from "express";
import { EchoController } from "../controllers/echo/echoController";
import { ValidatedBoxController } from "../controllers/validatedBox/validatedBoxController";
import { z } from "zod";

export const router = Router();

router.use("/echo", new EchoController().router);

router.use("/box/number", new ValidatedBoxController(z.number(), 42).router);
router.use(
  "/box/string",
  new ValidatedBoxController(z.string(), "hello").router
);
