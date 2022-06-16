var mongoose = require('mongoose')

var userSchema = new mongoose.Schema({
    _id: String,
    username: String,
    password: String,
    nivel: String
})

module.exports = mongoose.model('users', userSchema)