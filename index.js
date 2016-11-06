var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var session = require('express-session');
var KnexSessionStore = require('connect-session-knex')(session);
var db = require('./db');

const store = new KnexSessionStore({
    knex: db.knex,
    tablename: 'sessions' // optional. Defaults to 'sessions'
});

var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(session({
    secret: process.env.COOKIE_SECRET,
    cookie: {
        maxAge: 10000000
    },
    store: store
}));

db.build().then(function() {
    app.use(function(req, res, next) {
    var idPromise;
    if(typeof req.session.userid == 'undefined') {
      idPromise = db.newUser().then(function(id) {
        return req.session.userid = id[0];
      })
    } else {
      idPromise = Promise.resolve(req.session.userid);
    }
      idPromise.then(function() {
        var n = req.session.views || 0
        req.session.views = ++n;
        next();
        });
    });
  
  app.post('/api/event', urlencodedParser, function (req, res) {
    if (!req.body) return res.sendStatus(400);
    var newevent = req.body;
    var eventlocation = newevent.EventLocation.split(',')
    newevent.location_latitude = eventlocation[0].trim();
    newevent.location_longitude = eventlocation[1].trim();
    newevent.hostid = req.session.userid;
    db.createEvent(newevent).then(function() {

    });
  })
  app.post('/api/:id/join', urlencodedParser, function (req, res) {
    if (!req.body) return res.sendStatus(400);
    db.joinEvent(req.params.id, req.session.userid).then(function() {
      
    });
  });
  
  app.post('/api/profile', urlencodedParser, function (req, res) {
    if (!req.body) return res.sendStatus(400);
    db.editUser(req.session.userid,req.body).then(function() {
      res.end('we gucci fam');
    }).catch(function(err){
      res.end(err.message);
    });
  });
  
  app.post('/api/:id/comment', urlencodedParser, function (req, res) { postComment(req); });
  app.post('/api/:id/comment/:parent', urlencodedParser, function (req, res) { postComment(req); });
  
  postComment = function(req) {
    if (!req.body) return res.sendStatus(400);
    var newcomment = req.body;
    newcomment.userid = req.session.userid;
    db.postComment(newcomment).then(function() {
      
    })
  }
    
    app.get('/', function (req, res) {
      res.send('userid: ' + req.session.userid);
    })
    app.get('/api/event/:id', function (req, res) {
      db.getEvent(req.params.id).then(function(event) {
        res.send(JSON.stringify(event));
      });
    })
    app.get('/api/event/:id/comment/:cid', function (req, res) {
      db.getComment(req.params.id, req.params.cid).then(function(comment) {
        res.send(JSON.stringify(comment));
      });
    })
    app.get('/allevents', function (req, res) {
      db.allEvents().then(function(events) {
         res.send(JSON.stringify(events));
      });
    });
    app.get('/allprofiles', function (req, res) {
      db.allProfiles().then(function(events) {
         res.send(JSON.stringify(events));
      });
    });
  }).catch(function(err) {
    app.get('/', function (req, res) {
      res.send(err.message + err.stack)
    })
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});
