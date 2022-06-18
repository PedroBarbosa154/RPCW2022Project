var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var jwt = require('jsonwebtoken');
var cors = require('cors');

//Ligação à base de dados
var mongoose = require('mongoose')
var mongoDB = 'mongodb://127.0.0.1/ProjetoRPCW2022'
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true})
var db = mongoose.connection;
db.on('error', console.error.bind(console, "Erro de conexão ao MongoDB..."))
db.once('open',function(){
  console.log("Conexão ao MongoDB realizada com sucesso...")
})

var apiRouter = require('./routes/api');
var noticiasRouter = require('./routes/noticias');
var comentariosRouter = require('./routes/comentarios');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(cors());

// Verifica se o pedido veio com o token de acesso
app.use(function(req, res, next){
  var myToken = req.query.token || req.body.token
  if(myToken){
    jwt.verify(myToken, "ProjetoRPCW2022", function(e, payload){
      if(e){
        // console.log('erro 401 verify')
        res.status(401).jsonp({error: e})
      }
      else{
        // console.log('else next')
        req.user = {}
        req.user.username = payload.username
        req.user.nivel = payload.nivel
        next()
      }
    })
  }
  else{
    // console.log('401 else token nulo')
    res.status(401).jsonp({error: "Token inexistente!"})
  }
})

app.use('/api', apiRouter);
app.use('/noticias', noticiasRouter);
app.use('/comentarios',comentariosRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log("erro: " + err);
});

module.exports = app;
