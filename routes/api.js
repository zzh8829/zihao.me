const express = require('express');
const router  = express.Router();
const request = require('request');

/* GET users listing. */
router.get('/', (req, res) => {
  res.send('respond with a resource');
});

router.post('/codepad', (req, res) => {
  request.post('http://codepad.org', { form: req.body },
    (error, response) => {
      const redirect = response.headers.location;
      console.log(redirect);
      request(redirect).pipe(res);
    });
});

module.exports = router;
