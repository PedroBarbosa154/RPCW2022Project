var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose =  require('mongoose');
var session = require('express-session')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy

var mongoDB = 'mongodb://127.0.0.1/ProjetoRPCW2022'
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true})
var db = mongoose.connection;
db.on('error', console.error.bind(console, "Erro de conexão ao MongoDB..."))
db.once('open',function(){
  console.log("Conexão ao MongoDB realizada com sucesso...")
})


// Configuração da estratégia local
passport.use(new LocalStrategy(
  {usernameField: 'username'}, (username, password, done) => {
    axios.get('http://localhost:3002/users/username/' + username)
    .then(dados => {
      const user = dados.data
      if(!user) {  return done(null, false, {message: 'Utilizador inexistente!\n'})}
      return done(null, user)
    })
    .catch(e => done(e))
  })
  )
  
// Indica-se ao passport como serializar o utilizador
passport.serializeUser((user,done) => {
  console.log('Serialização, uname: ' + user.username)
  done(null, user.username)
})
  
// Desserialização: a partir do id obtem-se a informação do utilizador
passport.deserializeUser((uname, done) => {
  console.log('Desserialização, username: ' + uname)
  User.consultarUtilizador(uname)
    .then(dados => done(null, dados))
    .catch(erro => done(erro, false))
})

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var recursosRouter = require('./routes/recursos');
var noticiasRouter = require('./routes/noticias');
var logsRouter = require('./routes/logs');

var app = express();

app.use(session({
  secret: 'ProjetoRPCW2022',
  resave: true,
  saveUninitialized: true
}))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/recursos',recursosRouter);
app.use('/noticias',noticiasRouter);
app.use('/logs',logsRouter);

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
  res.render('error');
});

module.exports = app;
