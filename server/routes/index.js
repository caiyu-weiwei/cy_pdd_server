const express = require('express');
const router = express.Router();
// 引入数据库
const connection = require('./../db/db')
// 引入svg-captcha验证码库
const svgCaptcha = require('svg-captcha')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/**
 * 获取首页轮播图
 */
router.get('/api/homecasual', (req, res) => {
  // 查询数据库数据的sql语句
  let sqlStr = 'select * from pdd_homecasual'
  // 执行sql语句
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      res.json({
        code: 0,
        message: '请求数据失败',
        data: null
      })
    } else {
      res.json({
        code: 200,
        message: '请求数据成功',
        data: results
      })
    }
  })
})

/**
 * 推荐模块列表
 */
router.get('/api/recommendlist', (req, res) => {
  const pageNo = req.query.pageNo || 1
  const pageSize = req.query.pageSize || 20
  // 查询数据库的sql语句
  let sqlStr = 'select * from pdd_recommend limit ' + (pageNo-1)*pageSize + ',' + pageSize
  // 执行查询语句
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      res.json({
        code: 0,
        message: '请求数据失败',
        data: null
      })
    } else {
      res.json({
        code: 200,
        message: '请求数据成功',
        data: results
      })
    }
  })
})

/**
 * 获取一次性图像验证码
 */
router.get('/api/captcha', function(req, res) {
  // 生产随机验证码
  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: '0o1i',
    noise: 2,
    color: true
  })
  console.log('req.session', req.session)
  req.session.captcha = captcha.text.toLocaleLowerCase()
  res.type('svg')
  res.send(captcha.data)
})

module.exports = router;
