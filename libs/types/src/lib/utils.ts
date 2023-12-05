// Get difference T minus U
// ignore keys that became optional in T
type PrivateDifference<T, U> = {
    [K in keyof T]:
    // T[K] extends undefined
    // ? never // Remove optional keys 
    // : 
    (K extends keyof U
        ? (U[K] extends T[K]
            ? never // Not modified
            : (T[K] extends Record<string, unknown>
                ? Difference<T[K], U[K]> // Recursive
                : T[K] // Modified
            ))
        : T[K] // New key
    )
}

type NotNeverKeys<T> = {
    [K in keyof T]: T[K] extends never | undefined ? never : K
}[keyof T]

// Same but keys with "never" are optional
export type Difference<T, U> = Pick<PrivateDifference<T, U>, NotNeverKeys<PrivateDifference<T, U>>>