import Promise from './src/my-promise.js';

const p = new Promise((resolve, reject) => {
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
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve(new Promise((resolve, reject) => {
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