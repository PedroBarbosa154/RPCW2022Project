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
/*router.post('/registar', function(req,res) {

})*/

module.exports = router;
