global.Promise = require('bluebird');

const express        = require('express');
const bodyParser     = require('body-parser');
const cookieParser   = require('cookie-parser');
const errorHandler   = require('errorhandler');
const methodOverride = require('method-override');
const debug          = require('debug')('zihao.me:server');
const path           = require('path');
const logger         = require('morgan');
const cors           = require('cors');

const app    = express();
const server = require('http').createServer(app);
const io     = require('socket.io').listen(server);
const port   = process.env.PORT || 3000;

const routes = require('./routes/index');
const api    = require('./routes/api');

app.set('port', port);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.disable('x-powered-by');

app.use(cors());
app.use(logger('dev'));
app.use(methodOverride());
app.use(errorHandler());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/api', api);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res) => {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

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
const ImprovedNoise = require('./public/js/vendor/three.js/examples/js/ImprovedNoise.js');

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
