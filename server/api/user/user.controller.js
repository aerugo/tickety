'use strict'

var _ = require('lodash');
var Promise = require('bluebird');
var chalk = require('chalk');

var auth = require('../../services/auth');
var User = require('./user.db');

/**
 * ROUTE: GET 'api/users/:id'
 */
exports.show = function (req, res) {
  User.findById(req.body.id)
  .then(function (user) {
    res.status(200).json(user);
  })
  .reject(function (err) {
    handleError(res, err);
  })
};

/**
 * Returns the user, or create and returns them.
 * 
 * ROUTE: POST '/api/users/'
 */
exports.login = function (req, res) {
  // No user, so we can't login.
  if (!req.body) { return handleError(res, new Error('No user provided')); }
  
  User.findByEmail(req.body.email)
  .then(function (user) {
    if (user) {
      
      req.user = user;
      // Attach the token.
      auth.setTokenCookie(req, res);
      
      return res.status(200).json(user);
    } else {
      // No user, let's create it
      User.create(req.body)
      .then(function (user) {
        
        req.user = user;
        // Attach the token.
        auth.setTokenCookie(req, res);
        
        return res.status(200).json(user);
      })
      .catch(function (err) {
        handleError(res, err);
      });
    }
  });
};

/**
 * Returns a response of 200 with the user attached as body.
 * 
 * ROUTE: GET '/api/users/me'
 */
exports.me = function (req, res) {
  User.findById(req.user.userId)
  .then(function (user) {
    res.status(200).json(user);
  })
  .catch(function (err) {
    handleError(res, err);
  });
};

function handleError(res, err) {
  console.log(chalk.red(err));
  res.status(500).send('Internal Error');
};