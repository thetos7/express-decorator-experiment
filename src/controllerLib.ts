import {
  Request,
  RequestHandler,
  Response,
  Router,
  RouterOptions,
} from "express";
import { z } from "zod";
import { ValidateOptions, validate } from "./decorators";
import { PartialBy, RouterMethodNames } from "./types";

export const ControllerRouter = Symbol();

export type RoutedController = {
  [ControllerRouter]: Router;
  get router(): Router;
};

/**
 * Utility type for making
 */
export type RequestHandlerDecorator<This extends object> = <
  Value extends RequestHandler
>(
  value: Value,
  decoratorContext: ClassMethodDecoratorContext<This, Value>
) => void;

/**
 * Adds a route using the current {@link method} as a handler to the root `/` path
 * @param method method to listen to, can be any key of an express router
 * @param middlewares middlewares to pass in before the handler
 */
export function route<Middlewares extends RequestHandler[] = []>(
  method: RouterMethodNames,
  ...middlewares: Middlewares
): RequestHandlerDecorator<RoutedController>;

/**
 * Adds a route using the current {@link method} as a handler to the path specified by {@link path}
 * @param method method to listen to, can be any key of an express router
 * @param path subpath to which the route should be mounted
 * @param middlewares middlewares to pass in before the handler
 */
export function route<Middlewares extends RequestHandler[] = []>(
  method: RouterMethodNames,
  path: string,
  ...middlewares: Middlewares
): RequestHandlerDecorator<RoutedController>;

/**
 * implementation
 */
export function route<Middlewares extends RequestHandler[] = []>(
  method: RouterMethodNames,
  path: string | RequestHandler = "/",
  ...middlewares: Middlewares
) {
  return function <Value extends RequestHandler, This extends RoutedController>(
    value: Value,
    {
      kind,
      name,
      addInitializer,
      private: isPrivate,
      static: isStatic,
    }: ClassMethodDecoratorContext<This, Value>
  ) {
    if (isPrivate) {
      throw new Error("Cannot route private mathods");
    }
    if (kind !== "method") {
      throw new Error(
        `cannot route ${String(kind)} "${String(
          name
        )}", only methods are allowed`
      );
    }

    if (typeof path !== "string") {
      middlewares.unshift(path);
      path = "/";
    }
    addInitializer(function () {
      this[ControllerRouter][method](
        path as string,
        ...middlewares,
        isStatic ? value : (value as RequestHandler).bind(this)
      );
    });
  };
}

const controllerMem: Record<string, new () => RoutedController> = {};

/**
 * Create a new controller
 *
 * results are memoized for convenience
 * @param routerOptions Options to pass to integrated router
 * @returns ControllerBase class which instantiates the router with the given options when constructed
 */
export function Controller(routerOptions: RouterOptions = {}) {
  const id = JSON.stringify(routerOptions);
  return (
    controllerMem[id] ??
    (controllerMem[id] = class ControllerBase implements RoutedController {
      [ControllerRouter] = Router(routerOptions);
      get router() {
        return this[ControllerRouter];
      }
    })
  );
}

type ValidateRequestBodyOptions<
  This extends object,
  Args extends [Request, Response]
> = {
  validateOptions?: PartialBy<
    ValidateOptions<This, Args>,
    "selectProperty" | "onError"
  >;
};

/**
 * wrapper around {@link validate} for the general case of validating an express
 * request's body
 *
 * @param schema validation schema
 * @param validateRequestBodyOptions configuration options
 * @returns a method decorator
 */
export function validateRequestBody<
  This extends object,
  Args extends [Request, Response],
  Schema extends z.ZodSchema
>(
  schema: Schema | ((self: This) => Schema),
  { validateOptions = {} }: ValidateRequestBodyOptions<This, Args> = {}
) {
  const {
    selectProperty = (req, _) => [req.body, (newVal) => (req.body = newVal)],
    onError = (_, res) => {
      res.status(400).send();
    },
  } = validateOptions;

  return validate(schema, {
    ...validateOptions,
    selectProperty,
    onError,
  } as ValidateOptions<This, Args>);
}
