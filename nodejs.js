
//通过express的框架挂载不同目录的响应
var express = require('express');
var app = express();


var path = require('path');
var express = require('express');
var app = express();
//var indexRouter = require('./routes/index');
var userRouter = require('./routes/users');

app.set('views', path.join(__dirname, 'views'));// 设置存放模板文件的目录
app.set('view engine', 'ejs');// 设置模板引擎为 ejs

//app.use('/', indexRouter);
app.use('/users', userRouter);

//app.listen(3000);

/*app.use('/',function(req,res){
	console.log(1212211212);
	res.write('<h1>hello fgsdfgworld</h1>');
	res.send(1111111111111111);
});
*/







app.get('/', function(req, res) {
  res.send('hello, express');
});

app.get('/users/:name', function(req, res) {
  res.send('hello, ' + req.params.name);
});
app.get('/a/a',function(req,res){//test
  res.send("hello a");
});
app.get('/b/b',function(req,res){//test
	res.send('hello b');
})
app.listen(3000);
console.log("-----~~~~~~~~~~~~~~~--is listen 3000");

//------------------------------
//下面是一个通过 http.request 发送 POST 请求的代码：
//httprequest.js
/*var http = require('http');
var querystring = require('querystring');
var contents = querystring.stringify({
 name: 'byvoid',
 email: 'byvoid@byvoid.com',
 address: 'Zijing 2#, Tsinghua University',
});
var options = {
 host: 'www.byvoid.com',
 path: '/application/node/post.php',
 method: 'POST',
 headers: {
 'Content-Type': 'application/x-www-form-urlencoded',
 'Content-Length' : contents.length
 }
};
var req = http.request(options, function(res) {
 res.setEncoding('utf8');
 res.on('data', function (data) {
 console.log(data);
 });
});
req.write(contents);
req.end();*/


/*console.log('%s: %d', 'Hello', 25);//输出到控制台

debugger;//不会报错也不会停
console.log("进入文件111");//输出到控制台
//创建一个 HTTP 服务器
var http = require('http');
http.createServer(function(req,res){
	//输出响应头解析文件类型
    res.writeHead(200,{'content-Type':'text/html'});
    res.write('<h1>hello world</h1>');//输出到浏览器
    res.end('<h1>node.js</h1>');
}).listen(3000);
console.log('HTTP server is listening at port 3000.')*/
