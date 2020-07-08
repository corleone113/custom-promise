const Promise1 = require('./promise_a+')
const p = new Promise1(resolve => {
    setTimeout(() => {
        resolve(p);
    }, 1000);
});