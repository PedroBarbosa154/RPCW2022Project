var express = require('express');
var router = express.Router();
const { createHash } = require('crypto');
var User = require('../controllers/users');
var url = require('url')

var passport = require('passport')
var jwt = require('jsonwebtoken')

/* Verificar se o token é válido */
function verificaToken(req, res, next){
  var token = req.query.token || req.body.token;
  jwt.verify(token, 'ProjetoRPCW2022', function(e, payload){
    if(e)
      res.status(401).jsonp({error: 'Token inválido: ' + e})
    else{
      if(payload.nivel === "admin")
        req.user = {
          username: payload.username,
          nivel: payload.nivel,
          isAdmin: 1
        }
      else
      req.user = {
        username: payload.username,
        nivel: payload.nivel,
        isAdmin: 0
      }
      next()
    } 
  })
}

/* GET user */
router.get('/users/:username', verificaToken, function(req,res,next){
  User.consultarUtilizador(req.params.username)
    .then(dados => res.status(200).jsonp(dados))
    .catch(error => res.status(511).jsonp(error))
})

/* GET lista de utilizadores. */
router.get('/users', verificaToken, function(req, res, next) {
  if (req.user.nivel == "admin") next();
  else res.status(401).jsonp({error: "Não tem o nível de administrador"})
}, function(req, res) {
  User.consultarUtilizadoresNivel('produtor')
    .then(produtores => {
      User.consultarUtilizadoresNivel('consumidor')
        .then(consumidores => {
          res.status(200).jsonp({ps: produtores, cs: consumidores})
        })
        .catch(error => res.status(506).jsonp({error: error}))
    })
    .catch(error => res.status(504).jsonp({error: error}))
});

/* POST login */
router.post('/login', function(req,res,next){
  passport.authenticate('local', function(err,user,info){
    // console.log(err)
    // console.log(user)
    if(err)
      return next(err);
    if(!user){
      return res.status(401).jsonp({erro:info.message});
    }
    jwt.sign({ username: user.username, nivel: user.nivel, 
      sub: 'ProjetoRPCW2022'}, 
      "ProjetoRPCW2022",
      {expiresIn: '1d'},
      function(e, token) {
        if(e) {
          res.status(502).jsonp({error: "Erro na geração do token: " + e}) 
        }
        else {
          res.status(201).jsonp({token: token})
        }
    });
  })(req,res,next)
});

/* POST users */
router.post('/registar', function(req,res) {
  //Encriptação da password antes de inserir na BD
  req.body.password = createHash('sha256').update(req.body.password).digest('hex');
  User.registar(req.body)
    .then(dados => res.status(201).jsonp({dados: dados}))
    .catch(e => res.status(503).jsonp({error: e}))
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
/*router.get('/utilizador/:username', verificaToken, function(req,res,next) {
  username = req.params.username
  User.consultarUtilizador(username)
    .then(response => {
      console.log('GET do utilizador ' + username)
      res.status(200).jsonp(response)
    })
    .catch(error => res.status(505).jsonp(error))
})*/

/* DELETE user */
router.delete('/eliminar', verificaToken, function(req,res,next) {
  var q = url.parse(req.url,true).query
  var username = q.username 
  if (username != undefined){
    console.log(req.user)
    if (req.user.nivel == "admin" || req.user.username == username)
      next();
    else
      res.status(401).jsonp({error: "Não tem o nível de administrador"})
  }
  else{
    return res.status(507).jsonp({error: 'Utilizador não existe!'})
  }
}, function(req, res) {
  var q = url.parse(req.url,true).query
  var username = q.username 
  User.eliminar(username)
    .then(dados => res.status(200).jsonp({dados: dados}))
    .catch(error => res.status(508).jsonp({error: error}))
})

/* PUT user */
router.put('/users',verificaToken,function(req,res,next){
  var q = url.parse(req.url,true).query
  var username = q.username 
  if (username != undefined){
    console.log(req.user)
    if (req.user.nivel == "admin")
      next();
    else
      res.status(401).jsonp({error: "Não tem o nível de administrador"})
  }
  else{
    return res.status(507).jsonp({error: 'Utilizador não existe!'})
  }
}, function(req, res) {
  var q = url.parse(req.url,true).query
  var username = q.username 
  var nivel = req.body.nivel
  if (nivel){
    User.alterarNivel(username,nivel)
      .then(dados => res.status(204).jsonp({dados: dados}))
      .catch(error => res.status(509).jsonp({error: error}))
  } else {
    return res.status(510).jsonp({error: 'Falta indicar o nível!'})
  }
})

module.exports = router;
