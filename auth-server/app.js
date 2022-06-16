var createError = require('http-errors');
var express = require('express');
var logger = require('morgan');
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
const { createHash } = require('crypto');
const User = require('./controllers/users');
var mongoose = require('mongoose');
var session = require('express-session');

mongoose.connect('mongodb://127.0.0.1:27017/ProjetoRPCW2022', 
      { useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000});
  
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erro de conexão ao MongoDB...'));
db.once('open', function() {
  console.log("Conexão ao MongoDB realizada com sucesso...")
});

var app = express();

app.use(session({
  secret: 'ProjetoRPCW2022',
  resave: true,
  saveUninitialized: true
}))

// Configuração da estratégia local
passport.use(new LocalStrategy(
  {usernameField: 'username'}, (username, password, done) => {
    password_encriptada = createHash('sha256').update(password).digest('hex');
    // console.log(password_encriptada)
    User.consultarUtilizador(username)
      .then(dados => {
        const user = dados
        // console.log(dados)
        if(!user) { return done(null, false, {message: 'Utilizador inexistente!\n'})}
        if(password_encriptada != user.password) { return done(null, false, {message: 'Credenciais inválidas!\n'})}
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

var authRouter = require('./routes/autenticacao');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRouter);

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
  console.log({error: err})
});

module.exports = app;
