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

var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(session({
    secret: process.env.COOKIE_SECRET,
    cookie: {
        maxAge: 10000000
    },
    store: store
}));

db.build().then(function() {
  app.post('/api/event', urlencodedParser, function (req, res, next) {
    if (!req.body) return res.sendStatus(400);
    var newevent = req.body;
    var eventlocation = newevent.location.split(',')
    newevent.location_latitude = eventlocation[0].trim();
    newevent.location_longitude = eventlocation[1].trim();
    newevent.hostid = req.session.userid;
    db.createEvent().then(function() {
      next();
    });
  })
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
    
    app.get('/', function (req, res) {
      db.createEvent({name: 'event-eoid', description: 'yo! an event!'}).then(function() {
        res.send('userid: ' + req.session.userid);
      });
    })
    app.get('/api/event/:id', function (req, res) {
      db.getevent(req.params.id).then(function(event) {
        res.send(JSON.stringify(event));
      });
    })
    app.get('/allevents', function (req, res) {
      db.allEvents().then(function(events) {
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