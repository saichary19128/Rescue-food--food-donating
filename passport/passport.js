var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var User = require('../models/user.js');
var session = require('express-session');
var jwt = require('jsonwebtoken');
var secret = 'Pankaj';

module.exports = function (app, passport) {
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: true, cookie: { secure: false } }));

    passport.serializeUser(function (user, done) {
        token = jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '24h' });
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    passport.use(new FacebookStrategy({
        clientID: 'your id',
        clientSecret: 'your secret',
        callbackURL: "your url",
        profileFields: ['id', 'displayName', 'photos', 'email']
    }, function (accessToken, refreshToken, profile, done) {
        console.log(profile);
        User.findOne({ email: profile.emails[0].value }).select('username password email').exec(function (err, user) {
            if (err) { done(err); }

            if (user && user != null) {
                done(null, user);
            } else {
                done(err);
            }
        });
    }));

    passport.use(new GoogleStrategy({
        clientID: 'your id',
        clientSecret: 'your secret',
        callbackURL: "your url",
        userProfileURL: 'your profile info' // Added to specify the user profile URL
    }, function (accessToken, refreshToken, profile, done) {
        console.log(profile.emails[0].value);
        User.findOne({ email: profile.emails[0].value }).select('profile.name.givenName password email').exec(function (err, user) {
            if (err) { done(err); }

            if (user && user != null) {
                done(null, user);
            } else {
                done(err);
            }
        });
    }));

    app.get('/_oauth/facebook', passport.authenticate('facebook', { failureRedirect: '/login' }), function (req, res) {
        res.redirect('/facebook/' + token);
    });

    app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));

    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] })); // Removed 'https://www.googleapis.com/auth/plus.login'

    app.get('/oauth2callback', passport.authenticate('google', { failureRedirect: '/login' }), function (req, res) {
        res.redirect('/google/' + token);
    });

    return passport;
};
