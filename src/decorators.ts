import { z } from "zod";
import { Replace } from "./types";

export type BindOptions = Partial<{ warnKind: boolean; warnType: boolean }>;

/**
 * Helper type to define method decorators
 */
export type DecoratedMethodValue<
  This extends object,
  Args extends any[],
  Return
> = (this: This, ...args: Args) => Return;

/**
 * Marks methods as bound, which means that the value for `this`
 * is fixed to the parent instance, even when assigned to local variables
 *
 * @example
 * ```ts
 * class C {
 *    data = 42;
 *
 *    @bound()
 *    method() {
 *      return this.data;
 *    }
 * }
 *
 * const instance = new C();
 * const plucked = instance.method;
 * assert(plucked() === 42);
 * ```
 *
 * @param options Binding options, mostly controls whether warnings are
 *   logged during the decorator execution
 * @returns a decorator that binds the method/field to its instance on construction
 */
export function bound({ warnKind = true, warnType = true }: BindOptions = {}) {
  return function <
    NameType extends string | symbol,
    This extends Record<NameType, DecoratedMethodValue<This, Args, Return>>,
    Args extends any[],
    Return
  >(
    value: DecoratedMethodValue<This, Args, Return>,
    {
      name,
      kind,
      addInitializer,
    }: Replace<
      | ClassMethodDecoratorContext<
          This,
          DecoratedMethodValue<This, Args, Return>
        >
      | ClassFieldDecoratorContext<
          This,
          DecoratedMethodValue<This, Args, Return>
        >,
      "name",
      NameType
    >
  ) {
    if (typeof value !== "function") {
      if (warnType)
        console.warn(`trying to bind non-function field "${String(name)}"`);
      return;
    }

    if (kind !== "method" && warnKind) {
      console.warn(
        `Field "${String(
          name
        )}" is not a method and may not be affected by the bound decorator`
      );
    }

    addInitializer(function () {
      (this as any)[name] = value.bind(this);
    });
  };
}

/**
 * Options object type for the {@link validate} decorator factory
 * 
 * selectProperty requires a function that, given the arguments of the decorated function
 * returns a tuple with first to value to validate, and second a function receiving the validated value
 * which sets the validated field  (if applicable, ngl this API probably sucks)
 * 
 * onError is called when the validation fails.
 * 
 * finally is called regardless
 */
export type ValidateOptions<This extends object, Args extends any[]> = {
  selectProperty: (
    this: This,
    ...args: Args
  ) => [unknown, (newValue: unknown) => void];
  onError: (this: This, ...args: Args) => void;
  finally?: (this: This, ...args: Args) => void;
};

/**
 * 
 * @param schema a zod schema of schema provider function to validate some data against
 * @param options a {@link ValidateOptions} object
 * @returns a decorator wrapping the method in some validation function
 */
export function validate<
  This extends object,
  Args extends any[],
  Schema extends z.ZodSchema,
  Return
>(
  schema: Schema | ((self: This) => Schema),
  options: ValidateOptions<This, Args>
) {
  const { selectProperty, onError, finally: doFinally } = options;

  return function (
    target: DecoratedMethodValue<This, Args, Return>,
    {
      kind,
    }: ClassMethodDecoratorContext<
      This,
      DecoratedMethodValue<This, Args, Return>
    >
  ) {
    if (kind !== "method") {
      throw new Error("can't validate non method");
    }

    const getSchema = typeof schema !== "function" ? () => schema : schema;

    function validateLogic(this: This, ...args: Args): Return {
      const [value, update] = selectProperty.apply(this, args);
      const parsed = getSchema(this).safeParse(value);

      if (!parsed.success) {
        onError.apply(this, args);
        throw new Error("validation failed");
      }

      update(parsed.data);

      return target.apply(this, args);
    }

    return function (this: This, ...args: Args): Return {
      try {
        return validateLogic.apply(this, args);
      } finally {
        doFinally?.apply(this, args);
      }
    };
  };
}
