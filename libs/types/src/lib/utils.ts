// Get difference T minus U
// ignore keys that became optional in T
type PrivateDifference<T, U> = {
  [K in keyof T]: // ? never // Remove optional keys // T[K] extends undefined
  // :
  K extends keyof U
    ? U[K] extends T[K]
      ? never // Not modified
      : T[K] extends Record<string, unknown>
      ? Difference<T[K], U[K]> // Recursive
      : T[K] // Modified
    : T[K]; // New key
};

type NotNeverKeys<T> = {
  [K in keyof T]: T[K] extends never | undefined ? never : K;
}[keyof T];

// Same but keys with "never" are optional
export type Difference<T, U> = Pick<PrivateDifference<T, U>, NotNeverKeys<PrivateDifference<T, U>>>;

// Default omit breaks discriminated unions
export type SafeOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
