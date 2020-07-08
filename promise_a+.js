const isPromiseOrThenable = (value) => { // 判断是否为Promise或Thenable对象
    if (value instanceof MyPromise) return true;
    if ((typeof value === 'object' && value !== null || typeof value === 'function') && typeof value.then === 'function') return true;
    return false;
}
const resolveExecutor = (promise, x, resolve, reject) => {
    // 判断thenable对象then方法是否已经执行——promise是否已经成功/失败。
    let isThenCalled = false

    // 2.3.1 如果promise和x引用同一个对象，则以TypeError为原因拒绝promise。
    if (promise === x) return reject(new TypeError('Circular reference!'))
    // 2.3.2 如果x是一个promise,采用promise的状态

    if (x instanceof MyPromise) {
        /**
         * 2.3.2.1 如果x是初始态，promise必须保持初始态(即递归执行这个解决程序)，直到x被成功或被失败。（即，直到resolve或者reject执行）
         */
        if (x.status === 'pending') {
            x.then(function (y) {
                resolveExecutor(promise, y, resolve, reject)
            }, reject)
        } else {

            // 2.3.2.2 如果/当x被成功时，用相同的值（结果）履行promise。
            // 2.3.2.3 如果/当x被失败时，用相同的错误原因履行promise。
            x.then(resolve, reject)
        }
    } else if (typeof x === 'object' && x !== null || typeof x === 'function') {
        // 2.3.3 否则，如果x是一个对象或函数,
        try {
            // 2.3.3.1 让then等于x.then。

            const {
                then
            } = x;
            if (typeof then === 'function') {

                //2.3.3.3.3 如果resolvePromise和rejectPromise都被调用，或者对同一个参数进行多次调用，则第一次调用优先，并且任何进一步的调用都会被忽略。
                const resolvePromise = y => {

                    //如果promise已经成功或失败了，就退出
                    if (isThenCalled) return
                    isThenCalled = true

                    //2.3.3.3.1 如果使用值（结果）y调用resolvePromise，运行[[Resolve]]（promise，y）我的解决程序的名字是resolveExecutor,也就是递归调用。
                    resolveExecutor(promise, y, resolve, reject)
                }
                const rejectPromise = r => {

                    //如果promise已经成功或失败了，就退出
                    if (isThenCalled) return
                    isThenCalled = true

                    //2.3.3.3.2 如果使用拒绝原因r调用resolvePromise，运行reject(r)。
                    reject(r)
                }

                // 2.3.3.3 如果then是一个函数，则使用x作为此参数调用它，第一个参数resolvePromise，第二个参数rejectPromise，其中
                then.call(x, resolvePromise, rejectPromise)
            } else {

                //到此的话x不是一个thenable对象，那直接把它当成值resolve promise就可以了
                resolve(x)
            }
        } catch (e) {

            //2.3.3.3.4 如果调用then方法抛出异常e，
            //2.3.3.3.4.1 如果resolvePromise或rejectPromise已经调用了，则忽略它。
            if (isThenCalled) return
            isThenCalled = true

            //2.3.3.2 如果x.then导致抛出异常e，拒绝promise并用e作为失败原因
            //2.3.3.3.4.2 否则，以e作为失败原因拒绝promise
            reject(e)
        }
    } else {

        //2.3.3.4 如果then不是一个对象或者函数，则用x作为值（结果）履行promise。
        resolve(x)
    }
}
class MyPromise {
    constructor(executor) {

        //设置初始态
        this.status = 'pending';

        //定义成功的值默认undefined
        this.value = undefined;

        //定义失败的原因默认undefined
        this.reason = undefined;

        //定义成功的回调数组
        this.onFulfilledCallbacks = [];

        //定义失败的回调数组
        this.onRejectedCallbacks = [];

        //缓存this
        const that = this;

        // resolve/reject代表状态变更，只能调用一次，因为Promise状态只能变更一次
        let resolved = false;

        //定义成功时执行的函数
        const resolve = value => {
            if (resolved) return;
            resolved = true;
            setTimeout(() => {
                if (that.status === 'pending') { // pending状态才会继续

                    //value为Promise/Thenable时，通过resolveExecutor方法进行处理
                    if (isPromiseOrThenable(value)) {
                        resolved = false; // 可能出现循环引用，这里要将resolved置为false以便在reject中处理异常
                        return resolveExecutor(that, value, resolve, reject);
                    }

                    //把状态改为成功态
                    that.status = 'fulfilled';

                    //保存成功的值
                    that.value = value;

                    // 执行成功的回调
                    that.onFulfilledCallbacks.forEach(onFulfilled => onFulfilled());
                }
            })
        }
        //定义失败时执行的函数

        const reject = reason => {
            if (resolved) return;
            resolved = true;
            setTimeout(() => {
                if (that.status === 'pending') { // pending状态才会继续

                    //把状态改为失败态
                    that.status = 'rejected';

                    //保存失败的原因
                    that.reason = reason;

                    // 执行失败的回调
                    if (that.onRejectedCallbacks.length === 0) console.error(`Unhandled error: ${that.reason}!!`); // 如果没有添加异步操作失败的回调则直接打印(为了不影响后面代码执行)
                    else that.onRejectedCallbacks.forEach(onRejected => onRejected()); //遍历执行每个失败的回调
                }
            })
        }

        //由于调用executor这个方法有可能异常，需要将捕获的异常reject出去
        try {
            // 运行传入的回调时把成功和失败的方法传进去
            executor(resolve, reject);
        } catch (e) {
            // 执行executor时报错Promise还是会变为rejected状态
            reject(e);
        }
    }
    /**
     * @param {Function} onFulfilled 异步操作成功的回调，非法则将异步结果往后传入(通过then返回的Promise对象)
     * @param {Function} onRejected 异步操作失败的回调，非法则将异常往后抛(通过then返回的Promise对象)
     */
    then(onFulfilled, onRejected) {

        //缓存this,定义promise
        const that = this;

        //then返回的Promise对象
        let new_promise;

        // 若异步操作成功则直接传入onFulfilled回调，并将结果作为then返回promise的异步结果。
        if (that.status === 'fulfilled') {
            //2.2.7
            return (new_promise = new MyPromise((resolve, reject) => {
                //2.2.4 在执行上下文堆栈仅包含平台代码之前，不能调用onFulfilled或onRejected。[3.1]。
                //3.1 这里的“平台代码”是指引擎，环境和primise实现代码。在实践中，这个要求确保onFulfilled和onRejected异步执行，在事件循环开始之后then被调用，和一个新的堆栈。这可以使用诸如setTimeout或setImmediate之类的“宏任务”机制，或者使用诸如MutationObserver或process.nextTick的“微任务”机制来实现。由于promise实现被认为是经过深思熟虑的平台代码，因此它本身可能包含调用处理程序的任务调度队列或或称为“trampoline”（可重用的）的处理程序。
                //让onFulfilled异步执行
                setTimeout(() => {
                    try {
                        if (typeof onFulfilled === 'function') { //onFulfilled为函数才取其返回值作为异步操作结果。
                            const x = onFulfilled(that.value);
                            resolveExecutor(new_promise, x, resolve, reject)
                        } else resolve(that.value); // 否则取当前promise的异步结果为返回promise的异步结果
                    } catch (e) {

                        reject(e);
                    }
                })
            }))
        }
        if (that.status === 'rejected') { // 若异步操作失败则直接传入onRejected回调，并将结果作为then返回promise的异步结果。
            return (new_promise = new MyPromise((resolve, reject) => {
                //2.2.4 在执行上下文堆栈仅包含平台代码之前，不能调用onFulfilled或onRejected。[3.1]。
                //3.1 这里的“平台代码”是指引擎，环境和primise实现代码。在实践中，这个要求确保onFulfilled和onRejected异步执行，在事件循环开始之后then被调用，和一个新的堆栈。这可以使用诸如setTimeout或setImmediate之类的“宏任务”机制，或者使用诸如MutationObserver或process.nextTick的“微任务”机制来实现。由于promise实现被认为是经过深思熟虑的平台代码，因此它本身可能包含调用处理程序的任务调度队列或或称为“trampoline”（可重用的）的处理程序。
                //让onFulfilled异步执行
                setTimeout(() => {
                    try {
                        if (typeof onRejected === 'function') { //onRjected为函数才取其返回值作为异步失败原因。
                            const x = onRejected(that.reason);
                            resolveExecutor(new_promise, x, resolve, reject);
                        } else reject(that.reason); // 否则取当前promise的失败原因作为返回promise的失败原因
                    } catch (e) {

                        reject(e);
                    }
                })
            }))
        }
        if (that.status === 'pending') { // 若异步操作还未完成则添加回调到队列中
            return (new_promise = new MyPromise((resolve, reject) => {
                that.onFulfilledCallbacks.push(() => {
                    try {
                        if (typeof onFulfilled === 'function') { //onFulfilled为函数才取其返回值作为异步操作结果。
                            const x = onFulfilled(that.value);
                            resolveExecutor(new_promise, x, resolve, reject);
                        } else resolve(that.value); // 否则取当前promise的异步结果为返回promise的异步结果
                    } catch (e) {

                        reject(e);
                    }
                })
                that.onRejectedCallbacks.push(() => {
                    try {
                        if (typeof onRejected === 'function') { //onRjected为函数才取其返回值作为异步失败原因。
                            const x = onRejected(that.reason)
                            resolveExecutor(new_promise, x, resolve, reject);
                        } else reject(that.reason); // 否则取当前promise的失败原因为返回promise的失败原因
                    } catch (e) {

                        reject(e);
                    }
                });
            }));
        }
    }
    // catch方法
    catch (onRejected) {
        return this.then(null, onRejected);
    }
    // finally方法 
    finally(cb) {
        return this.then(
            v => MyPromise.resolve(cb()).then(() => v),
            r => MyPromise.resolve(cb()).then(() => {
                throw r;
            }));
    }
    // Promise.resolve方法，返回异步结果为指定值的Promise对象
    static resolve(value) {
        return new MyPromise(resolve => resolve(value));
    }
    // Promise.reject方法，返回失败状态且失败原因为指定值的Promise对象
    static reject(reason) {
        return new MyPromise((_, reject) => reject(reason));
    }
    //Promise.all方法，只要有一个失败就失败了。
    static all(promises) {
        return new MyPromise((resolve, reject) => {
            const resolveArray = [];
            let count = 0;
            for (const p of promises) {
                const _p = isPromiseOrThenable(p) ? p : MyPromise.resolve(p); // 如果是Promise/Thenable那么就不转换了，避免不必要的延迟
                _p.then(value => {
                    resolveArray.push(value);
                    if (++count === promises.length) resolve(resolveArray);
                }, reject);
            }
        });
    }
    //Promise.race方法，看resolve和reject哪个先返回，就取哪个值，成功就取成功的value，失败就取失败的reason。
    static race(promises) {
        return new MyPromise((resolve, reject) => {
            for (const p of promises) {
                const _p = isPromiseOrThenable(p) ? p : MyPromise.resolve(p); // 如果是Promise/Thenable那么就不转换了，避免不必要的延迟
                _p.then(resolve, reject);
            }
        });
    }
    // Promise.allSettled方法，返回的成功状态的Promise对象，其异步结果为每个promise的结果构成的数组。
    static allSettled(promises) {
        return new MyPromise((resolve) => {
            let count = 0;
            const results = [];
            for (const p of promises) {
                const _p = isPromiseOrThenable(p) ? p : MyPromise.resolve(p); // 如果是Promise/Thenable那么就不转换了，避免不必要的延迟
                _p.then(
                    value => {
                        results.push({
                            status: 'fulfilled',
                            value,
                        });
                        if (++count === promises.length) resolve(results);
                    },
                    reason => {
                        results.push({
                            status: 'rejected',
                            reason,
                        });
                        if (++count === promises.length) resolve(results);
                    }
                );
            }
        });
    }
}
module.exports = MyPromise