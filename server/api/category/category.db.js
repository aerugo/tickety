'use strict'

var _ = require('lodash');
var Promise = require('bluebird');
var sql = require('seriate');

function initialize() {
  return sql.execute({
    query: sql.fromFile('./sql/category.initialize.sql')
  });
}

function popInitialize() {
  return sql.execute({
    query: sql.fromFile('./sql/pop.category.initialize.sql')
  });
}

exports.getAll = function () {
  return sql.execute({
    query: sql.fromFile('./sql/category.getAll.sql')
  });
};

// initialize();
popInitialize();
