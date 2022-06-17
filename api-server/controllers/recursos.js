var Recurso = require('../models/recursos')
var mongoose = require('mongoose')

//Inserir Recurso (metadados)
module.exports.inserir = metadados =>{
    var novoRecurso = new Recurso(metadados)
    novoRecurso._id = new mongoose.Types.ObjectId()
    novoRecurso.likes = 0
    novoRecurso.users_liked = []
    return novoRecurso.save()
}

//Atualizar um recurso
module.exports.atualizar = (rid, tipo) => {
    return Recurso
        .findOneAndUpdate({_id:mongoose.Types.ObjectId(rid)},{tipo: tipo},{new:true})
        .exec()
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
        .findOneAndUpdate({_id:rid},{titulo: titulo, tipo: tipo})
        .exec()
}

//Obter todos os recursos de um submissor
module.exports.listarPorSubmissor = (username) => {
    return Recurso
        .find({idSubmissor:username})
        .exec()
}

//Alterar o título de um recurso
module.exports.atualizarTitulo = (rid, titulo) => {
    return Recurso
        .findOneAndUpdate({_id:rid},{titulo: titulo})
        .exec()
}

//Alterar o tipo de um Recurso 
module.exports.atualizarTipo = (rid, tipo) => {
    return Recurso
        .findOneAndUpdate({_id:rid},{tipo: tipo})
        .exec()
}

//Atualizar a contagem de likes
module.exports.atualizarLikes = (rid,tipo,user)=>{
    if(tipo=='inc'){
        return Recurso
            .findOneAndUpdate({_id:rid},{$push: {users_liked:user},$inc:{likes:1}})
            .exec()
    }else{
        return Recurso
            .findOneAndUpdate({_id:rid},{$pull: {users_liked:user},$inc:{likes:-1}})
            .exec()
    }
}

//Atualizar um username associado ao recurso como submissor
module.exports.atualizarSubmissor = (userAntigo,userNovo)=>{
    return Recurso
            .updateMany({idSubmissor:userAntigo},{idSubmissor:userNovo},{new:true})
            .exec()
}

//Atualizar um username associado ao recurso como participante da lista dos likes
module.exports.atualizarListaLikes = (userAntigo,userNovo)=>{
    return Recurso
            .updateMany({users_liked:userAntigo},{$set: {'users_liked.$': userNovo}})
            .exec()
}
