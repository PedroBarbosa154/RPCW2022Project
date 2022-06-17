var express = require('express');
var router = express.Router();
var Recurso = require('../controllers/recursos')
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
    res.status(403).jsonp({error: "Não tem nível de acesso suficiente"})
}

/* PUT atualizar user */
router.put('/recursos/atualizarUser', verificaToken, (req,res,next) => {
  console.log('PUT ATUALIZAR USER')
  var userAntigo = req.body.userAntigo;
  var userNovo = req.body.userNovo;
  console.log('antigo: ' + userAntigo)
  console.log('novo: ' + userNovo)
  Recurso.atualizarSubmissor(userAntigo, userNovo)
    .then(() => {
      console.log('Sucesso ao atualizar bd')
      console.log('antigo: ' + userAntigo)
      console.log('novo: ' + userNovo)
      Recurso.atualizarListaLikes(userAntigo,userNovo)
        .then(dados => res.status(200).jsonp(dados))
        .catch(e => res.status(515).jsonp({error: e}))
    })
    .catch(e => res.status(514).jsonp({error: e}))
});

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
  } else if(q.search!= undefined){
    var pal = q.search
    Recurso.listarComPalavra(pal)
      .then(dados => {
        // console.log('Resposta: ' + dados)
        res.status(200).jsonp(dados)
      })
      .catch(e => res.status(504).jsonp({error: e}))
  } else if (q.submissor != undefined){
    var submissor = q.submissor
    console.log(submissor)
    Recurso.listarPorSubmissor(submissor)
      .then(dados => {
        console.log(dados)
        res.status(200).jsonp(dados)
      })
      .catch(error => res.status(510).jsonp(error))
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

/* DELETE de um recurso VERIFICAR SE FUNCIONA*/ 

router.delete('/recursos/:id', verificaToken, function(req,res,next) {
  var id = req.params.id
  console.log(id)
  Recurso.listarPorRid(id)
    .then(dados => {
      recurso = dados
      console.log(recurso)
      console.log(req.user)
      if (req.user.nivel == "admin" || recurso.idSubmissor == req.user.username) {
        next()
      } else {
        res.status(401).jsonp({error: "Não tem permissões"})
      }
    })
    .catch(error => {
      res.status(507).jsonp({error:error})
    })
}, function(req,res) {
  var id = req.params.id 
  Recurso.eliminarRecurso(id)
    .then(dados => {
      res.status(200).jsonp(dados)
    })
    .catch(error => {
      res.status(506).jsonp({error:error})
    })
})

/* POST de um recurso. */
router.post('/recursos', verificaToken, function(req,res,next){verificaNivel(["admin","produtor"],req,res,next)}, function(req, res) {
  Recurso.inserir(req.body)
    .then(dados => {
      // console.log(dados)
      res.status(201).jsonp(dados)
    })
    .catch(e => {console.log(e);res.status(501).jsonp({error: e})})
});

router.put('/recursos/:rid/atualizarLikes',verificaToken,(req,res,next)=>{
  var q = url.parse(req.url,true).query
  if(q.tipo!=undefined && req.user.username!=undefined){
    Recurso.atualizarLikes(req.params.rid,q.tipo,req.user.username)
      .then(dados => {
        res.status(200).jsonp(dados);
      })
      .catch(err => {
        res.status(513).jsonp({error: err})
      })
  }
  else{
    console.log("Parâmetros em falta")
  }
})

/* PUT de um recurso. */
router.put('/recursos/:rid', verificaToken, function(req,res,next){verificaNivel(["admin","produtor"],req,res,next)}, function(req, res,next) {
  var rid = req.params.rid
  // console.log(rid)
  Recurso.listarPorRid(rid)
    .then(dados => {
      console.log(dados)
      console.log(req.user)
      if(req.user.nivel == "admin" || dados.idSubmissor == req.user.username) {
        next()
      } else {
        res.status(401).jsonp({error: "Não tem permissões"})
      }
    })
    .catch(error => {
      console.log(error)
      res.status(505).jsonp({error: error})
    })
}, function(req, res) {
  var rid = req.params.rid
  var titulo = req.body.titulo
  var tipo = req.body.tipo
  // console.log(rid)
  // console.log(titulo)
  // console.log(tipo)
  if (titulo && tipo) {
    Recurso.atualizarTipoTitulo(rid,titulo,tipo)
      .then(dados => res.status(204).jsonp(dados))
      .catch(error => res.status(508).jsonp({error: error}))
  } else if (titulo) {
    Recurso.atualizarTitulo(rid,titulo)
      .then(dados => res.status(204).jsonp(dados))
      .catch(error => res.status(511).jsonp({error: error}))
  } else if (tipo) {
    Recurso.atualizarTipo(rid,tipo)
      .then(dados => res.status(204).jsonp(dados))
      .catch(error => res.status(512).jsonp({error: error}))
  } else {
    return res.status(509).jsonp({error: 'Falta indicar o título e/ou o tipo!'})
  }
});

module.exports = router;
