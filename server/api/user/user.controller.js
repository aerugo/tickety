'use strict'

var _ = require('lodash');
var Promise = require('bluebird');
var chalk = require('chalk');
var moment = require('moment');

var auth = require('../../services/auth');
var User = require('./user.db');
var utils = require('../../utils/utils');

/**
 * ROUTE: GET 'api/users/:id'
 */
exports.show = function (req, res) {
  User.findById(req.body.id)
  .then(function (user) {
    res.status(200).json(user);
  })
  .reject(function (err) {
    utils.handleError(res, err);
  })
};

/**
 * Returns the user, or create and returns them.
 *
 * ROUTE: POST '/api/users/'
 */
exports.login = function (req, res) {
  // No user, so we can't login.
  if (!req.body) { return utils.handleError(res, new Error('No user provided')); }

  //Authenticate user with submitted email and password
  User.auth(req.body.email, req.body.password)
  .then(function (user) {

    if (user && req.body.passwordRepeat) {
      return res.status(401).send('User already exists.');
    }

    if (user) {

      req.user = user;
      // Attach the token.
      auth.setTokenCookie(req, res);

      User.updateLastLoggedIn(user)
      .then(function (user) {
        return res.status(200).json(user);
      })
      .catch(function (err) {
        utils.log(err);
        utils.handleError(res, new Error('Something went wrong when logging in.'))
      })
    } else {
      if (!req.body.passwordRepeat) {
        return res.status(404).send('User doesn\'t exist.');
      }
      // No user, let's create it
      User.create(req.body)
      .then(function (user) {

        req.user = user;
        // Attach the token.
        auth.setTokenCookie(req, res);

        User.updateLastLoggedIn(user)
        .then(function (user) {
          user.isNew = true;
          return res.status(200).json(user);
        })
        .catch(function (err) {
          utils.log(err);
          utils.handleError(res, new Error('Something went wrong when logging in.'))
        });
      })
      .catch(function (err) {
        utils.handleError(res, err);
      });
    }
  })
  .catch(function (err) {
    if (/incorrect password|email is required|password is required/i.test(err.message)) {
      res.status(400).send(err.message);
    } else {
      utils.handleError(res, err);
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

    // either if there is no last logged in or it wasn't *today*, set last logged in to now
    if (!user.lastLoggedIn || moment().diff(user.lastLoggedIn, 'days') > 0) {
      User.updateLastLoggedIn(user)
      .then(function (user) {
        res.status(200).json(user);
      })
      .catch(function (err) {
        utils.handleError(res, err);
      });
    } else {
      res.status(200).json(user);
    }
  })
  .catch(function (err) {
    utils.handleError(res, err);
  });
};


/**
 * Updates the user
 *
 * ROUTE: PUT '/api/users/:id'
 */
exports.update = function (req, res) {
  User.update(req.body, req.params.id)
  .then(function (user) {
    if (user.error) {
      return res.status(400).send(user.error);
    } else {
      res.status(200).json(user);
    }
  })
  .catch(function (err) {
    utils.handleError(res, err);
  })
}

/**
 * Sets the user password if the old match and there is a new one.
 *
 */
exports.setPassword = function (req, res) {

  if (!req.body.new) {
    // Return early if no new password is provided
    return res.status(400).send('New password is required.');
  } else if (!req.body.current) {
    // Return early if the current password is not provided
    return res.status(400).send('Current password is required.');
  }

  // Set the password
  User.setPassword(req.params.id, req.body.current, req.body.new)
  .then(function (_user) {
    res.status(204).send('Password changed');
  })
  .catch(function (err) {

    if (/password/gi.test(err.message)) {
      res.status(403).send(err.message);
    } else {
      utils.handleError(res, err);
    }

  });
}

/**
 * Gets all users
 *
 * ROUTE: GET '/api/users/'
 */
exports.get = function (req, res) {

  User.getAll()
  .then(function (users) {
    res.status(200).json(users);
  })
  .catch(function (err) {
    utils.handleError(res, err);
  })

}

/**
 * Gets all users matching *fuzz*.
 *
 * ROUTE: GET '/api/users/fuzzy
 */
exports.getFuzzy = function (req, res) {
  User.getFuzzy(req.query.fuzz)
  .then(function (users) {
    res.status(200).json(users);
  })
  .catch(function (err) {
    utils.handleError(res, err);
  });
}

/**
 * ROUTE: GET '/api/users/as-other/:id'
 */
exports.signInAs = function (req, res) {
  var _currentUser = req.user;
  var _otherUserId = req.params.id;

  if (!(_currentUser.role >= 100) || !_otherUserId) {
    return res.status(200).json(_currentUser);
  }

  User.findById(_otherUserId)
  .then(function (_otherUser) {

    req.user = _otherUser;

    auth.setTokenCookie(req, res, _currentUser);

    res.status(200).json(_.omit(_otherUser, ['password']));
  })
  .catch(function (err) {
    utils.handleError(res, err);
  });
}

/**
 * ROUTE: GET '/api/users/as-actual'
 */
exports.signInAsActual = function (req, res) {
  var _decoded = auth.decodeToken(req);

  // Don't do anything if there's no decoded value or there's no _actualUserId_
  if (!(_decoded && _decoded.actualUserId)) {
    return res.status(200).json(_.omit(req.user, ['password']));
  }

  var actualUserId = _decoded.actualUserId;

  User.findById(actualUserId)
  .then(function (user) {

    req.user = user;

    auth.setTokenCookie(req, res);

    res.status(200).json(_.omit(user, ['password']));
  })
  .catch(function (err) {
    utils.handleError(res, err);
  });
}
