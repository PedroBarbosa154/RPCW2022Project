var mongoose = require('mongoose')

var noticiaSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    nome: String,
    acao: String,
    data: String,
    idRecurso: String,
    visivel: Boolean
})

module.exports = mongoose.model('noticias', noticiaSchema)