var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/registar', (req,res) => {
  res.render('registo');
})

module.exports = router;
