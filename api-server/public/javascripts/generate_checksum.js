const path = 'metadata.json';
const { createHash } = require('crypto');

function hash(string){
    return createHash('sha256').update(string).digest('hex');
}

console.log(hash(path));