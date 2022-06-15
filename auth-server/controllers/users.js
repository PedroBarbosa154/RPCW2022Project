var User = require('../models/users');
var mongoose = require('mongoose')

//Registar user
module.exports.registar = user =>{
    var novoUser = new User(user)
    return novoUser.save()
}

//Consultar um user
module.exports.consultar = username => {
    return User
        .findOne({username: username})
        .exec()
}

//Remover um user 
module.exports.remover = username => {
    return User
        .deleteOne({username: username})
        .exec()
}

//Alterar o nível de um user 
module.exports.alterarNivel = (username, nivel) => {
    return User
        .findOneAndUpdate({username: username},{$set: {nivel: nivel}})
        .exec()
}

