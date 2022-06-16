var express = require('express');
var router = express.Router();
var axios = require('axios');
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

/* GET users listing. */
router.get('/', verificaToken, function(req, res, next) {
  if(req.cookies.nivel === 'admin')
    axios.get('http://localhost:3002/auth/users?token=' + req.cookies.token)
      .then(data => {
        var users = data.data
        res.render('users',{consumidores: users.cs, produtores: users.ps, logged:'true', nivel:req.cookies.nivel});
      })
  else
      res.render('warnings',{warnings:["Não tem nível de acesso a esta página!"]})
});

module.exports = router;

/*------------------------------------------------   USER  ------------------------------------------ */

router.post('/registar',(req,res,next) => {
  axios.post("http://localhost:3002/auth/registar", req.body)
      .then(() => {
        console.log("Registo bem sucedido"); 
        res.redirect('/')
      })
      .catch(err => {
        console.log("Erro ao registar: " + err); 
      })
})

// Se a resposta for bem sucedida isto retorna um token, temos de o guardar nos cookies
router.post('/login',(req,res,next) => {
  axios.post("http://localhost:3002/auth/login", req.body)
      .then(data => {
        console.log("Login bem sucedido");
        console.log('Token: ' + data.data.token)
        res.cookie('token', data.data.token, {
          expires: new Date(Date.now() + '1d'),
          secure: false, // set to true if your using https
          httpOnly: true
        });
        axios.get("http://localhost:3002/auth/users/" + req.body.username + "?token=" + data.data.token)
          .then(data => {
            console.log('entrei aqui')
            res.cookie('nivel',data.data.nivel, {
              expires: new Date(Date.now() + '1d'),
              secure: false, // set to true if your using https
              httpOnly: true
            })
            res.redirect('/');
          })
          .catch(err=> {
            console.log("Erro ao obter utilizador: " + err)
          })
      })
      .catch(err => {
        console.log("Erro ao loggar: " + err);
        if(err.response.status == 401){
          res.redirect('/login');
        }
      })
})

router.get('/logout', verificaToken, (req,res,next)=> {
  res.cookie('token',undefined);
  res.cookie('nivel',undefined);
  res.clearCookie('token');
  res.clearCookie('nivel');
  res.redirect('/');
})