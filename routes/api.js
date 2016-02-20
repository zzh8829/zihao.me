var express = require('express');
var router = express.Router();
var request = require('request');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/codepad', function(req, res, next) {
  request.post("http://codepad.org", {form: req.body }, 
    function (error, response, body) {
	  var redirect = response.headers['location'];
	  console.log(redirect);
	  request(redirect).pipe(res);
	}
  );
});

module.exports = router;
