var mongoose = require('mongoose')

var comentarioSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    user: String,
    data: String,
    idRecurso: String,
    texto: String
})

module.exports = mongoose.model('comentarios', comentarioSchema)