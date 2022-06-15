var express = require('express');
var router = express.Router();
const { createHash } = require('crypto');
var User = require('../controllers/users');

var passport = require('passport')
var jwt = require('jsonwebtoken')

/* GET lista de utilizadores. */
router.get('/', function(req, res, next) {
  User.consultarUtilizadores()
    .then(response => {
      console.log('GET de todos os utilizadores')
      res.status(200).jsonp(response)
    })
    .catch(error => res.status(504).jsonp(error))
});

/* POST login */
router.post('/login', function(req,res,next){
  passport.authenticate('local', function(err,user, info){
    console.log(err)
    console.log(user)
    if(err)
      return next(err);
    if(!user)
      return next(info.message);
  })(req,res,next)
  jwt.sign({ username: user.username, nivel: user.nivel, 
    sub: 'ProjetoRPCW2022'}, 
    "ProjetoRPCW2022",
    {expiresIn: '1h'},
    function(e, token) {
      if(e) res.status(503).jsonp({error: "Erro na geração do token: " + e}) 
      else res.status(201).jsonp({token: token})
  })
});

/* POST users */
router.post('/registar', function(req,res) {
  console.log(req.body)
  //Encriptação da password antes de inserir na BD
  req.body.password = createHash('sha256').update(req.body.password).digest('hex');
  User.registar(req.body)
    .then(dados => res.status(201).jsonp({dados: dados}))
    .catch(e => res.status(501).jsonp({error: e}))
})

/* GET users 
router.get('/utilizadores', function(req,res,next) {
  User.consultarUtilizadores()
    .then(response => {
      console.log('GET de todos os utilizadores')
      res.status(200).jsonp(response)
    })
    .catch(error => res.status(504).jsonp(error))
})
*/

/* GET user */
router.get('/utilizador/:username', function(req,res,next) {
  username = req.params.username
  User.consultarUtilizador(username)
    .then(response => {
      console.log('GET do utilizador ' + username)
      res.status(200).jsonp(response)
    })
    .catch(error => res.status(505).jsonp(error))
})

module.exports = router;
