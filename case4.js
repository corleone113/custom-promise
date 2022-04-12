import Promise from './src/my-promise.js'

const p = new Promise(resolve => {
    setTimeout(() => {
        resolve(34);
    }, 3000);
});

const p1 = new Promise((_, reject) => {
    reject(11)
})
// .catch(() => 'xiao')
const p2 = new Promise((_, reject) => {
    reject(22)
})
// .catch(() => 'li')
const p3 = new Promise((_, reject) => {
    reject(33)
})
// .catch(() => 'fu')

// Promise.any([p3, p1, p2]).then(v => console.log('any 1', v), e => console.log('err?', e))
Promise.any([p3, p1, p2]).then(v => console.log('any 1', v),).catch(e => console.log('err?', e))