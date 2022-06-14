var Recurso = require('../models/recursos')

//Inserir Recurso (metadados)
module.exports.inserir = metadados =>{
    var novoRecurso = new Recurso(metadados)
    return novoRecurso.save()
}