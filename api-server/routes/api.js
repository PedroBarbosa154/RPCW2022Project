var express = require('express');
var router = express.Router();
var Recurso = require('../controllers/recursos')
var url = require('url')
var jwt = require('jsonwebtoken');

//É melhor verificar o token em todas as rotas que precisam de login por causa dos acessos vindos do Postman
function verificaToken(req, res, next){
  var myToken = req.query.token || req.body.token;
  console.log(myToken)
  jwt.verify(myToken, 'ProjetoRPCW2022', function(e, payload){
    if(e) res.status(401).jsonp({error: 'Erro na verificação do token: ' + e})
    else {
      console.log("Token verificado e válido")
      next()
    } 
  })
}

function verificaNivel(autorizados,req,res,next){
  if(autorizados.includes(req.nivel))
    next()
  else
    res.status(403).jsonp({error: "Não tem nível de acesso suficiente"})
}

/* GET recurso por rid. */
router.get('/recursos/:rid', verificaToken, function(req, res, next) {
  var rid = req.params.rid
  Recurso.listarPorRid(rid)
    .then(dados => res.status(200).jsonp(dados))
    .catch(e => res.status(502).jsonp({error: e}))
});

/* GET recursos. */
router.get('/recursos', verificaToken, function(req, res, next) {
  var q = url.parse(req.url,true).query
  if (q.tipo != undefined){
    var tipo = q.tipo
    Recurso.listarPorTipo(tipo)
      .then(dados => {
        // console.log('Resposta: ' + dados)
        res.status(200).jsonp(dados)
      })
      .catch(e => res.status(503).jsonp({error: e}))
  } else if(q.q != undefined){
    var pal = q.q
    Recurso.listarComPalavra(pal)
      .then(dados => {
        // console.log('Resposta: ' + dados)
        res.status(200).jsonp(dados)
      })
      .catch(e => res.status(504).jsonp({error: e}))
  }
  else {
    Recurso.listar()
      .then(dados =>{
        // console.log('Resposta: ' + dados)
        res.status(200).jsonp(dados)
      })
      .catch(e => res.status(500).jsonp({error: e}))
  }
});

/* POST de um recurso. */
router.post('/recursos', verificaToken, function(req,res,next){verificaNivel(["admin","produtor"],req,res,next)}, function(req, res) {
  Recurso.inserir(req.body)
    .then(dados => res.status(201).jsonp(dados))
    .catch(e => {console.log(e);res.status(501).jsonp({error: e})})
});

/* PUT de um recurso. */
router.put('/recursos/:rid', verificaToken, function(req,res,next){verificaNivel(["admin","produtor"],req,res,next)}, function(req, res) {
  var rid = req.params.rid
  Recurso.atualizar(rid, req.body.tipo)
    .then(dados => res.status(201).jsonp(dados))
    .catch(e => res.status(505).jsonp({error: e}))
});

module.exports = router;
