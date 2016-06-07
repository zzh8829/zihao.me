const express = require('express');
const router  = express.Router();
const request = require('request');
const cheerio = require('cheerio');

/* GET users listing. */
router.all('/', (req, res) => {
  res.send('ok');
});

router.all('/code', (req, res) => {
  request.post('http://codepad.org', { form: {
    lang: req.body.lang || req.query.lang || 'Python',
    code: req.body.code || req.query.code,
    run: 'True',
    submit: 'Submit'
  } },
    (error, response) => {
      const redirect = response.headers.location;

      request(redirect, (rerr, rres, body) => {
        const $ = cheerio.load(body);
        const output = $($('a[name=output]').next().find('pre')[1]).text();
        res.json({ output, url: redirect });
      });
    });
});

module.exports = router;
