const express = require('express');
const router = express.Router();
// 引入数据库
const db = require('./../db/db')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
