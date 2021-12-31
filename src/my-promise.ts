enum PromiseStatus {
    Pending,
    Fulfilled,
    Rejected
}

export default class MyPromise<T> {
    // 设置初始态
    private status: PromiseStatus = PromiseStatus.Pending
    // 任务成功的结果
    private value!: T | Thenable<T>
    // 任务失败的原因
    private reason: any
    // 成功的回调数组
    private onFulfilledCallbacks: VoidFunction[] = []
    // 失败的回调数组
    private onRejectedCallbacks: VoidFunction[] = []
    // 成功时执行的回调
    constructor(executor: PromiseExecutor<T, MyPromise<T>>) {
        // 标识是否已完成——已完成的promise不能再执行resolve/reject回调
        let resolved = false
        const resolve: ResolveFn<T, MyPromise<T>> = value => {
            if (resolved) {
                return
            }
            resolved = true
            deffer(() => {
                // pending状态才会继续
                if (this.status === PromiseStatus.Pending) {
                    // value为Promise/Thenable时，通过resolveExecutor方法进行处理
                    if (isPromiseOrThenable(value)) {
                        resolved = false // value为promise或thenable则需要等待执行完后再调用resolve/reject回调，所以这里要重置resolved
                        return resolveExecutor(this, value, resolve, reject)
                    }
                    // 把状态改为成功
                    this.status = PromiseStatus.Fulfilled
                    // 保存任务的结果
                    this.value = value
                    // 执行成功的回调
                    this.onFulfilledCallbacks.forEach(cb => cb())
                }
            })
        }
        // 失败时执行的回调
        const reject: RejectFn = reason => {
            if (resolved) {
                return
            }
            resolved = true
            deffer(() => {
                if (this.status === PromiseStatus.Pending) {
                    // 把状态改为失败态
                    this.status = PromiseStatus.Rejected
                    // 保存失败的原因
                    this.reason = reason
                    if(!this.onRejectedCallbacks.length) { // 如果失败回调数组为空数组，说明存在未捕获的异常
                        deffer(() => {
                            throw new Error(`UnhandledPromiseRejection error: ${this.reason}`)
                        })
                    } else {
                        // 执行失败的回调
                        this.onRejectedCallbacks.forEach(cb => cb())
                    }
                }
            })
        }
        // 由于调用executor这个方法有可能异常，需要将捕获的异常reject出去
        try {
            // 运行传入的回调时把成功和失败的方法传进去
            executor(resolve, reject)
        } catch (e) {
            // 执行executor时报错Promise还是会变为rejected状态
            reject(e)
        }
    }
    /**
     * 核心方法，then方
     * @param onFulfilled 异步操作成功的回调，非法则将异步结果往后传入(通过then返回的Promise对象)
     * @param onRejected 异步操作失败的回调，非法则将异常往后抛(通过then返回的Promise对象)
     * @returns 
     */
    then(onFulfilled?: FulfilledFn<T, MyPromise<T>>, onRejected?: RejectedFn<T, MyPromise<T>>): MyPromise<T> {
        // then返回的Promise对象
        let newP: MyPromise<T>
        const resolveCb = (resolve: ResolveFn<T, MyPromise<T>>, reject: RejectFn) => {
            // 2.2.4 在执行上下文堆栈仅包含平台代码之前，不能调用onFulfilled或onRejected。[3.1]。
            // 3.1 这里的“平台代码”是指引擎，环境和promise实现代码。在实践中，这个要求确保onFulfilled和onRejected异步执行，在事件循环开始之后then被调用，和一个新的堆栈。这可以使用诸如deffer或setImmediate之类的“宏任务”机制，或者使用诸如MutationObserver或process.nextTick的“微任务”机制来实现。由于promise实现被认为是经过深思熟虑的平台代码，因此它本身可能包含调用处理程序的任务调度队列或或称为“trampoline”（可重用的）的处理程序。
            try {
                if (typeof onFulfilled === 'function') { // onFulfilled为函数才取其返回值作为异步操作结果。
                    const ret = onFulfilled(this.value as T)
                    resolveExecutor(newP, ret as T, resolve, reject)
                } else { // 否则取当前promise的异步结果为返回promise的异步结果
                    resolve(this.value)
                }
            } catch (e) {
                reject(e)
            }
        }
        const rejectCb = (resolve: ResolveFn<T, MyPromise<T>>, reject: RejectFn) => {
            let unhandledErr: Error | null = null
            // 2.2.4 在执行上下文堆栈仅包含平台代码之前，不能调用onFulfilled或onRejected。[3.1]。
            // 3.1 这里的“平台代码”是指引擎，环境和promise实现代码。在实践中，这个要求确保onFulfilled和onRejected异步执行，在事件循环开始之后then被调用，和一个新的堆栈。这可以使用诸如deffer或setImmediate之类的“宏任务”机制，或者使用诸如MutationObserver或process.nextTick的“微任务”机制来实现。由于promise实现被认为是经过深思熟虑的平台代码，因此它本身可能包含调用处理程序的任务调度队列或或称为“trampoline”（可重用的）的处理程序。
            try {
                if (typeof onRejected === 'function') { //onRejected为函数才取其返回值作为异步失败原因。
                    const ret = onRejected(this.reason)
                    resolveExecutor(newP, ret as T, resolve, reject)
                } else { // 否则取当前promise的失败原因作为返回promise的失败原因
                    reject(this.reason)
                }
            } catch (e) {
                reject(e)
            }
        }
        if (this.status === PromiseStatus.Fulfilled) { // 若异步操作成功则直接传入onFulfilled回调，并将结果作为then返回promise的异步结果。
            return (newP = new MyPromise((resolve, reject) => {
                // 让onFulfilled异步执行
                deffer(() => resolveCb(resolve, reject))
            }))
        } else if (this.status === PromiseStatus.Rejected) { // 若异步操作失败则直接传入onRejected回调，并将结果作为then返回promise的异步结果。
            return (newP = new MyPromise((resolve, reject) => {
                // 让onRejected异步执行
                deffer(() => rejectCb(resolve, reject))
            }))
        } else {  // 若异步操作还未完成则添加回调到队列中
            return (newP = new MyPromise((resolve, reject) => {
                this.onFulfilledCallbacks.push(() => resolveCb(resolve, reject))
                this.onRejectedCallbacks.push(() => rejectCb(resolve, reject))
            }))
        }
    }
    // catch方法
    catch(onRejected: RejectedFn<T, MyPromise<T>>) {
        return this.then(undefined, onRejected)
    }
    // finally方法 
    finally(cb: VoidFunction) {
        return this.then(
            v => MyPromise.resolve(cb() as unknown as T).then(() => v),
            r => MyPromise.resolve(cb() as unknown as T).then(() => {
                throw r
            }))
    }
    // Promise.resolve方法，返回异步结果为指定值的Promise对象
    static resolve<T>(value: T | MyPromise<T>): MyPromise<T> {
        return value instanceof MyPromise ? value : new MyPromise((resolve) => resolve(value))
    }
    // Promise.reject方法，返回失败状态且失败原因为指定值的Promise对象
    static reject(reason: any) {
        return new MyPromise((_, reject) => reject(reason))
    }
    //Promise.all方法，只要有一个失败就失败了。
    static all<T>(promises: (MyPromise<T> | T)[]) {
        const ret: T[] = []
        let count = 0
        return new MyPromise<T[]>((resolve, reject) => {
            for (const p of promises) {
                MyPromise.resolve(p).then(v => {
                    ret.push(v)
                    if (++count === promises.length) {
                        resolve(ret)
                    }
                }, reject)
            }
        })
    }
    // Promise.race方法，看resolve和reject哪个先返回，就取哪个值，成功就取成功的value，失败就取失败的reason。
    static race<T>(promises: (MyPromise<T> | T)[]) {
        return new MyPromise<T>((resolve, reject) => {
            for (const p of promises) {
                MyPromise.resolve(p).then(resolve, reject)
            }
        })
    }
    // Promise.allSettled方法，返回的成功状态的Promise对象，其异步结果为每个promise的结果构成的数组。
    static allSettled<T>(promises: (MyPromise<T> | T)[]) {
        const ret: PromiseResult[] = []
        let count = 0
        return new MyPromise<PromiseResult[]>((resolve) => {
            const tryResolve = () => {
                if (++count === promises.length) {
                    resolve(ret)
                }
            }
            for (const p of promises) {
                MyPromise.resolve(p).then(value => {
                    ret.push({
                        status: 'fulfilled',
                        value
                    })
                    tryResolve()
                }, reason => {
                    ret.push({
                        status: 'rejected',
                        reason
                    })
                    tryResolve()
                })
            }
        })
    }
    // Promise.any方法，只要有一个成功就算成功
    static any<T>(promises: (MyPromise<T> | T)[]) {
        const reasons: any[] = []
        let count = 0
        return new MyPromise<any[] | T>((resolve, reject) => {
            for (const p of promises) {
                MyPromise.resolve(p).then(resolve, r => {
                    reasons.push(r)
                    if (++count === promises.length) {
                        reject(reasons)
                    }
                })
            }
        })
    }
}

