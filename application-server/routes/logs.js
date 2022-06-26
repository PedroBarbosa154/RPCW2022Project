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

router.get("/",verificaToken, (req,res,next)=>{
    if(req.cookies.nivel != 'admin'){
        res.render('warnings',{warnings:["Não tem permissão para aceder a esta página!"]})
    }
    else{
        axios.get("http://localhost:8004/logs")
            .then(data => {
                // console.log("Logs existentes")
                // console.log(data)
                sorted = data.data.sort((a,b) => (a.id <= b.id) ? 1 : -1)
                res.render("logs",{logs:sorted,logged:'true',nivel:req.cookies.nivel})
            })
            .catch(err => {
                console.log("Erro ao obter logs: " + err);
                res.render('error',{error:err})
            })
    }
})

router.post("/", verificaToken, (req,res,next)=>{
    if(req.cookies.nivel != 'admin'){
        res.render('warnings',{warnings:["Não tem permissão para aceder a esta página!"]})
    }
    else{
        axios.post("http://localhost:8004/logs",req.body)
            .then(data => {
                console.log("Logs adicionados")
            })
            .catch(err => {
                console.log("Erro ao adicionar logs: " + err);
                res.render('error',{error:err})
            })
    }
});

router.get("/delete/:id",verificaToken, (req,res,next)=>{
    if(req.cookies.nivel != 'admin'){
        res.render('warnings',{warnings:["Não tem permissão para aceder a esta página!"]})
    }
    else{
        axios.delete("http://localhost:8004/logs/"+req.params.id,req.body)
            .then(data => {
                console.log("Log removido")
                res.redirect("/logs")
            })
            .catch(err => {
                console.log("Erro ao remover log: " + err);
                res.render('error',{error:err})
            })
    }
})

module.exports=router;