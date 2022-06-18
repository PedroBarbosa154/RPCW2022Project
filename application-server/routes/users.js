var express = require('express');
var router = express.Router();
var axios = require('axios');
var jwt = require('jsonwebtoken');
var url = require('url');

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
router.post('/perfil', verificaToken, (req,res,next) => {
  var edicao = req.body
  axios.get('http://localhost:3002/auth/users/meuPerfil?token=' + req.cookies.token)
    .then(dados => {
      // console.log(dados)
      var username = dados.data.username
      axios.put('http://localhost:3002/auth/users/editarPerfil/' + username + '?token=' + req.cookies.token, edicao)
        .then(dados => {
          res.clearCookie('token');
          res.cookie('token', dados.data.token, {
            expires: new Date(Date.now() + '1d'),
            secure: false, // set to true if your using https
            httpOnly: true
          });
          res.redirect('/users/perfil')
        })
        .catch(error => {
          console.log('Erro ao consultar o meu perfil: ' + error)
          res.render('error', {error: error});
        })
    })
    .catch(error => {
      console.log('Erro ao consultar o perfil: ' + error)
      res.render('error', {error: error});
    })
});

router.get('/editarPerfil', verificaToken, (req,res,next) => {
  axios.get('http://localhost:3002/auth/users/meuPerfil?token=' + req.cookies.token)
    .then(dados => {
      console.log(dados)
      res.render('editar_perfil', {title: 'Editar perfil - ' + dados.data.username, user: dados.data, logged: 'true', nivel: req.cookies.nivel})
    })
    .catch(error => {
      console.log('Erro ao consultar o meu perfil: ' + error)
      res.render('error', {error: error});
    })
});

router.get('/perfil', verificaToken, (req,res,next) => {
  axios.get('http://localhost:3002/auth/users/meuPerfil?token=' + req.cookies.token)
    .then(dados => {
      axios.get('http://localhost:3003/api/recursos?submissor=' + dados.data.username + '&token=' + req.cookies.token)
        .then(recursos => {
          console.log(recursos.data)
          res.render('perfil', {title: 'Perfil - ' + dados.data.username,user: dados.data, logged: 'true', nivel: req.cookies.nivel, recursos: recursos.data})
        })
        .catch(error => {
          console.log('Erro ao listar os recursos de um user: ' + error)
          res.render('error', {error: error})
        })
    })
    .catch(error => {
      console.log('Erro ao consultar o meu perfil: ' + error)
      res.render('error', {error: error});
    })
});

router.get('/eliminar/:username', verificaToken, (req,res,next) => {
  var username = req.params.username
  if (username != undefined){
    // console.log(username)
    axios.delete('http://localhost:3002/auth/eliminar?username=' + username + '&token=' + req.cookies.token)
      .then(dados => {
        // console.log(dados)
        console.log('Utilizador eliminado com sucesso')
        res.redirect('/users')
      })
      .catch(error => {
        console.log('Erro ao eliminar o utilizador ' + username + ': ' + error)
        res.render('error', {error: error});
      })
  }
});

router.get('/editar', verificaToken, (req,res,next) => {
  var q = url.parse(req.url,true).query
  if (q.user != undefined){
    var username = q.user
    // console.log(username)
    axios.get('http://localhost:3002/auth/users/' + username + '?token=' + req.cookies.token)
      .then(dados => {
        // console.log(dados)
        var nivel = dados.data.nivel
        res.render('editar_user',{title: 'Edição do utilizador ' + username + ' - ' + nivel, user: dados.data, logged:'true',nivel:req.cookies.nivel})
      })
      .catch(error => {
        console.log('Erro ao consultar o utilizador ' + username)
        res.render('error', {error: error});
      })
  }
});

router.post('/editar', verificaToken, (req,res,next) => {
  var userAtualizado = req.body 
  // console.log(userAtualizado)
  axios.put('http://localhost:3002/auth/users?token=' + req.cookies.token, userAtualizado)
    .then(resposta => {
      console.log(resposta)
      res.redirect('/users')
    })
    .catch(error => {
      console.log('Erro ao editar: ' + error)
      res.render('error', {error: error})
    })
});

router.post('/registar',(req,res,next) => {
  axios.post("http://localhost:3002/auth/registar", req.body)
      .then(() => {
        console.log("Registo bem sucedido"); 
        res.redirect('/login')
      })
      .catch(err => {
        console.log("Erro ao registar: " + err); 
      })
})

// Se a resposta for bem sucedida isto retorna um token, temos de o guardar nos cookies
router.post('/login',(req,res,next) => {
  axios.post("http://localhost:3002/auth/login", req.body)
      .then(data => {
        // console.log("Login bem sucedido");
        // console.log('Token: ' + data.data.token)
        res.cookie('token', data.data.token, {
          expires: new Date(Date.now() + '1d'),
          secure: false, // set to true if your using https
          httpOnly: true
        });
        axios.get("http://localhost:3002/auth/users/" + req.body.username + "?token=" + data.data.token)
          .then(data => {
            // console.log('entrei aqui')
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
  var decoded = jwt.decode(req.cookies.token,{complete:true})
  var log = {}
  log.user = decoded.payload.username;
  log.data = new Date().toISOString().substring(0,16).split('T').join(' ');
  log.movimento = "efetuou logout"
  axios.post("http://localhost:3004/logs",log)
    .then(dados => console.log("Log adicionado"))
    .catch(err => {console.log("Erro ao enviar log: " + err)})
  res.cookie('token',undefined);
  res.cookie('nivel',undefined);
  res.clearCookie('token');
  res.clearCookie('nivel');
  res.redirect('/');
})