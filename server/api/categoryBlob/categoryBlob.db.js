'use strict'

var _ = require('lodash');
var Promise = require('bluebird');
var sql = require('seriate');

function initialize() {
  return sql.execute({
    query: sql.fromFile('./sql/categoryBlob.initialize.sql')
  });
}

initialize();

module.exports = {}