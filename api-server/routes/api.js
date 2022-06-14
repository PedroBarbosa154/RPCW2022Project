var express = require('express');
var router = express.Router();
var Recurso = require('../controllers/recursos')
var url = require('url')

/* GET recurso por rid. */
router.get('/recursos/:rid', function(req, res, next) {
  var rid = req.params.rid
  Recurso.listarPorRid(rid)
    .then(dados => res.status(200).jsonp(dados))
    .catch(e => res.status(502).jsonp({error: e}))
});

/* GET recursos. */
router.get('/recursos', function(req, res, next) {
  var q = url.parse(req.url,true).query
  if (q.tipo != undefined){
    var tipo = q.tipo
    Recurso.listarPorTipo(tipo)
      .then(dados => {
        console.log('Resposta: ' + dados)
        res.status(200).jsonp(dados)
      })
      .catch(e => res.status(503).jsonp({error: e}))
  } else if(q.q != undefined){
    var pal = q.q
    Recurso.listarComPalavra(pal)
      .then(dados => {
        console.log('Resposta: ' + dados)
        res.status(200).jsonp(dados)
      })
      .catch(e => res.status(504).jsonp({error: e}))
  }
  else {
    Recurso.listar()
      .then(dados =>{
        console.log('Resposta: ' + dados)
        res.status(200).jsonp(dados)
      })
      .catch(e => res.status(500).jsonp({error: e}))
  }
});

/* POST de um recurso. */
router.post('/recursos', function(req, res, next) {
  Recurso.inserir(req.body)
    .then(dados => res.status(201).jsonp(dados))
    .catch(e => res.status(501).jsonp({error: e}))
});

/* PUT de um recurso. */
router.put('/recursos/:rid', function(req, res, next) {
  var rid = req.params.rid
  Recurso.atualizar(rid, req.body.tipo)
    .then(dados => res.status(201).jsonp(dados))
    .catch(e => res.status(505).jsonp({error: e}))
});

module.exports = router;
