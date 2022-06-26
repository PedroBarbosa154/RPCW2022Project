var express = require('express');
var router = express.Router();
const { createHash } = require('crypto');
var User = require('../controllers/users');
var url = require('url');

var axios = require('axios');
var passport = require('passport')
var jwt = require('jsonwebtoken')

/* Verificar se o token é válido */
function verificaToken(req, res, next){
  // console.log('Verificacao do token')
  var token = req.query.token || req.body.token;
  jwt.verify(token, 'ProjetoRPCW2022', function(e, payload){
    if(e){
      res.status(401).jsonp({error: 'Token inválido: ' + e})
    }
    else{
      req.user = {
        username: payload.username,
        nivel: payload.nivel
      }
      next()
    } 
  })
}

router.get('/users/meuPerfil', verificaToken, (req,res,next) => {
  var username = req.user.username 
  console.log('Req user username ' + req.user.username)
  // console.log(req.user.username)
  User.consultarUtilizador(username)
    .then(dados => res.status(200).jsonp(dados))
    .catch(error => res.status(513).jsonp(error))
});

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
    var log = {}
    log.user = user.username;
    log.data = new Date().toISOString().substring(0,16).split('T').join(' ');
    log.movimento = "efetuou login"
    axios.post("http://localhost:8004/logs",log)
      .then(dados => console.log("Log adicionado"))
      .catch(err => {console.log("Erro ao enviar log: " + err)})
  })(req,res,next)
});

/* POST users */
router.post('/registar', function(req,res) {
  //Encriptação da password antes de inserir na BD
  req.body.password = createHash('sha256').update(req.body.password).digest('hex');
  if (req.body.nivel == undefined)
    req.body.nivel = 'consumidor'
  User.registar(req.body)
    .then(dados =>{
      var log = {}
      log.user = req.body.username;
      log.data = new Date().toISOString().substring(0,16).split('T').join(' ');
      log.movimento = "registou-se"
      axios.post("http://localhost:8004/logs",log)
        .then(dados => console.log("Log adicionado"))
        .catch(err => {console.log("Erro ao enviar log: " + err)})
      res.status(201).jsonp({dados: dados})
    }) 
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
  // console.log('entrei no delete da autenticacao')
  var q = url.parse(req.url,true).query
  var username = q.username 
  if (username != undefined){
    // console.log(req.user)
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
    .then(dados => {
      var log = {}
      log.user = req.user.username;
      log.data = new Date().toISOString().substring(0,16).split('T').join(' ');
      log.movimento = "eliminou o utilizador " + username;
      axios.post("http://localhost:8004/logs",log)
        .then(dados => console.log("Log adicionado"))
        .catch(err => {console.log("Erro ao enviar log: " + err)})
      res.status(200).jsonp({dados: dados})
    })
    .catch(error => res.status(508).jsonp({error: error}))
})

/* PUT user. */
router.put('/users/editarPerfil/:username', verificaToken, function(req,res,next){
  var username = req.params.username
  console.log(req.body)
  // console.log(req.user)
  if(req.user.username == username)
  next();
  else
  res.status(401).jsonp({error: "Não tem permissões"})
}, function (req,res){
  var userAntigo = req.user.username
  User.consultarUtilizador(userAntigo)
    .then(dados => {
      var password = dados.password
      if (req.body.password != password)
        req.body.password = createHash('sha256').update(req.body.password).digest('hex');
      User.alterarUser(userAntigo,req.body.username,req.user.nivel,req.body.password)
        .then(dados => {
          //Gerar um novo token visto que a informação do user mudou
          jwt.sign({ username: req.body.username, nivel: req.user.nivel, 
            sub: 'ProjetoRPCW2022'}, 
            "ProjetoRPCW2022",
            {expiresIn: '1d'},
            function(e, token) {
              if(e) {
                res.status(502).jsonp({error: "Erro na geração do token: " + e}) 
              }
              else {
                var log = {}
                log.user = userAntigo;
                log.data = new Date().toISOString().substring(0,16).split('T').join(' ');
                log.movimento = "alterou o seu perfil"
                axios.post("http://localhost:8004/logs",log)
                  .then(dados => console.log("Log adicionado"))
                  .catch(err => {console.log("Erro ao enviar log: " + err)})
                console.log('ANTES DO PUT')
                //Atualizar as bases de dados com o novo username
                var mudancas = {
                  userAntigo: userAntigo,
                  userNovo: req.body.username
                }
                axios.put('http://localhost:8003/api/recursos/atualizarUser?token=' + token, mudancas)
                  .then(dados => {
                    console.log('Atualizado com sucesso nos recursos ' + JSON.stringify(dados.data))
                  })
                  .catch(err => {console.log("Erro ao atualizar as bds: " + err)})
                axios.put('http://localhost:8003/noticias/atualizarUser?token=' + token, mudancas)
                  .then(dados => {
                    console.log('Atualizado com sucesso nas noticias ' + JSON.stringify(dados.data))
                  })
                  .catch(err => {console.log("Erro ao atualizar as bds: " + err)})
                res.status(201).jsonp({token: token})
              }
            });
        })
        .catch(error => res.status(509).jsonp({error: error}))
    })
    .catch(err => {
      console.log(err)
      res.status(514).jsonp({error: err})
    })
})

/* PUT user */
router.put('/users',verificaToken,function(req,res,next){
  var username = req.body.username
  if (username != undefined){
    // console.log(req.user)
    if (req.user.nivel == "admin")
      next();
    else
      res.status(401).jsonp({error: "Não tem o nível de administrador"})
  }
  else{
    return res.status(512).jsonp({error: 'Utilizador não existe!'})
  }
}, function(req, res) {
  var username = req.body.username
  var nivel = req.body.nivel
  if (nivel){
    User.alterarNivel(username,nivel)
      .then(dados => {
        var log = {}
        log.user = req.user.username;
        log.data = new Date().toISOString().substring(0,16).split('T').join(' ');
        log.movimento = "alterou o nivel de " + username
        axios.post("http://localhost:8004/logs",log)
          .then(dados => console.log("Log adicionado"))
          .catch(err => {console.log("Erro ao enviar log: " + err)})
        res.status(204).jsonp({dados: dados})
    })
      .catch(error => res.status(509).jsonp({error: error}))
  } else {
    return res.status(510).jsonp({error: 'Falta indicar o nível!'})
  }
})

module.exports = router;
