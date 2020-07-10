import Promise1 from './promise_a+.js';

const p1 = new Promise1(resolve=>{
    setTimeout(()=>{
        resolve(34);
    },1500);
});
const p2 = new Promise(resolve=>{
    setTimeout(()=>{
        resolve(p1);
    },1000);
})
p2.then(v=>console.log('the v:', v));