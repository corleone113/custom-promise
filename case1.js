import Promise from './src/my-promise.js';

// const p1 = new Promise(resolve=>{
//     setTimeout(()=>{
//         resolve(34);
//     },1500);
// });
// const p2 = new Promise(resolve=>{
//     setTimeout(()=>{
//         resolve(p1);
//     },1000);
// })
// p2.then(v=>console.log('the v:', v));
const p3 = new Promise((_, reject) => {
    reject(45)
}).catch({})