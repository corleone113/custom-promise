type FulfilledFn<T, R = Thenable<T>> = (value: T) => T | R | void
type RejectedFn<T, R = Thenable<T>> = (reason: any) => T | R | never | void

interface Thenable<T, E = never> {
    then(onfulfilled?: FulfilledFn<T>, onrejected?: RejectedFn): Thenable<T | E>;
}

interface PromiseResult {
    status: 'fulfilled' | 'rejected'
    value?: unknown
    reason?: any
}

type ResolveFn<T, T1 = Thenable<T>> = (value: T | Thenable<T> | T1) => void
type RejectFn = (reason: any) => void
type PromiseExecutor<T, T1 = Thenable<T>> = (resolve: ResolveFn<T, T1>, reject: RejectFn) => void