const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const session = require('express-session')

const app = express();


// 跨域配置
app.all("*", function(req, res, next) {
  if (!req.get("Origin")) return next();
  // use "*" here to accept any origin
  res.set("Access-Control-Allow-Origin","*");
  res.set("Access-Control-Allow-Methods", "GET");
  res.set("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
  // res.set('Access-Control-Allow-Max-Age', 3600);
  if ("OPTIONS" === req.method) return res.sendStatus(200);
  next();
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// 使用 cookieParser 中间件;
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 需要在路由及设置页面之前进行session配置
app.use(session({
  secret: '123456', // 对session id 相关的cookie进行签名
  resave: false,
  saveUninitialized: true, // 是否保存未初始化的会话
  cookie: { 
    secure: false, // 当 secure 值为 true 时，在 HTTPS 中才有效；反之，cookie 在 HTTP 中是有效。
    maxAge: 1000 * 60 * 60 * 24 // 设置session中有效时长， 单位为毫秒
  }
}))

app.use('/', indexRouter);
app.use('/users', usersRouter);

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
