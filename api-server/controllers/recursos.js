var Recurso = require('../models/recursos')
var mongoose = require('mongoose')

//Inserir Recurso (metadados)
module.exports.inserir = metadados =>{
    var novoRecurso = new Recurso(metadados)
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
module.exports.listarPorTipo = pal => {
    return Recurso
        .find({titulo: {$regex: pal}})
        .exec()
}

//Listar um recurso com id igual a rid
module.exports.listarPorRid = rid => {
    return Recurso
        .findOne({_id:mongoose.Types.ObjectId(rid)})
        .exec()
}