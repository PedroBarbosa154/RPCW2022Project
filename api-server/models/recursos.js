var mongoose = require('mongoose')

var recursoSchema = new mongoose.Schema({
    _id: String,
    dataCriacao: String,
    dataSubmissao: String,
    idProdutor: String,
    idSubmissor: String,
    titulo: String,
    tipo: String,
    path: String
})

module.exports = mongoose.model('recursos', recursoSchema)