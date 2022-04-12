import Promise from './src/my-promise.js';

setTimeout(()=>console.log('Expect to be last!'))
const p = new Promise((resolve, reject) => {
    // setTimeout(()=>reject(44), 3000)
    reject(44)
    // resolve(44);
});
p.catch((e)=>{console.log('>>> err:', e)});
p.catch({});
p.then({}).then(v=>console.log('the v:', v));
const resolved = Promise.resolve(42);
const rejected = Promise.reject(-1);
const another = new Promise(()=>{throw 'corleone'});
const allSettledPromise = Promise.allSettled([resolved, rejected, another]);

allSettledPromise.then((results) => {
  console.log('results:', results);
});

Promise.all('corleone').then(v=>console.log('>>>', v));
