const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const mongoose = require('mongoose');

const secrets = require('./secrets');

const secret = secrets.jwt.secret;

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    },
    (payload, done) => {
      mongoose
        .model('User')
        .findById(payload.id)
        .then((user) => {
          if (!user) {
            return done(null, false);
          }
          return done(null, user);
        })
        .catch((err) => {
          return done(err, false);
        });
    }
  )
);

module.exports = async (app) => {
  app.use(passport.initialize());
};
