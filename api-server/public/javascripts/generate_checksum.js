const { createHash } = require('crypto');
const { stdout } = require('process');

function hash(string){
    return createHash('sha256').update(string).digest('hex');
}

process.stdout.write(hash("data/resource1/projeto-rpcw2022-enunciado.pdf" ));