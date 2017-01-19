  // Setup all required variables
  var configs = require('./config.js');
  var OAuth2 = require('oauth').OAuth2;
  var https = require('https');
  var http = require('http');
  var express = require('express');
  var bodyParser = require('body-parser');
  var searcher = require('./app.js');

  // Create and configure new express app
  var app = express();
  app.use(bodyParser.urlencoded({ extended: true}));
  app.use(bodyParser.json());

  // Routing for post at '/' URL
  app.post('/', function(req,res) {

    // Variables for POST
    var twilio = require('twilio');
    var twiml = new twilio.TwimlResponse();
    var SEARCH_QUERY = req.body.Body.trim().replace(' ', '_');
    var oAuth2 = new OAuth2(configs.KEY,configs.SECRET, 'https://api.twitter.com/', null, 'oauth2/token', null);

    // Get OAuth2 Access for Twitter API
    oAuth2.getOAuthAccessToken('', { 'grant_type' : 'client_credentials'}, function(e, access_token) {
      var options = {
        hostname: 'api.twitter.com',
        path: '/1.1/search/tweets.json?q=' + SEARCH_QUERY +
        "&result_type=popular",
        headers: {
          Authorization: 'Bearer ' + access_token
        }
      };

      // Get the tweets from Twitter API
      https.get(options, function(result) {

        var buffer = '';
        result.setEncoding('utf8');

        result.on('data', function (data) {
          buffer += data;
        });

        result.on('end', function() {
          // Build the message response from recieved tweets
          var statuses = JSON.parse(buffer).statuses;
          var tweets = '';
          for(var i = 0; i < statuses.length; i++){
            var status = statuses[i].user.name + " said " +
                          statuses[i].text + "\n\n";
            if((status.length + tweets.length) > 1600) break;
            tweets = tweets + status;
          }

          // Check to make sure there are tweets
          if(statuses.length == 0) tweets = "Sorry, no tweets were found.";

          // Create message and respond
          twiml.message(tweets);
          res.writeHead(200, {'Content-Type' : 'text/xml'});
          res.end(twiml.toString());
        });
      });
    });
  });

  // Initialize server to listen for texts
  http.createServer(app).listen((process.env.PORT || 1337), function() {});
