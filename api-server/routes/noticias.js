var express = require('express');
var router = express.Router();
var Noticia = require('../controllers/noticias')
var url = require('url')
var jwt = require('jsonwebtoken');

//É melhor verificar o token em todas as rotas que precisam de login por causa dos acessos vindos do Postman
function verificaToken(req, res, next){
  var myToken = req.query.token || req.body.token;
  // console.log(myToken)
  jwt.verify(myToken, 'ProjetoRPCW2022', function(e, payload){
    if(e) res.status(401).jsonp({error: 'Erro na verificação do token: ' + e})
    else {
      console.log("Token verificado e válido")
      next()
    } 
  })
}

function verificaNivel(autorizados,req,res,next){
  if(autorizados.includes(req.user.nivel))
    next()
  else
    res.status(401).jsonp({error: "Não tem nível de acesso suficiente"})
}

/* PUT noticia (alterar o nome do user) */
router.put('/atualizarUser', verificaToken, (req,res,next) => {
  var userAntigo = req.body.userAntigo;
  var userNovo = req.body.userNovo;
  Noticia.atualizarNome(userAntigo, userNovo)
    .then(dados => {
      res.status(200).jsonp(dados)
    })
    .catch(e => res.status(514).jsonp({error: e}))
})

/* PUT noticia. */
router.put('/:id', verificaToken, function(req,res,next){verificaNivel(["admin","produtor"],req,res,next)}, function(req,res,next){
    var id = req.params.id
    // console.log(rid)
    Noticia.listarPorId(id)
        .then(dados => {
            next()
        })
        .catch(error => {
            console.log(error)
            res.status(503).jsonp({error: error})
        })
}, function(req, res) {
  var id = req.params.id
  var visivel = req.body.visivel
  console.log(visivel)
  if (visivel != undefined) {
    Noticia.atualizar(id,visivel)
      .then(dados => res.status(204).jsonp(dados))
      .catch(error => res.status(504).jsonp({error: error}))
  } else {
    return res.status(505).jsonp({error: 'Falta indicar a visibilidade!'})
  }
})

/* GET noticias. */
router.get('/', verificaToken, function(req, res, next) {
  Noticia.listar()
    .then(dados => res.status(200).jsonp(dados))
    .catch(e => res.status(500).jsonp({error: e}))
});

/* POST noticia. */
router.post('/', verificaToken, function(req, res, next) {
    Noticia.inserir(req.body)
      .then(dados => res.status(201).jsonp(dados))
      .catch(e => res.status(501).jsonp({error: e}))
});

/* DELETE noticia. */
router.delete('/:id', verificaToken, function(req,res,next){verificaNivel(["admin"],req,res,next)}, (req,res,next) => {
    var id = req.params.id
    Noticia.listarPorId(id)
        .then(dados => {
            next()
        })
        .catch(error => {
            console.log(error)
            res.status(506).jsonp({error: error})
        })
}, (req,res,next) => {
    var id = req.params.id
        Noticia.eliminar(id)
            .then(dados => res.status(200).jsonp(dados))
            .catch(error => res.status(507).jsonp({error: error}))
})

module.exports = router;
