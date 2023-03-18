import express, { Request, Response } from "express";
import { Controller, route } from "../../controllerLib";

export class EchoController extends Controller() {
  @route("post", "/", express.text())
  echo(req: Request, res: Response) {
    res.send(req.body);
  }
}
