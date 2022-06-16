var Recurso = require('../models/recursos')
var mongoose = require('mongoose')

//Inserir Recurso (metadados)
module.exports.inserir = metadados =>{
    var novoRecurso = new Recurso(metadados)
    novoRecurso._id = new mongoose.Types.ObjectId()
    return novoRecurso.save()
}

//Atualizar um recurso
module.exports.atualizar = (rid, tipo) => {
    return Recurso
        .findOneAndUpdate({_id:mongoose.Types.ObjectId(rid)},{tipo: tipo},{new:true})
}

//Listar os recursos
module.exports.listar = () => {
    return Recurso
        .find()
        .exec()
}

//Listar os recursos por tipo
module.exports.listarPorTipo = tipo => {
    return Recurso
        .find({tipo: tipo})
        .exec()
}

//Listar os recursos que contenham uma palavra no titulo
module.exports.listarComPalavra = pal => {
    return Recurso
        .find({titulo: new RegExp(pal,'i')})
        .exec()
}

//Listar um recurso com id igual a rid
module.exports.listarPorRid = rid => {
    return Recurso
        .findOne({_id:rid})
        .exec()
}

//Eliminar um recurso por rid
module.exports.eliminarRecurso = rid => {
    return Recurso
        .findOneAndDelete({_id:rid})
        .exec()
}

//Alterar o título e o tipo de um Recurso 
module.exports.atualizarTipoTitulo = (rid, titulo, tipo) => {
    return Recurso
        .findOneAndUpdate({_id:rid},{$set: {titulo: titulo, tipo: tipo}})
        .exec()
}
