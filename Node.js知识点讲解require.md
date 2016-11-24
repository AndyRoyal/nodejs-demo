###Node.js 知识点讲解 
####require
require 用来加载一个文件的代码，关于 require 的机制这里不展开讲解，请仔细阅读 [官方文档](https://nodejs.org/api/modules.html)。

简单概括以下几点:

- require 可加载 .js、.json 和 .node 后缀的文件
- require 的过程是同步的，所以这样是错误的:
```
setTimeout(() => {
  module.exports = { a: 'hello' };
}, 0);
```
require 这个文件得到的是空对象 `{}`

- require 目录的机制是:
  - 如果目录下有 package.json 并指定了 main 字段，则用之
  - 如果不存在 package.json，则依次尝试加载目录下的 index.js 和 index.node
- require 过的文件会加载到缓存，所以多次 require 同一个文件（模块）不会重复加载
- 判断是否是程序的入口文件有两种方式:
  - require.main === module（推荐）
  - module.parent === null


#### 循环引用

循环引用（或循环依赖）简单点来说就是 a 文件 require 了 b 文件，然后 b 文件又反过来 require 了 a 文件。我们用 a->b 代表 b require 了 a。

简单的情况:

```
a->b
b->a
```

复杂点的情况:

```
a->b
b->c
c->a
```

循环引用并不会报错，导致的结果是 require 的结果是空对象 `{}`，原因是 b require 了 a，a 又去 require 了 b，此时 b 还没初始化好，所以只能拿到初始值 `{}`。当产生循环引用时一般有两种方法解决：

1. 通过分离共用的代码到另一个文件解决，如上面简单的情况，可拆出共用的代码到 c 中，如下:

```
c->a
c->b
```

2. 不在最外层 require，在用到的地方 require，通常在函数的内部

总的来说，循环依赖的陷阱并不大容易出现，但一旦出现了，对于新手来说还真不好定位。它的存在给我们提了个醒，要时刻注意你项目的依赖关系不要过于复杂，哪天你发现一个你明明已经 exports 了的方法报 `undefined is not a function`，我们就该提醒一下自己：哦，也许是它来了。

官方示例: [https://nodejs.org/api/modules.html#modules_cycles](https://nodejs.org/api/modules.html#modules_cycles)



#### 2.2 exports 和 module.exports

require 用来加载代码，而 exports 和 module.exports 则用来导出代码。

很多新手可能会迷惑于 exports 和 module.exports 的区别，为了更好的理解 exports 和 module.exports 的关系，我们先来巩固下 js 的基础。示例：

**test.js**

```
var a = {name: 1};
var b = a;

console.log(a);
console.log(b);

b.name = 2;
console.log(a);
console.log(b);

var b = {name: 3};
console.log(a);
console.log(b);
```

运行 test.js 结果为：

```
{ name: 1 }
{ name: 1 }
{ name: 2 }
{ name: 2 }
{ name: 2 }
{ name: 3 }
```

**解释**：a 是一个对象，b 是对 a 的引用，即 a 和 b 指向同一块内存，所以前两个输出一样。当对 b 作修改时，即 a 和 b 指向同一块内存地址的内容发生了改变，所以 a 也会体现出来，所以第三四个输出一样。当 b 被覆盖时，b 指向了一块新的内存，a 还是指向原来的内存，所以最后两个输出不一样。

明白了上述例子后，我们只需知道三点就知道 exports 和 module.exports 的区别了：

1. module.exports 初始值为一个空对象 {}
2. exports 是指向的 module.exports 的引用
3. require() 返回的是 module.exports 而不是 exports

Node.js 官方文档的截图证实了我们的观点:

![](./img/2.2.1.png)

#### exports = module.exports = {...}

我们经常看到这样的写法：

```
exports = module.exports = {...}
```

上面的代码等价于:

```
module.exports = {...}
exports = module.exports
```

原理很简单：module.exports 指向新的对象时，exports 断开了与 module.exports 的引用，那么通过 exports = module.exports 让 exports 重新指向 module.exports。

> 小提示：ES6 的 import 和 export 不在本文的讲解范围，有兴趣的读者可以去学习阮一峰老师的[《ECMAScript6入门》](http://es6.ruanyifeng.com/)。



#### 2.3 环境变量


环境变量不属于 Node.js 的知识范畴，只不过我们在开发 Node.js 应用时经常与环境变量打交道，所以这里简单介绍下。

环境变量（environment variables）一般是指在操作系统中用来指定操作系统运行环境的一些参数。在 Mac 和 Linux 的终端直接输入 env，会列出当前的环境变量，如：USER=xxx。简单来讲，环境变量就是传递参数给运行程序的。

在 Node.js 中，我们经常这么用:

```
NODE_ENV=test node app
```

通过以上命令启动程序，指定当前环境变量 `NODE_ENV` 的值为 test，那么在 app.js 中可通过 `process.env` 来获取环境变量:

```
console.log(process.env.NODE_ENV) //test
```

另一个常见的例子是使用 [debug](https://www.npmjs.com/package/debug) 模块时:

```
DEBUG=* node app
```

Windows 用户需要首先设置环境变量，然后再执行程序：

```
set DEBUG=*
set NODE_ENV=test
node app
```

或者使用 [cross-env](https://www.npmjs.com/package/cross-env)：

```
npm i cross-env -g
```

使用方式：

```
cross-env NODE_ENV=test node app
```



#### 2.5 packge.json
package.json 对于 Node.js 应用来说是一个不可或缺的文件，它存储了该 Node.js 应用的名字、版本、描述、作者、入口文件、脚本、版权等等信息。npm 官网有 package.json 每个字段的详细介绍：https://docs.npmjs.com/files/package.json。

## 2.5.1 semver

语义化版本（semver）即 dependencies、devDependencies 和 peerDependencies 里的如：`"co": "^4.6.0"`。

semver 格式：`主版本号.次版本号.修订号`。版本号递增规则如下：

- `主版本号`：做了不兼容的 API 修改
- `次版本号`：做了向下兼容的功能性新增
- `修订号`：做了向下兼容的 bug 修正

更多阅读：

1. http://semver.org/lang/zh-CN/
2. http://taobaofed.org/blog/2016/08/04/instructions-of-semver/

作为 Node.js 的开发者，我们在发布 npm 模块的时候一定要遵守语义化版本的命名规则，即：有 breaking change 发大版本，有新增的功能发小版本，有小的 bug 修复或优化则发修订版本。


#### 2.6 npm 使用注意事项

## 2.6.1 npm init

使用 `npm init` 初始化一个空项目是一个好的习惯，即使你对 package.json 及其他属性非常熟悉，`npm init` 也是你开始写新的 Node.js 应用或模块的一个快捷的办法。`npm init` 有智能的默认选项，比如从根目录名称推断模块名称，通过 `~/.npmrc` 读取你的信息，用你的 Git 设置来确定 repository 等等。

## 2.6.2 npm install

`npm install` 是我们最常用的 npm 命令之一，因此我们需要好好了解下这个命令。终端输入 `npm install -h` 查看使用方式:

![](./img/2.6.1.png)

可以看出：我们通过 `npm install` 可以安装 npm 上发布的某个版本、某个tag、某个版本区间的模块，甚至可以安装本地目录、压缩包和 git/github 的库作为依赖。

> 小提示: `npm i` 是 `npm install` 的简写，建议使用 `npm i`。

直接使用 `npm i` 安装的模块是不会写入 package.json 的 dependencies (或 devDependencies)，需要额外加个参数:

1. `npm i express --save`/`npm i express -S` (安装 express，同时将 `"express": "^4.14.0"` 写入 dependencies )
2. `npm i express --save-dev`/`npm i express -D` (安装 express，同时将 `"express": "^4.14.0"` 写入 devDependencies )
3. `npm i express --save --save-exact` (安装 express，同时将 `"express": "4.14.0"` 写入 dependencies )

第三种方式将固定版本号写入 dependencies，建议线上的 Node.js 应用都采取这种锁定版本号的方式，因为你不可能保证第三方模块下个小版本是没有验证 bug 的，即使是很流行的模块。拿 Mongoose 来说，Mongoose 4.1.4 引入了一个 bug 导致调用一个文档 entry 的 remove 会删除整个集合的文档，见：[https://github.com/Automattic/mongoose/blob/master/History.md#415--2015-09-01](https://github.com/Automattic/mongoose/blob/master/History.md#415--2015-09-01)。

> 后面会介绍更安全的 `npm shrinkwrap` 的用法。

运行以下命令：

```
npm config set save-exact true
```

这样每次 `npm i xxx --save` 的时候会锁定依赖的版本号，相当于加了 `--save-exact` 参数。

> 小提示：`npm config set` 命令将配置写到了 ~/.npmrc 文件，运行 `npm config list` 查看。

## 2.6.3 npm scripts

npm 提供了灵活而强大的 scripts 功能，见 [官方文档](https://docs.npmjs.com/misc/scripts)。

npm 的 scripts 有一些内置的缩写命令，如常用的：

- `npm start` 等价于 `npm run start` 
- `npm test` 等价于 `npm run test` 

## 2.6.4 npm shrinkwrap

前面说过要锁定依赖的版本，但这并不能完全防止意外情况的发生，因为锁定的只是最外一层的依赖，而里层依赖的模块的 package.json 有可能写的是 `"mongoose": "*"`。为了彻底锁定依赖的版本，让你的应用在任何机器上安装的都是同样版本的模块（不管嵌套多少层），通过运行 `npm shrinkwrap`，会在当前目录下产生一个 `npm-shrinkwrap.json`，里面包含了通过 node_modules 计算出的模块的依赖树及版本。上面的截图也显示：只要目录下有 npm-shrinkwrap.json 则运行 `npm install` 的时候会优先使用 npm-shrinkwrap.json 进行安装，没有则使用 package.json 进行安装。

更多阅读：

1. https://docs.npmjs.com/cli/shrinkwrap
2. http://tech.meituan.com/npm-shrinkwrap.html

> 注意: 如果 node_modules 下存在某个模块（如直接通过 `npm install xxx` 安装的）而 package.json 中没有，运行 `npm shrinkwrap` 则会报错。另外，`npm shrinkwrap` 只会生成 dependencies 的依赖，不会生成 devDependencies 的。


####　3.1 初始化一个 Express 项目　supervisor

首先，我们新建一个目录 myblog，在该目录下运行 `npm init` 生成一个 package.json，如下所示：

![](./img/3.1.1.png)

> 注意：括号里的是默认值，如果使用默认值则直接回车即可，否则输入自定义内容后回车。

然后安装 express 并写入 package.json：

```
npm i express@4.14.0 --save 
```

新建 index.js，添加如下代码：

```
var express = require('express');
var app = express();

app.get('/', function(req, res) {
  res.send('hello, express');
});

app.listen(3000);
```

以上代码的意思是：生成一个 express 实例 app，挂载了一个**根路由控制器**，然后监听 3000 端口并启动程序。运行 `node index`，打开浏览器访问 `localhost:3000` 时，页面应显示 hello, express。

这是最简单的一个使用 express 的例子，后面会介绍路由及模板的使用。

## 3.1.1 supervisor

在开发过程中，每次修改代码保存后，我们都需要手动重启程序，才能查看改动的效果。使用 [supervisor](https://www.npmjs.com/package/supervisor) 可以解决这个繁琐的问题，全局安装 supervisor：

```
npm install -g supervisor
```

运行 `supervisor --harmony index` 启动程序，如下所示：

![](./img/3.1.2.png)

supervisor 会监听当前目录下 node 和 js 后缀的文件，当这些文件发生改动时，supervisor 会自动重启程序。


####　3.2 路由

前面我们只是**挂载了根路径的路由控制器**，现在修改 index.js 如下：

```
var express = require('express');
var app = express();

app.get('/', function(req, res) {
  res.send('hello, express');
});

app.get('/users/:name', function(req, res) {
  res.send('hello, ' + req.params.name);
});

app.listen(3000);
```

以上代码的意思是：当访问根路径时，依然返回 hello, express，当访问如 `localhost:3000/users/nswbmw` 路径时，返回 hello, nswbmw。路径中 `:name` 起了占位符的作用，这个占位符的名字是 name，可以通过 `req.params.name` 取到实际的值。

> 小提示：express 使用了 [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) 模块实现的路由匹配。

不难看出：req 包含了请求来的相关信息，res 则用来返回该请求的响应，更多请查阅 [express 官方文档](http://expressjs.com/en/4x/api.html)。下面介绍几个常用的 req 的属性：

- `req.query`: 解析后的 url 中的 querystring，如 `?name=haha`，req.query 的值为 `{name: 'haha'}`
- `req.params`: 解析 url 中的占位符，如 `/:name`，访问 /haha，req.params 的值为 `{name: 'haha'}`
- `req.body`: 解析后请求体，需使用相关的模块，如 [body-parser](https://www.npmjs.com/package/body-parser)，请求体为 `{"name": "haha"}`，则 req.body 为 `{name: 'haha'}`

## 3.2.1 express.Router

上面只是很简单的路由使用的例子（将所有路由控制函数都放到了 index.js），但在实际开发中通常有几十甚至上百的路由，都写在 index.js 既臃肿又不好维护，这时可以使用 express.Router 实现更优雅的路由解决方案。在 myblog 目录下创建空文件夹 routes，在 routes 目录下创建 index.js 和 users.js。最后代码如下：

**index.js**

```
var express = require('express');
var app = express();
var indexRouter = require('./routes/index');
var userRouter = require('./routes/users');

app.use('/', indexRouter);
app.use('/users', userRouter);

app.listen(3000);
```

**routes/index.js**

```
var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.send('hello, express');
});

module.exports = router;
```

**routes/users.js**

```
var express = require('express');
var router = express.Router();

router.get('/:name', function(req, res) {
  res.send('hello, ' + req.params.name);
});

module.exports = router;
```

以上代码的意思是：我们将 `/` 和 `/users/:name` 的路由分别放到了 routes/index.js 和 routes/users.js 中，每个路由文件通过生成一个 express.Router 实例 router 并导出，通过 `app.use` **挂载**到不同的路径。这两种代码实现了相同的功能，但在实际开发中推荐
**使用 express.Router 将不同的路由分离到不同的路由文件中**。

更多 express.Router 的用法见 [express 官方文档](http://expressjs.com/en/4x/api.html#router)。


####　3.3 模板引擎


模板引擎（Template Engine）是一个将页面模板和数据结合起来生成 html 的工具。上例中，我们只是返回纯文本给浏览器，现在我们修改代码返回一个 html 页面给浏览器。

## 3.3.1 ejs

模板引擎有很多，[ejs](https://www.npmjs.com/package/ejs) 是其中一种，因为它使用起来十分简单，而且与 express 集成良好，所以我们使用 ejs。安装 ejs：

```
npm i ejs --save
```

修改 index.js 如下：

**index.js**

```
var path = require('path');
var express = require('express');
var app = express();
var indexRouter = require('./routes/index');
var userRouter = require('./routes/users');

app.set('views', path.join(__dirname, 'views'));// 设置存放模板文件的目录
app.set('view engine', 'ejs');// 设置模板引擎为 ejs

app.use('/', indexRouter);
app.use('/users', userRouter);

app.listen(3000);
```

通过 `app.set` 设置模板引擎为 ejs 和存放模板的目录。在 myblog 下新建 views 文件夹，在 views 下新建 users.ejs，添加如下代码：

**views/users.ejs**

```
<!DOCTYPE html>
<html>
  <head>
    <style type="text/css">
      body {padding: 50px;font: 14px "Lucida Grande", Helvetica, Arial, sans-serif;}
    </style>
  </head>
  <body>
    <h1><%= name.toUpperCase() %></h1>
    <p>hello, <%= name %></p>
  </body>
</html>
```

修改 routes/users.js 如下：

**routes/users.js**

```
var express = require('express');
var router = express.Router();

router.get('/:name', function(req, res) {
  res.render('users', {
    name: req.params.name
  });
});

module.exports = router;
```

通过调用 `res.render` 函数渲染 ejs 模板，res.render 第一个参数是模板的名字，这里是 users 则会匹配 views/users.ejs，第二个参数是传给模板的数据，这里传入 name，则在 ejs 模板中可使用 name。`res.render` 的作用就是将模板和数据结合生成 html，同时设置响应头中的 `Content-Type: text/html`，告诉浏览器我返回的是 html，不是纯文本，要按 html 展示。现在我们访问 `localhost:3000/users/haha`，如下图所示：

![](./img/3.3.1.png)

上面代码可以看到，我们在模板 `<%= name.toUpperCase() %>` 中使用了 JavaScript 的语法 `.toUpperCase()` 将名字转化为大写，那这个 `<%= xxx %>` 是什么东西呢？ejs 有 3 种常用标签：

1. `<% code %>`：运行 JavaScript 代码，不输出
2. `<%= code %>`：显示转义后的 HTML内容
3. `<%- code %>`：显示原始 HTML 内容

> 注意：`<%= code %>` 和 `<%- code %>` 都可以是 JavaScript 表达式生成的字符串，当变量 code 为普通字符串时，两者没有区别。当 code 比如为 `<h1>hello</h1>` 这种字符串时，`<%= code %>` 会原样输出 `<h1>hello</h1>`，而 `<%- code %>` 则会显示 H1 大的 hello 字符串。

下面的例子解释了 `<% code %>` 的用法：

**Data**

```
supplies: ['mop', 'broom', 'duster']
```

**Template**

```
<ul>
<% for(var i=0; i<supplies.length; i++) {%>
   <li><%= supplies[i] %></li>
<% } %>
</ul>
```

**Result**

```
<ul>
  <li>mop</li>
  <li>broom</li>
  <li>duster</li>
</ul>
```

更多 ejs 的标签请看 [官方文档](https://www.npmjs.com/package/ejs#tags)。

## 3.3.2 includes

我们使用模板引擎通常不是一个页面对应一个模板，这样就失去了模板的优势，而是把模板拆成可复用的模板片段组合使用，如在 views 下新建 header.ejs 和 footer.ejs，并修改 users.ejs：

**views/header.ejs**

```
<!DOCTYPE html>
<html>
  <head>
    <style type="text/css">
      body {padding: 50px;font: 14px "Lucida Grande", Helvetica, Arial, sans-serif;}
    </style>
  </head>
  <body>
```

**views/footer.ejs**

```
  </body>
</html>
```

**views/users.ejs**

```
<%- include('header') %>
  <h1><%= name.toUpperCase() %></h1>
  <p>hello, <%= name %></p>
<%- include('footer') %>
```

我们将原来的 users.ejs 拆成出了 header.ejs 和 footer.ejs，并在 users.ejs 通过 ejs 内置的 include 方法引入，从而实现了跟以前一个模板文件相同的功能。

> 小提示：拆分模板组件通常有两个好处：
>
> 1. 模板可复用，减少重复代码
> 2. 主模板结构清晰

> 注意：要用 `<%- include('header') %>` 而不是 `<%= include('header') %>`


####3.4 Express 浅析

前面我们讲解了 express 中路由和模板引擎 ejs 的用法，但 express 的精髓并不在此，在于中间件的设计理念。

## 3.4.1 中间件与 next

express 中的中间件（middleware）就是用来处理请求的，当一个中间件处理完，可以通过调用 `next()` 传递给下一个中间件，如果没有调用 `next()`，则请求不会往下传递，如内置的 `res.render` 其实就是渲染完 html 直接返回给客户端，没有调用 `next()`，从而没有传递给下一个中间件。看个小例子，修改 index.js 如下：

**index.js**

```
var express = require('express');
var app = express();

app.use(function(req, res, next) {
  console.log('1');
  next();
});

app.use(function(req, res, next) {
  console.log('2');
  res.status(200).end();
});

app.listen(3000);
```

此时访问 `localhost:3000`，终端会输出：

```
1
2
```

通过 `app.use` 加载中间件，在中间件中通过 next 将请求传递到下一个中间件，next 可接受一个参数接收错误信息，如果使用了 `next(error)`，则会返回错误而不会传递到下一个中间件，修改 index.js 如下：

**index.js**

```
var express = require('express');
var app = express();

app.use(function(req, res, next) {
  console.log('1');
  next(new Error('haha'));
});

app.use(function(req, res, next) {
  console.log('2');
  res.status(200).end();
});

app.listen(3000);
```

此时访问 `localhost:3000`，终端会输出错误信息：
Error:
haha...
![](./img/3.4.1.png)

浏览器会显示：
Error:
haha...
![](./img/3.4.2.png)

> 小提示：`app.use` 有非常灵活的使用方式，详情见 [官方文档](http://expressjs.com/en/4x/api.html#app.use)。

express 有成百上千的第三方中间件，在开发过程中我们首先应该去 npm 上寻找是否有类似实现的中间件，尽量避免造轮子，节省开发时间。下面给出几个常用的搜索 npm 模块的网站：

1. [http://npmjs.com](http://npmjs.com)(npm 官网)
2. [http://node-modules.com](http://node-modules.com)
3. [https://npms.io](https://npms.io)
4. [https://nodejsmodules.org](https://nodejsmodules.org)

> 小提示：express@4 之前的版本基于 connect 这个模块实现的中间件的架构，express@4 及以上的版本则移除了对 connect 的依赖自己实现了，理论上基于 connect 的中间件（通常以 `connect-` 开头，如 `connect-mongo`）仍可结合 express 使用。

> 注意：中间件的加载顺序很重要！比如：通常把日志中间件放到比较靠前的位置，后面将会介绍的 `connect-flash` 中间件是基于 session 的，所以需要在 `express-session` 后加载。

## 3.4.2 错误处理

上面的例子中，应用程序为我们自动返回了错误栈信息（express 内置了一个默认的错误处理器），假如我们想手动控制返回的错误内容，则需要加载一个自定义错误处理的中间件，修改 index.js 如下：

**index.js**

```
var express = require('express');
var app = express();

app.use(function(req, res, next) {
  console.log('1');
  next(new Error('haha'));
});

app.use(function(req, res, next) {
  console.log('2');
  res.status(200).end();
});

//错误处理
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000);
```

此时访问 `localhost:3000`，浏览器会显示 `Something broke!`。

> 小提示：关于 express 的错误处理，详情见 [官方文档](http://expressjs.com/en/guide/error-handling.html)。


#### 4.1 开发环境


















![](http://upload-images.jianshu.io/upload_images/1270354-65b6759fc23827c2.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> 一盏灯， 一片昏黄； 一简书， 一杯淡茶。 守着那一份淡定， 品读属于自己的寂寞。 保持淡定， 才能欣赏到最美丽的风景！ 保持淡定， 人生从此不再寂寞。