/** 完成Promise任务的执行器 */
function resolveExecutor<T>(oldP: MyPromise<T>, newP: T | MyPromise<T> | Thenable<T>, resolve: ResolveFn<T, MyPromise<T>>, reject: RejectFn) {
    // 判断thenable对象then方法是否已经执行,若已经执行则不能再调用resolve/reject修改Promise结果和状态。
    let isThenCalled = false
    // 2.3.1 如果oldP和newP引用同一个对象，则以TypeError为原因拒绝promise。
    if (oldP === (newP as unknown as MyPromise<T>)) {
        const err = new TypeError('Circular reference!')
        reject(err)
        throw err
    }
    // 2.3.2 如果newP是一个promise,采用promise的状态
    if (newP instanceof MyPromise) {
        // 2.3.2.1 如果newP是初始态，promise必须保持初始态(即递归执行这个解决程序)，直到newP被成功或被失败。（即，直到resolve或者reject执行）
        if (newP['status'] === PromiseStatus.Pending) {
            newP.then(p => {
                resolveExecutor(oldP, p, resolve, reject)
            }, reject)
        } else {
            // 2.3.2.2 如果/当newP被成功时，用相同的值（结果）履行promise。
            // 2.3.2.3 如果/当newP被失败时，用相同的错误原因履行promise。
            newP.then(resolve, reject)
        }
        // 2.3.3 否则，如果x是一个对象或函数,
    } else if (isThenable(newP)) {
        const changeThenCalled = () => {
            //2.3.3.3.3 如果resolvePromise和rejectPromise都被调用，或者对同一个参数进行多次调用，则第一次调用优先，并且任何进一步的调用都会被忽略。
            if (isThenCalled) {
                return false
            } else {
                return (isThenCalled = true)
            }
        }
        const resolvePromise: FulfilledFn<T> = p => {
            if (changeThenCalled()) {
                //2.3.3.3.1 如果使用值（结果）调用resolvePromise，运行[[Resolve]]（promise）我的解决程序的名字是resolveExecutor,也就是递归调用。
                resolveExecutor(oldP, p, resolve, reject)
            }
        }
        const rejectPromise: RejectedFn<T> = r => {
            if (changeThenCalled()) {
                //2.3.3.3.2 如果使用拒绝原因r调用resolvePromise，运行reject(r)。
                reject(r)
            }
        }
        try {
            // 2.3.3.3 如果then是一个函数，则直接调用它，第一个参数resolvePromise，第二个参数rejectPromise，其中
            newP.then(resolvePromise, rejectPromise)
        } catch (e) {
            //2.3.3.2 如果newP.then导致抛出异常e，拒绝promise并用e作为失败原因
            //2.3.3.3.4.2 否则，以e作为失败原因拒绝promise
            rejectPromise(e)
        }
    } else {
        //2.3.3.4 如果then不是一个对象或者函数，则用newP作为值（结果）履行promise。
        resolve(newP)
    }
}

/** 微任务延时函数 */
function deffer(cb: VoidFunction) {
    if (typeof global !== 'undefined') {
        process.nextTick(cb)
    } else if (queueMicrotask) {
        queueMicrotask(cb)
    } else if (MutationObserver) {
        const observer = new MutationObserver(cb)
        const tmpSpan = document.createElement('span')
        observer.observe(tmpSpan, {
            childList: true
        })
        tmpSpan.textContent = '_'
    }
}

/** 判断是否为Promise或Thenable对象 */
function isPromiseOrThenable<T>(value: T | MyPromise<T> | Thenable<T>): value is MyPromise<T> | Thenable<T> {
    if (value instanceof MyPromise) return true;
    return isThenable(value)
}

/** 判断是否为Thenable对象 */
function isThenable<T>(value: T | Thenable<T>): value is Thenable<T> {
    if ((typeof value === 'object' && value !== null || typeof value === 'function') && typeof (value as Thenable<T>).then === 'function') return true;
    return false;
}
