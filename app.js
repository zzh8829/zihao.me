global.Promise = require('bluebird');

const express        = require('express');
const bodyParser     = require('body-parser');
const cookieParser   = require('cookie-parser');
const errorHandler   = require('errorhandler');
const methodOverride = require('method-override');
const debug          = require('debug')('zihao.me:server');
const path           = require("path");
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
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/api', api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
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

  var bind = typeof port === 'string'
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
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// WebSocket Stuff

const blocks = {}

io.on('connection', function (socket) {
  socket.emit('init',blocks);
  socket.on('insert', function(data) {
    blocks[data] = true;
    io.emit('insert', data);
  });
  socket.on('delete', function(data) {
    delete blocks[data];
    io.emit('delete', data);
  });
  socket.on('clear', function(data) {
    blocks = {}
    io.emit('clear', data);
  })
});


