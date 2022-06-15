var express = require('express');
var router = express.Router();
var User = require('../controllers/users');

var passport = require('passport')
var jwt = require('jsonwebtoken')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* POST login */
router.post('/login', passport.authenticate('local'), function(req,res,next){
  jwt.sign({ username: req.user.username, level: req.user.level, 
    sub: 'aula de DAW2020'}, 
    "DAW2020",
    {expiresIn: 3600},
    function(e, token) {
      if(e) res.status(500).jsonp({error: "Erro na geração do token: " + e}) 
      else res.status(201).jsonp({token: token})
  });
});

/* POST users */
router.post('/registar', function(req,res,next) {
  console.log(req.body)
  var username = req.body.username 
  User.consultar(username)
    .then(response => {
      if(response == null){
        User.registar(req.body)
          .then(response => {
             console.log('Registo do utilizador com username ' + username + ' realizado com sucesso!')
             res.status(201).jsonp(response)
          })
          .catch(error => res.status(500).jsonp(error))
      }
      else res.status(501).jsonp("O username utilizado já se encontra registado!")
    })
    .catch(error => res.status(502).jsonp(error))
})

/* GET users */
router.get('/users', function(res,res,next) {
  User.
})

module.exports = router;
