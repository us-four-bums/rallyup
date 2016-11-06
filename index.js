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
app.use(express.static(".")); //TODO: folks, get your HTML out of the root...
db.build().then(function() {
  app.get('/api/event',function(req, res){
    db.allEvents().then(function(data){
      res.send(data);
    });
  });
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
    db.createEvent(newevent).then(function(ids) {
      res.json(ids);
    });
  })
  app.post('/api/:id/join', urlencodedParser, function (req, res) {
    if (!req.body) return res.sendStatus(400);
    db.joinEvent(req.params.id, req.session.userid).then(function() {
      res.sendStatus(200);
    });
  });

  app.post('/api/profile', urlencodedParser, function (req, res) {
    if (!req.body) return res.sendStatus(400);
    db.editUser(req.session.userid,req.body).then(function() {
      res.sendStatus(200);
    }).catch(function(err){
      res.end(err.message + "\n" + JSON.stringify(req.body));
    });
  });

  app.post('/api/event/:id/comment', urlencodedParser, function (req, res) { postComment(req, res); });
  app.post('/api/event/:id/comment/:parent', urlencodedParser, function (req, res) { postComment(req, res); });

  postComment = function(req, res) {
    if (!req.body) return res.sendStatus(400);
    var newcomment = req.body;
    newcomment.userid = req.session.userid;
    newcomment.eventid = req.params.id;
    db.postComment(newcomment).then(function(ids) {
      res.json(ids);
    })
  }

  app.get('/', function (req, res) {
    res.send('userid: ' + req.session.userid);
  })
  app.get('/api/event/:id', function (req, res) {
    db.getEvent(req.params.id).then(function(event) {
      res.json(event);
    });
  })
  app.get('/api/user/', function (req, res) {
    db.getUser(req.session.userid).then(function(user) {
      res.json(user);
    });
  });
  app.get('/api/user/:id', function (req, res) {
    db.getUser(req.params.id).then(function(user) {
      res.json(user);
    });
  });
  app.get('/api/event/:id/comments', function (req, res) {
    db.getComment(req.params.id).then(function(comments) {
      res.json(comments);
    });
  })
  app.get('/allevents', function (req, res) {
    db.allEvents().then(function(events) {
      res.json(events);
    });
  });
  app.get('/allprofiles', function (req, res) {
    db.allProfiles().then(function(profiles) {
      res.json(profiles);
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
