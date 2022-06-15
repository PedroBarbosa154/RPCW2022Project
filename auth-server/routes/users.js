var express = require('express');
var router = express.Router();
var User = require('../controllers/users');

var passport = require('passport')
var jwt = require('jsonwebtoken')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* POST users */
router.post('/registar', function(req,res,next) {
  console.log(req.body)
  var username = req.body.username 
  User.consultar(username)
    .then(response => {
      if(response == null){
        User.registar(req.body)
          .then(response => {
             console.log('Registo do utilizador com username ' + username)
             res.status(201).jsonp(response)
          })
          .catch(error => res.status(500).jsonp(error))
      }
      else res.status(501).jsonp("Esse username já existe!")
    })
    .catch(error => res.status(502).jsonp(error))
})

module.exports = router;
