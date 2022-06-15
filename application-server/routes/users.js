var express = require('express');
var router = express.Router();
var axios = require('axios');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;

/*------------------------------------------------   USER  ------------------------------------------ */

router.post('/registar',(req,res,next) => {
  axios.post("http://localhost:3002/auth/registar", req.body)
      .then(() => {console.log("Registo bem sucedido"); res.redirect('/')})
      .catch(err => {console.log("Erro ao registar: " + err)})
})

router.post('/login',(req,res,next) => {
  axios.post("http://localhost:3002/auth/login", req.body)
      .then(() => {console.log("Login bem sucedido"); res.redirect('/')})
      .catch(err => {console.log("Erro ao registar: " + err)})
})
