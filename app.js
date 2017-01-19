
  var configs = require('./config.js');
  var OAuth2 = require('oauth').OAuth2;
  var https = require('https');
  var http = require('http');
  var express = require('express');
  var bodyParser = require('body-parser');
  var searcher = require('./app.js');

  var app = express();

  app.use(bodyParser.urlencoded({ extended: true}));

  app.use(bodyParser.json());

  app.post('/', function(req,res) {
    var twilio = require('twilio');
    var twiml = new twilio.TwimlResponse();
    var SEARCH_QUERY = req.body.Body;
    var oAuth2 = new OAuth2(configs.KEY,configs.SECRET, 'https://api.twitter.com/', null, 'oauth2/token', null);

    oAuth2.getOAuthAccessToken('', { 'grant_type' : 'client_credentials'}, function(e, access_token) {
      var options = {
        hostname: 'api.twitter.com',
        path: '/1.1/search/tweets.json?q=' + SEARCH_QUERY +
        "&result_type=popular",
        headers: {
          Authorization: 'Bearer ' + access_token
        }
      };

      https.get(options, function(result) {
        var buffer = '';
        result.setEncoding('utf8');

        result.on('data', function (data) {
          buffer += data;
        });

        result.on('end', function() {
          var statuses = JSON.parse(buffer).statuses;
          var tweets = '';
          for(var i = 0; i < statuses.length; i++){
            var status = statuses[i].user.name + " said " +
                          statuses[i].text + "\n";
            tweets = tweets + status;
          }
          console.log(tweets);
          twiml.message(tweets);
          res.writeHead(200, {'Content-Type' : 'text/xml'});
          res.end(twiml.toString());
        });
      });

    });

  });

  http.createServer(app).listen((process.env.PORT || 1337), function() {});
