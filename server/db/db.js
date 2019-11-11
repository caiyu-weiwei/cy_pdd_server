// 引入mysql
const mysql = require('mysql')
// 创建连接
const connection = mysql.createConnection({
  host: '127.0.0.1',  // 数据库地址
  user: 'root',  // 数据库账号
  password: '538194caiyu',  //  数据库密码
  database: 'cy_pdd'  //  数据库名称
})

connection.connect()

module.exports = connection