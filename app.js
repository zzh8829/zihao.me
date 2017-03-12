global.Promise = require('bluebird');

const express        = require('express');
const bodyParser     = require('body-parser');
const cookieParser   = require('cookie-parser');
const path           = require('path');

const app    = express();
const server = require('http').createServer(app);
const io     = require('socket.io').listen(server);
const port   = process.env.PORT || 8080;

app.set('port', port);
app.set('views', path.join(__dirname, 'src/views'));
app.set('view engine', 'pug');

app.enable('trust proxy');
app.disable('X-Powered-By');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const routes = require('./src/routes/index');
const api    = require('./src/routes/api');

app.use('/', routes);
app.use('/api', api);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// render error page
app.use((err, req, res, next) => {
  const error = err;
  error.status = error.status || 500;
  if (app.get('env') !== 'development') {
    error.stack = 'Sorry...';
  }
  res.status(error.status);
  res.render('error', { error });
});

// WebSocket Stuff

let blocks = {};

io.on('connection', (socket) => {
  socket.emit('init', blocks);
  socket.on('insert', (data) => {
    blocks[data] = true;
    socket.broadcast.emit('insert', data);
  });
  socket.on('delete', (data) => {
    delete blocks[data];
    socket.broadcast.emit('delete', data);
  });
  socket.on('clear', (data) => {
    blocks = {};
    socket.broadcast.emit('clear', data);
  });
  socket.on('generate', () => {
    io.sockets.emit('clear');
    blocks = generateMap();
    io.sockets.emit('init', blocks);
  });
});

const worldWidth = 64;
const worldDepth = 64;
const worldHalfWidth = worldWidth / 2;
const worldHalfDepth = worldDepth / 2;

/*eslint-disable */
const ImprovedNoise = require('./ImprovedNoise.js');

function generateMap() {
  const data = generateHeight(worldWidth, worldDepth);
  const getY = ((x, z) => {
    return (data[x + z * worldWidth] * 0.18) | 0;
  });

  const blocks = {};
  for (let z = 0; z < worldDepth; z ++) {
    for (let x = 0; x < worldWidth; x ++) {
      pos = [x - worldHalfWidth, getY(x, z), z - worldHalfDepth];
      blocks[pos] = true;
    }
  }
  return blocks;
}
function generateHeight(width, height) {
  var data = [], perlin = ImprovedNoise(),
    size = width * height, quality = 2, z = Math.random() * 100;
  for (var j = 0; j < 4; j ++) {
    if (j === 0) for (var i = 0; i < size; i ++) data[i] = 0;
    for (var i = 0; i < size; i ++) {
      var x = i % width, y = (i / width) | 0;
      data[i] += perlin.noise(x / quality, y / quality, z) * quality;
    }
    quality *= 4;
  }
  return data;
}
/*eslint-enable */

server.listen(port);
