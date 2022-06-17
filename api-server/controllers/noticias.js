var Noticia = require('../models/noticias')
var mongoose = require('mongoose')

//Atualizar o nome de um user
module.exports.atualizarNome = (userAntigo,userNovo) =>{
    return Noticia
        .updateMany({nome:userAntigo},{nome:userNovo},{new:true})
        .exec()
}

//Inserir Notícia
module.exports.inserir = noticia =>{
    var novaNoticia = new Noticia(noticia)
    novaNoticia._id = new mongoose.Types.ObjectId()
    return novaNoticia.save()
}

//Atualizar a visibilidade
module.exports.atualizar = (id,visibilidade) => {
    return Noticia
        .findOneAndUpdate({_id:mongoose.Types.ObjectId(id)},{visivel: visibilidade},{new:true})
        .exec()
}

//Listar noticias
module.exports.listar = () => {
    return Noticia
        .find()
        .sort({data:'desc'})
        .exec()
}

//Listar noticia por id
module.exports.listarPorId = id => {
    return Noticia
        .findOne({_id:id})
        .exec()
}

//Eliminar uma noticia
module.exports.eliminar = id => {
    return Noticia
        .findOneAndDelete({_id:id})
        .exec()
}