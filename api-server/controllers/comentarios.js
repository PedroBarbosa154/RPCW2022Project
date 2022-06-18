var mongoose = require('mongoose')
var Comentario = require('../models/comentarios')


//Inserir comentarios
module.exports.inserir = comentario =>{
    var novoComentario = new Comentario(comentario)
    novoComentario._id = new mongoose.Types.ObjectId()
    novoComentario.data = new Date().toISOString().substring(0,16).split('T').join(' ');
    return novoComentario.save()
}

//Listar comentario por id
module.exports.listarPorId = id => {
    return Comentario
        .findOne({_id:id})
        .exec()
}

//Listar comentario por idRecurso
module.exports.listarPorIdRecurso = id => {
    return Comentario
        .find({idRecurso:id})
        .sort({data:'desc'})
        .exec()
}

//Eliminar unm comentario
module.exports.eliminar = id => {
    return Comentario
        .findOneAndDelete({_id:id})
        .exec()
}