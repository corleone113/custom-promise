import Promise from './src/my-promise.js';

const p = new Promise(resolve => {
    // setTimeout(() => {
    //     resolve(p);
    // }, 1000);
    setTimeout(() => {
        resolve(34);
    }, 1000);
});

const p1 = new Promise((_, reject)=>{
    reject(11)
}).catch(()=>{})
const p2 = new Promise((_, reject)=>{
    reject(22)
}).catch(()=>{})
const p3 = new Promise((_, reject)=>{
    reject(33)
}).catch(()=>{})

Promise.any([p, p1, p2]).then(v=>console.log('any 1', v))
// Promise.any([p3, p1, p2]).then(v=>console.log('any 2', v))