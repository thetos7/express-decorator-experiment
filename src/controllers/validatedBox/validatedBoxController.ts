import { Request, Response } from "express-serve-static-core";
import { Controller, route, validateRequestBody } from "../../controllerLib";
import express from "express";
import { z } from "zod";

export class ValidatedBoxController<
  T extends z.ZodSchema
> extends Controller() {
  schema: T;
  data: z.TypeOf<T>;

  constructor(schema: T, data: z.TypeOf<T>) {
    super();
    this.schema = schema;
    this.data = data;
  }

  @route("get")
  read(_: Request, res: Response) {
    res.status(200).json(this.data);
  }

  @route("post", express.json({ strict: false }))
  @validateRequestBody((s) => s.schema)
  update(req: Request<{}, {}, z.TypeOf<T>>, res: Response) {
    const { body } = req;

    this.data = body;

    res.status(200).json(this.data);
  }
}
