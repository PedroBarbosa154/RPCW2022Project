var express = require('express');
var router = express.Router();
var Comentario = require('../controllers/comentarios')
var url = require('url')
var jwt = require('jsonwebtoken');

//É melhor verificar o token em todas as rotas que precisam de login por causa dos acessos vindos do Postman
function verificaToken(req, res, next){
  var myToken = req.query.token || req.body.token;
  // console.log(myToken)
  jwt.verify(myToken, 'ProjetoRPCW2022', function(e, payload){
    if(e) res.status(401).jsonp({error: 'Erro na verificação do token: ' + e})
    else {
    //   console.log("Token verificado e válido")
      next()
    } 
  })
}

/* GET comentarios. */
router.get('/:id', verificaToken, function(req, res, next) {
    // console.log(req.params.id)
    Comentario.listarPorIdRecurso(req.params.id)
      .then(dados => res.status(200).jsonp(dados))
      .catch(e => res.status(500).jsonp({error: e}))
  });
  
  /* POST comentario. */
  router.post('/', verificaToken, function(req, res, next) {
    Comentario.inserir(req.body)
    .then(dados => res.status(201).jsonp(dados))
    .catch(e => res.status(501).jsonp({error: e}))
  });

/* DELETE comentario. */
router.delete('/:id', verificaToken, (req,res,next) => {
    var id = req.params.id
    var q = url.parse(req.url,true).query
    Comentario.listarPorId(id)
        .then(dados => {
            if(req.cookies.nivel == 'admin' || q.user==dados.user)
                next()
            else{
                console.log("Não tem permissões")
                res.status(503).jsonp({error: error})
            }
        })
        .catch(error => {
            console.log(error)
            res.status(502).jsonp({error: error})
        })
}, (req,res,next) => {
    var id = req.params.id
    Comentario.eliminar(id)
        .then(dados => res.status(200).jsonp(dados))
        .catch(error => res.status(504).jsonp({error: error}))
})

module.exports = router;