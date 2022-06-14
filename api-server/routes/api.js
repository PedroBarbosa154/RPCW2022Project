var express = require('express');
var router = express.Router();
var Recurso = require('../controllers/recursos')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/recursos', function(req, res, next) {
  Recurso.inserir(req.body)
    .then(dados => res.status(201).jsonp({dados: dados}))
    .catch(e => res.status(500).jsonp({error: e}))
});

module.exports = router;
