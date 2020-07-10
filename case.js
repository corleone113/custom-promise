import Promise1 from './promise_a+.js';

const p = new Promise1((resolve, reject) => {
    resolve(344);
});
p.then(value => {
    console.log(value)
    throw 'rrr'
}).then(value => value, (err) => {
    throw err
}).finally(()=>{
    console.log('finally',3333);
}).then(value=>value,err=>{
    console.log('The err:',err);
});
p.then(x => console.log('***', x));
const p2 = p.then(() => {
    console.log('What...');
    return new Promise1((resolve, reject) => {
        setTimeout(() => {
            resolve(new Promise1((resolve, reject) => {
                setTimeout(() => {
                    resolve(new Promise1((resolve, reject) => {
                        setTimeout(() => {
                            resolve(10000);
                        }, 2000)
                    }))
                }, 1000)
            }));
        }, 1400)
    })
}, err => {
    console.log(err, "<<<<<<<<<<<<<<");
});
p2.then(data => console.log(data, '>>>>>>>>>>>'));