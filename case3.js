import Promise1 from './promise_a+.js';

setTimeout(()=>console.log('Expect to be last!'))
const p = new Promise1((resolve, reject) => {
    reject(44);
    // resolve(44);
});
p.catch(()=>{});
p.catch({});
p.then({}).then(v=>console.log('the v:', v));
const resolved = Promise1.resolve(42);
const rejected = Promise1.reject(-1);
const another = new Promise1(()=>{throw 'corleone'});
const allSettledPromise = Promise1.allSettled([resolved, rejected, another]);

allSettledPromise.then((results) => {
  console.log('results:', results);
});

Promise1.all('corleone').then(v=>console.log('>>>', v));
