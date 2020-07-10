import Promise1 from './promise_a+.js';

const p = new Promise1(resolve => {
    setTimeout(() => {
        resolve(p);
    }, 1000);
});