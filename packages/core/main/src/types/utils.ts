export type PromiseType<T> = T extends PromiseLike<infer U> ? U : T;

export type InferFunctionReturn<TFunction extends (...args: any) => any> = PromiseType<ReturnType<TFunction>>;
export type InferContext<TFunction extends (...args: any) => any> = PromiseType<ReturnType<TFunction>>;

export type PickRequired<T, TKey extends keyof T> = T & Required<Pick<T, TKey>>;

export type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
  ? // eslint-disable-next-line no-use-before-define
    DeepPartialArray<U>
  : T extends object
  ? // eslint-disable-next-line no-use-before-define
    DeepPartialObject<T>
  : T | undefined;

interface DeepPartialArray<T> extends Array<PromiseOrValue<DeepPartial<PromiseOrValue<T>>>> {}
type DeepPartialObject<T> = {
  [P in keyof T]?: PromiseOrValue<DeepPartial<PromiseOrValue<T[P]>>>;
};

export type PromiseOrValue<T> = T | Promise<T>;
