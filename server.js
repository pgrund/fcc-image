var express = require('express');
var https = require('https');
var querystring = require('querystring');
var expressMongoDb = require('express-mongo-db');

var app = express();

app.use(expressMongoDb('mongodb://localhost:27017/imagesearch'));

const PORT = process.env.PORT || 8080;

function errorHandle(err) {
  if(err) throw err;
}



app.get('/api/imagesearch/:searchterm', function(req, res) {
  
  var searchterm = req.params.searchterm, 
    offset = (+req.query.offset || 0 );
  
  
  var coll = req.db.collection('images');
  var objToBeInserted = { 
    term: searchterm,
    when: new Date()
    
  };
  
  var googlesearch = {
    host: 'www.googleapis.com',
    port: 443,
    path: '/customsearch/v1?' +
      querystring.stringify({ 
          q : searchterm,
          cx: '014943854741342666222:6i50dny99oy',
          searchType: 'image',
          key: process.env.API_KEY,
          start : (offset * 10 + 1) 
      }),
    method: 'GET'
  };
  
  coll.insert(objToBeInserted, function(err, data) {
      errorHandle(err);
      console.log('db insert done');
      https.get(googlesearch, (resp) => {
          resp.setEncoding('utf8');
          var body = '';
          resp.on('data', (chunk) => {
            body += chunk;
          });
          resp.on('end', () => {
            var items = JSON.parse(body).items;
            
            res.json(items.map(function(i) {
              return {
                url: i.link,
                snippet: i.snippet ,
                thumbnail: i.image.thumbnailLink,
                context: i.image.contextLink
              };
            }));
          });
      }).on("error", function(e){
        console.log("Got error: " + e.message);
      });
  });
});
  


app.get('/api/latest/imagesearch', function(req, res) {
  var coll = req.db.collection('images');
  coll.find().limit(10).toArray(function(err, docs) {
    errorHandle(err);
    console.log(docs);
    res.json(docs);
  });
});

// Connect to Mongo on start


app.listen(PORT, function () {
  console.log('imagesearch app listening on port '+PORT+'!')
});
