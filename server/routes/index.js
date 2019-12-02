const express = require('express');
const router = express.Router();
// 引入数据库
const connection = require('./../db/db')
// 引入svg-captcha验证码库
const svgCaptcha = require('svg-captcha')

const sms_util = require('../util/sms_util')

const md5 = require('blueimp-md5')

// 存储用户信息
let users = {}
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
  req.session.captcha = captcha.text.toLowerCase()
  console.log('图片验证码 req.session.captcha', req.session.captcha)
  res.type('svg')
  res.send(captcha.data)
})

/**
 * 获取短信验证码
 */
router.get('/api/send_code', function(req, res) {
  // 获取手机号
  let phone = req.query.phone
  // 六位随机数
  let code = sms_util.randomCode(6)
  users[phone] = code

  // 【短信】应用未上线，模板短信接收号码外呼受限
  // sms_util.sendCode(phone, code, function (success) {
  //   if (success) {
  //     res.json({
  //       code: 200,
  //       message: '验证码发送成功',
  //       data: null
  //     })
  //   } else {
  //     res.json({
  //       code: 0,
  //       message: '验证码发送失败',
  //       data: null
  //     })
  //   }
  // })
  res.json({ code: 200, message: '验证码发送成功', data: code })
})

/**
 * 手机短信验证码登录
 */
router.post('/api/login_code', function(req, res) {
  // 获取手机号和验证码
  const phone = req.body.phone
  const code = req.body.code
  // 验证短信验证码是否正确
  if (users[phone] !== code) {
    res.json({
      code: 0,
      message: '验证码错误！',
      data: null
    })
    return
  }
  delete users[phone]
  let sqlStr = 'select * from pdd_user_info where user_phone = ' + phone + ' limit 1'
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      res.json({
        code: 0,
        message: '数据查询失败！',
        data: null
      })
    } else {
      const result = JSON.parse(JSON.stringify(results))
      if (result[0]) {
        // 用户已存在
        req.session.userId = result[0].id
        res.json({
          code: 200,
          message: '成功找到用户！',
          data: {
            userId: result[0].id,
            userName: result[0].user_name,
            userPhone: result[0].user_phone
          }
        })
      } else {
        let insertStr = 'insert into pdd_user_info(user_name, user_phone) values (?, ?)'
        let insertParams = [phone, phone]
        connection.query(insertStr, insertParams, (error, results, fields) => {
          const rest = JSON.parse(JSON.stringify(results))
          console.log('rest', rest)
          if (!error) {
            let sqlStr = 'select * from pdd_user_info where id= ' + rest.insertId + ' limit 1'
            console.log('sqlStr', sqlStr)
            connection.query(sqlStr, (error, results, fields) => {
              if (error) {
                res.json({
                  code: 0,
                  message: '数据查询失败！',
                  data: null
                })
              } else {
                let result = JSON.parse(JSON.stringify(results))
                res.json({
                  code: 200,
                  message: '成功找到用户！',
                  data: {
                    userId: result[0].id,
                    userName: result[0].user_name,
                    userPhone: result[0].user_phone
                  }
                })
              }
            })
          }
        })
      }
    }
  })

  
})

/**
 * 用户名、密码登录
 */
router.post('/api/login_captcha', function(req, res) {
  const user_name = req.body.userName
  // 密码加密处理
  const user_pwd = md5(req.body.pwd)
  const captcha = req.body.captcha.toLowerCase()
  if (captcha !== req.session.captcha) {
    res.json({
      code: 0,
      message: '图形验证码错误！',
      data: null
    })
  }
  delete req.session.captcha
  // 根据用户名查询用户信息 sql语句
  let sqlStr = "select * from pdd_user_info where user_name = '" + user_name + "' limit 1"
  console.log(sqlStr)
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      res.json({
        code: 0,
        message: '用户名错误，请输入正确的用户名！',
        data: null
      })
    } else {
      results = JSON.parse(JSON.stringify(results))
      if (results[0]) {
        if (results[0].user_pwd !== user_pwd) {
          res.json({
            code: 0,
            message: '密码错误，请输入正确密码！',
            data: null
          })
        } else {
          res.json({
            code: 200,
            message: '登录成功！',
            data: {
              userId: results[0].id,
              userName: results[0].user_name
            }
          })
        }
      } else {
        let insertStr = 'insert into pdd_user_info(user_name, user_pwd) values (?, ?) '
        let insertParams = [user_name, user_pwd]
        connection.query(insertStr, insertParams, (error, results, fields) => {
          if (!error) {
            results = JSON.parse(JSON.stringify(results))
            req.session.userId = results.insertId
            let sqlStr = "select * from pdd_user_info where user_name= '" + user_name + "' limit 1"
            connection.query(sqlStr, (error, results, fields) => {
              results = JSON.parse(JSON.stringify(results))
              if (error) {
                res.json({
                  code: 0,
                  message: '数据查询失败！',
                  data: null
                })
              } else {
                res.json({
                  code: 200,
                  message: '登录成功！',
                  data: {
                    userId: results[0].id,
                    userName: results[0].user_name
                  }
                })
              }
            })
          }
        })
      }
    }
  })

})

/**
 * 获取用户信息
 */
router.get('/api/user_info', function(req, res) {
  const userId = req.session.userId
  let sqlStr = 'select * from pdd_user_info where id = ' + userId + ' limit 1'
  connection.query(sqlStr, (error, results, fields) => {
    if (error) {
      res.json({
        code: 0,
        message: '用户查询失败！',
        data: null
      })
      delete req.session.userId
    } else {
      results = JSON.parse(JSON.stringify(results))
      if (!results[0]) {
        res.json({
          code: 1,
          message: '用户不存在，请重新登录！',
          data: null
        })
      } else {
        res.json({
          code: 200,
          message: '用户查询成功！',
          data: {
            userId: results[0].id,
            userName: results[0].user_name,
            userPhone: results[0].user_phone
          }
        })
      }
    }
  })
})

/**
 * 退出登录
 */
router.get('/api/logout', function(req, res) {
  delete req.session.userId
  res.json({
    code: 200,
    message: '退出登录成功'
  })
})

module.exports = router;
