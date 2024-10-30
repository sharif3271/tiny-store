
export type Path<T> = T extends object
  ? {
    [K in keyof T]: K extends string | number
    ? T[K] extends object
    ? T[K] extends Array<unknown>
    ? `${K}`
    : `${K}` | `${K}.${Path<T[K]>}`
    : `${K}`
    : never;
  }[keyof T]
  : never | (T extends Record<string | number, infer V> ? `${string}` | `${string}.${Path<V>}` : never);


export type InferType<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
  ? InferType<T[K], Extract<Rest, Path<T[K]>>>
  : never
  : P extends keyof T
  ? T[P]
  : never;

export type StoreListenerType<T, U extends Path<T>> = (value: InferType<T, U>) => void;







export function getValue<T, P extends Path<T>>(state: T, path: P): InferType<T, P> {
  const keys = path.split('.') as Array<keyof T>;
  let result: unknown = state;
  for (const key of keys) {
    result = (result as T)[key];
  }
  return result as InferType<T, P>;
}
export function setValue<T, P extends Path<T>>(state: T, path: P, value: InferType<T, P>): void {
  const keys = path.split('.') as Array<keyof T>;
  let result: unknown = state;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (typeof result === 'object' && result !== null) {
      result = (result as T)[key];
    } else {
      throw new Error(`Invalid path: ${path}`);
    }
  }
  const lastKey = keys[keys.length - 1];
  if (typeof result === 'object' && result !== null) {
    (result as Record<string, unknown>)[lastKey as string] = value;
  } else {
    throw new Error(`Invalid path: ${path}`);
  }
}



export class TinyStore<T> {
  state: T;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  private listeners: Map<string, Set<StoreListenerType<T, any>>> = new Map();

  constructor(initialState: T) {
    this.state = initialState;
  }

  getState<U extends Path<T>>(path: U): InferType<T, U> {
    return getValue(this.state, path);
  }

  getStoreState(): T {
    return this.state;
  }

  // Subscribe to changes on a specific path
  subscribe<U extends Path<T>>(path: U, listener: StoreListenerType<T, U>): () => void {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    const keyListeners = this.listeners.get(path)!;
    keyListeners.add(listener);
    return () => keyListeners.delete(listener);
  }

  propagateUpdateEvent<U extends Path<T>>(path: U) {
    this.listeners.forEach((set, otherPath) => {
      if (path.startsWith(otherPath) && otherPath !== path) { // parent path
        set.forEach(l => l(getValue(this.state, otherPath as U)))
      }
      if (otherPath.startsWith(path) && otherPath !== path) { // child path
        set.forEach(l => l(getValue(this.state, otherPath as U)))
      }
    })
  }

  // Update the state at a nested path
  update<U extends Path<T>>(path: U, value: InferType<T, U>) {
    if (typeof value !== 'object' && this.getState(path) === value) return;
    setValue(this.state, path, value);
    // Notify direct subscribers
    const keyListeners = this.listeners.get(path);
    keyListeners?.forEach(l => l(value));
    // Notify parent and child paths if exist.
    this.propagateUpdateEvent(path);
  }

  // Notify selected paths after updating the state
  notifyUpdates<U extends Path<T>>(paths: U[]) {
    paths.forEach(path => {
      // Notify direct subscribers
      const keyListeners = this.listeners.get(path);
      keyListeners?.forEach(l => l(getValue(this.state, path)));
      // Notify parent and child paths if exist.
      this.propagateUpdateEvent(path);
    })
  }

  // Notify all subscribers
  notifyAll() {
    this.listeners.forEach((set, path) => {
      set.forEach(l => l(getValue(this.state, path as Path<T>)));
    })
  }

}