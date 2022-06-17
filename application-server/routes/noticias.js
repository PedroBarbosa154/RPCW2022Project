var express = require('express');
var router = express.Router();
var axios = require('axios');
var url = require('url');
var jwt = require('jsonwebtoken');

//É melhor verificar o token em todas as rotas que precisam de login por causa dos acessos vindos do Postman
function verificaToken(req, res, next){
    var myToken = req.cookies.token;
  //   console.log(myToken)
    jwt.verify(myToken, 'ProjetoRPCW2022', function(e, payload){
      if(e) res.status(401).jsonp({error: 'Erro na verificação do token: ' + e})
      else {
      //   console.log("Token verificado e válido")
        next()
      } 
    })
}

/* GET para editar notícia. */
router.get('/editar/:idNoticia', verificaToken, (req,res,next) => {
    if (req.cookies.nivel == 'admin'){
        var q = url.parse(req.url,true).query
        if (q.visibilidade != undefined){
            var idNoticia = req.params.idNoticia
            var visibilidade = q.visibilidade
            if (visibilidade == 'invisivel')
                visibilidade = false
            else
                visibilidade = true
            axios.put('http://localhost:3003/noticias/' + idNoticia + '?token=' + req.cookies.token, {visivel: visibilidade})
                .then(resposta => {
                    //console.log(resposta)
                    var decoded = jwt.decode(req.cookies.token,{complete:true})
                    var log = {}
                    log.user = decoded.payload.username;
                    log.data = new Date().toISOString().substring(0,16).split('T').join(' ');
                    log.movimento = "editou a noticia " + idNoticia
                    axios.post("http://localhost:3004/logs",log)
                      .then(dados => console.log("Log adicionado"))
                      .catch(err => {console.log("Erro ao enviar log: " + err)})
                    res.redirect('/')
                })
                .catch(error => {
                    console.log(error)
                    res.render('error',{error: error})
                })
        }
        else
            console.log('Não forneceu a visibilidade na query')
    }
    else
        res.render("warnings",{warnings:["Não tem nível de acesso a esta página!"]})
})

/* GET para eliminar uma notícia. */
router.get('/eliminar/:idNoticia', verificaToken, (req,res,next) => {
    if (req.cookies.nivel == 'admin'){
        var idNoticia = req.params.idNoticia
        if (idNoticia != undefined){
            axios.delete('http://localhost:3003/noticias/' + idNoticia + '?token=' + req.cookies.token)
                .then(resposta => {
                    //console.log(resposta)
                    var decoded = jwt.decode(req.cookies.token,{complete:true})
                    var log = {}
                    log.user = decoded.payload.username;
                    log.data = new Date().toISOString().substring(0,16).split('T').join(' ');
                    log.movimento = "eliminou a noticia " + idNoticia
                    axios.post("http://localhost:3004/logs",log)
                      .then(dados => console.log("Log adicionado"))
                      .catch(err => {console.log("Erro ao enviar log: " + err)})
                    res.redirect('/')
                })
                .catch(error => {
                    console.log(error)
                    res.render('error',{error: error})
                })
        }
        else
            console.log('Não forneceu uma notícia existente')
    }
    else
        res.render("warnings",{warnings:["Não tem nível de acesso a esta página!"]})
})

module.exports = router;