var pg = require('pg');

var knex = require('knex')({
  client: 'pg',
  connection: {
    host: process.env.PGHOST,
    database : process.env.PGDATABASE,
    user : process.env.PGUSER,
    password : process.env.PGPASSWORD
  }
});

exports.knex = knex;

exports.getEvent = function(eid) {
  return knex('event').where({id: eid}).select('*')
}

exports.getComment = function(eid) {
  return knex('event_comment').where({eventid: eid}).select('*')
}

exports.postComment = function(ncomment) {
  return knex.insert({
    eventid: ncomment.eventid,
    userid: ncomment.userid,
    content: ncomment.content,
    parent_comment: ncomment.parent_comment
  }).into('event_comment').returning('id');
}

exports.allEvents = function() {
  return knex('event').select('*').orderBy('when','asc')
}
exports.allProfiles = function() {
  return knex('users').select('*')
}

exports.createEvent = function(nevent) {
  return knex.insert({
    name: nevent.EventName,
    description: nevent.EventDescription,
    location_latitude: nevent.location_latitude,
    location_longitude: nevent.location_longitude,
    when: nevent.date
  }).into('event').returning('id');
}

exports.newUser = function() {
  return knex.insert({username: '', password: '', profpic: ''},'id').into('users');
}

exports.editUser = function(id,user) {
  return knex('users')
    .update({
      username:user.username,
      password:user.password,
      bio:user.bio,
      profpic:user.profpic
    })
    .where('id','=',id);

}

exports.getUser = function(id) {
  return knex('users').where({id: id}).select('*')
}

exports.joinEvent = function(eventid, userid) {
  return knex.insert({eventid: eventid, userid: userid}).into('event_members');
}

exports.build = function() {
  return Promise.all([
    knex.schema.createTableIfNotExists('users', function(table) {
      table.increments('id').primary();
      table.string('username');
      table.string('password');
      table.string('profpic');
      table.string('bio', 1024);
    }),
    knex.schema.createTableIfNotExists('event', function(table) {
      table.increments('id').primary();
      table.string('name');
      table.string('description');
      table.integer('hostid')
      table.double('location_latitude');
      table.double('location_longitude');
      table.dateTime('when');
    }),
    knex.schema.createTableIfNotExists('event_members', function(table) {
      table.increments('id').primary();
      table.integer('eventid');
      table.integer('userider');
    }),
    knex.schema.createTableIfNotExists('event_comment', function(table) {
      table.increments('id').primary();
      table.integer('eventid');
      table.integer('userid');
      table.string('content');
      table.integer('parent_comment');
    })
  ]);
};
