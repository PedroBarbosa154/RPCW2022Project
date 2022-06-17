var mongoose = require('mongoose')

var recursoSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    dataCriacao: String,
    dataSubmissao: String,
    idProdutor: String,
    idSubmissor: String,
    titulo: String,
    tipo: String,
    path: String,
    likes: Number,
    users_liked : [String]
})

module.exports = mongoose.model('recursos', recursoSchema)