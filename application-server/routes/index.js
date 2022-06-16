var express = require('express');
var router = express.Router();

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

router.get('/upload', (req,res) => {
  res.render('upload');
})

router.get('/login',(req,res)=>{
  res.render('login');
})

module.exports = router;
