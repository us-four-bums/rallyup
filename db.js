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

exports.getevent = function(eid) {
  return knex('event').where({id: eid}).select('*')
}

exports.allEvents = function() {
  return knex('event').select('*')
}

exports.createEvent = function(nevent) {
  return knex.insert({
    name: nevent.name,
    description: nevent.description,
    location_latitude: nevent.location_latitude,
    location_longitude: nevent.location_longitude,
    when: nevent.when
  }).into('event');
}

exports.newUser = function() {
  return knex.insert({username: '', password: '', profpic: ''},'id').into('users');
}

exports.build = function() {
       return Promise.all([
          knex.schema.createTableIfNotExists('users', function(table) {
              table.increments('id').primary();
              table.string('username');
              table.string('password');
              table.string('profpic');
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
              table.integer('parent_event');
          })
        ]);
};