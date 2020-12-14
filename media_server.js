const fs = require("fs"),
  url = require('url'),
  formidable = require('formidable'),
  http = require('http'),
  util = require('util'),
  os = require("os"),
  path = require('path'),
  setting = require('./app/setting'),
  Render = require('./app/render');

const logger = require('./logger');
require('./setenv'); //加载环境变量

const port = process.env.port || setting.port;

//获取ip地址
let address;
const networks = os.networkInterfaces();
Object.keys(networks).forEach(function (k) {
  for (const kk in networks[k]) {
    if (networks[k][kk].family === "IPv4" && networks[k][kk].address !== "127.0.0.1") {
      address = networks[k][kk].address;
      return address;
    }
  }
});

if (!fs.existsSync(path.join(__dirname, "Images"))) {
  fs.mkdirSync(path.join(__dirname, "Images"))
}

let i = 1;

//创建服务器
const server = http.createServer(function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  logger.debug(' server  收到客户端的请求数量', req.url, req.method, i++);
  if (req.url === "/" && req.method === "GET") {
    //显示主页
    res.setHeader('Content-Type', 'text/html;charset=UTF-8');
    const content = fs.readFileSync("./index.html");
    res.write(content);
    res.end();
  } else if (req.url === "/Images" && req.method === "POST") {
    let ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '';
    if (ip.split(',').length > 0) {
      ip = ip.split(',')[0];
    }
    logger.info(` 上传文件的访问者ip`, ip);
    //上传文件
    const files = [];
    const form = new formidable.IncomingForm();
    form.multiples = true; //启用多文件上传
    form.maxFileSize = 4 * 1024 * 1024 * 1024; //限制上传最大文件为4GB
    form.on('file', function (filed, file) {
      files.push([filed, file]);
    }).parse(req, function (err, fields, files) {
      // console.log("fields", fields);
      //console.log("files", files);
      if (err) {
        logger.debug("err" + err.message);
        return;
      }
      const filesArray = files.files;
      const filesnum = files.files.length;
      //console.log("filesArray", filesArray);
      //console.log("filesnum", filesnum);
      if (Object.prototype.toString.call(files.files) === '[object Object]') {
        const filesname = files.files.name;
        const filesize = files.files.size;
        logger.info(` 上传的是单文件`, filesname);
        if (!/\.mp4$|\.mp3$|\.jpg$|\.png$|\.gif$/gim.test(filesname)) {
          return res.end("非法类型的媒体");
        } else if (/%|#/g.test(filesname)) {
          return res.end("非法的文件名");
        } else if (filesize > 4 * 1024 * 1024 * 1024) {
          return res.end('文件大小超过4GB');
        }
        res.writeHead(200, {
          'content-type': 'application/octet-stream'
        });
        res.write('received upload:\n\n');
        //logger.debug("files", files.files.path);
        const readStream = fs.createReadStream(files.files.path); //读取缓存的文件
        const writeStream = fs.createWriteStream("Images/" + filesname); //创建可写流
        readStream.pipe(writeStream); //写入数据
        readStream.on('end', function () {
          res.end(util.inspect({
            fields,
            files
          }));
          fs.unlinkSync(files.files.path); //删除缓存文件
        });
      } else {
        logger.denug(' 上传的是多文件');
        for (let i = 0; i < filesnum; i++) {
          if (!/\.mp4$|\.mp3$|\.jpg$|\.png$|\.gif$/gim.test(filesArray[i].name)) {
            return res.end("非法类型的媒体");
          } else if (/%|#/g.test(filesArray[i].name)) {
            return res.end("非法的文件名");
          } else if (filesArray[i].size > 4 * 1024 * 1024 * 1024) {
            return res.end('文件大小超过4GB');
          }
          res.write('received upload:\n\n');
          //logger.debug("files", files.files[i].path);
          const readStream = fs.createReadStream(files.files[i].path);
          const writeStream = fs.createWriteStream("Images/" + filesArray[i].name);
          readStream.pipe(writeStream);
          readStream.on('end', function () {
            res.end(util.inspect({
              fields,
              files
            }));
            fs.unlinkSync(files.files[i].path);
          });
        }
      }
    });
  } else if (req.url === "/list" && req.method === "GET") {
    //响应ajax
    let ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '';
    if (ip.split(',').length > 0) {
      ip = ip.split(',')[0];
    }
    logger.info(` ajax访问者ip`, ip);
    const content = fs.readdirSync(path.join(__dirname, "Images"));
    logger.debug(` server  反馈给ajax的请求`, content.length);
    res.write(content.toString());
    res.end();
  } else if (/delete/.test(req.url)) {
    let ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '';
    if (ip.split(',').length > 0) {
      ip = ip.split(',')[0];
    }
    logger.info(` 删除文件的访问者ip`, ip);
    res.setHeader('Content-Type', 'text/plain;charset=UTF-8');
    const pathname = url.parse(req.url).pathname;
    const filename = decodeURIComponent(pathname).split("/")[decodeURIComponent(pathname).split("/").length - 1]; //解码传输过来的信息
    logger.debug(` server delete filename`, filename);
    if (fs.existsSync(`./Images/${filename}`)) { //删除文件时先判断文件状态,如果删除一个不存在的文件,服务器会崩掉
      fs.unlink(`./Images/${filename}`, function (err) {
        if (err) {
          logger.error("delete file error", err);
          throw err;
        }
        logger.info(` ${filename}删除成功!`);
        res.end();
      });
    } else {
      res.end('文件已删除'); //给前台的提示
    }
  } else if (req.url === "/server.js" || req.url === "/Images/" || req.url === "/Images") {
    res.end("403 forbidden");
  } else {
    //静态文件部署
    logger.debug(" server  处理静态文件");
    const _render = new Render(req, res);
    _render.init();
  }
});

server.listen({
  port
});

server.on('listening', function () {
  logger.info(` 服务启动成功,正在监听${port}端口`);
  process.title = `服务启动成功--${address}-${port}`;
});

process.on('unhandledRejection', (error) => {
  logger.error('unhandledRejection', error.stack || error.toString());
});

process.on('uncaughtException', function (error) {
  logger.error('uncaughtException', error.stack || error.toString());
});
