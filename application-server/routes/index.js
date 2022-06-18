var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var axios = require('axios');

//É melhor verificar o token em todas as rotas que precisam de login por causa dos acessos vindos do Postman
function verificaToken(req, res, next){
  var myToken = req.cookies.token;
  // console.log(myToken)
  jwt.verify(myToken, 'ProjetoRPCW2022', function(e, payload){
    if(e) res.status(401).jsonp({error: 'Erro na verificação do token: ' + e})
    else {
      // console.log("Token verificado e válido")
      next()
    } 
  })
}

/* GET home page. */
router.get('/', function(req, res, next) {
  //Pedir à api os dados de todas as notícias visíveis
  if(req.cookies.token != undefined){
    axios.get('http://localhost:3003/noticias?token=' + req.cookies.token)
      .then(noticias => {
        var noticias = noticias.data
        // console.log(noticias)
        res.render('index',{title: 'Homepage',logged:'true',nivel:req.cookies.nivel, noticias: noticias});
      })
      .catch(error => {
        console.log(error)
        res.render('error', {error: error})
      })
  }
  else
    res.render('index',{title:'Homepage'})
});

router.get('/registar', (req,res) => {
  res.render('registo');
})

router.get('/upload', verificaToken, (req,res) => {
  if (['admin','produtor'].includes(req.cookies.nivel))
    res.render('upload',{logged:'true',nivel:req.cookies.nivel});
  else
    res.render('error', {error: {status: 401}, message: 'Não tem permissões para submeter conteúdo...'})
})

router.get('/login',(req,res)=>{
  res.render('login');
})

module.exports = router;
