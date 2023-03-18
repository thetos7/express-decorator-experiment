/**
 * Replaces keys that extend Key in T to have a property type of NewType
 *
 * @example
 * ```
 * type A = {
 *  value: number
 * };
 *
 * type B = Replace<A, "value", string>;
 * const t: B = { value: "some value" }; // fine, B == { value: string }
 * ```
 */
export type Replace<T extends object, Key extends keyof T, NewType> = Omit<
  T,
  Key
> &
  Record<Key, NewType>;

export type HttpVerb =
  | "get"
  | "post"
  | "put"
  | "head"
  | "delete"
  | "options"
  | "trace"
  | "copy"
  | "lock"
  | "mkcol"
  | "move"
  | "purge"
  | "propfind"
  | "proppatch"
  | "unlock"
  | "report"
  | "mkactivity"
  | "checkout"
  | "merge"
  | "m-search"
  | "notify"
  | "subscribe"
  | "unsubscribe"
  | "patch"
  | "search"
  | "connect";

export type RouterMethodNames = HttpVerb | "all";

/**
 * Like partial, but allows to filter to some specific keys
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
