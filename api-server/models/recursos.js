var mongoose = require('mongoose')

var recursoSchema = new mongoose.Schema({
    dataCriacao: String,
    dataSubmissao: String,
    idProdutor: String,
    idSubmissor: String,
    titulo: String,
    tipo: String
})

module.exports = mongoose.model('recursos', recursoSchema)