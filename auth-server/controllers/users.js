var User = require('../models/users');
var mongoose = require('mongoose')

//Registar user
module.exports.registar = user =>{
    var novoUser = new User(user)
    return novoUser.save()
}

//Consultar todos os utilizadores
module.exports.consultarUtilizadores = () => {
    return User
        .find({},{username:1,nivel:1})
        .sort({username:1})
        .exec()
}

//Consultar utilizadores por nível
module.exports.consultarUtilizadoresNivel = nivel => {
    return User
        .find({nivel:nivel},{_id:0,username:1})
        .sort({username:1})
        .exec()
}

//Consultar um user
module.exports.consultarUtilizador = username => {
    return User
        .findOne({username: username},{_id:0})
        .exec()
}

//Remover um user 
module.exports.eliminar = username => {
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

//Alterar o user 
module.exports.alterarUser = (username, newUser, nivel, password) => {
    return User
        .findOneAndUpdate({username: username},{$set: {username: newUser,nivel: nivel, password: password}})
        .exec()
}

