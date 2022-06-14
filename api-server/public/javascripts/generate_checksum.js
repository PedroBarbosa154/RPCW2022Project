const path = 'data/resource1/projeto-rpcw-enunciado.pdf';
const { createHash } = require('crypto');

function hash(string){
    return createHash('sha256').update(string).digest('hex');
}

console.log(hash(path));