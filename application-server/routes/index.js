var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');

//É melhor verificar o token em todas as rotas que precisam de login por causa dos acessos vindos do Postman
function verificaToken(req, res, next){
  var myToken = req.cookies.token;
  console.log(myToken)
  jwt.verify(myToken, 'ProjetoRPCW2022', function(e, payload){
    if(e) res.status(401).jsonp({error: 'Erro na verificação do token: ' + e})
    else {
      console.log("Token verificado e válido")
      next()
    } 
  })
}

/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.cookies.token != undefined){
    res.render('index',{logged:'true',nivel:req.cookies.nivel});
  }
  else
    res.render('index')
});

router.get('/registar', (req,res) => {
  res.render('registo');
})

router.get('/upload', verificaToken, (req,res) => {
  if (['admin','produtor'].includes(req.cookies.nivel))
    res.render('upload');
  else
    res.render('error', {error: {status: 401}, message: 'Não tem permissões para submeter conteúdo...'})
})

router.get('/login',(req,res)=>{
  res.render('login');
})

module.exports = router;
