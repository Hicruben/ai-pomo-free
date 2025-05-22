const passport = require('passport');

// Middleware to authenticate JWT token
exports.authenticateJWT = passport.authenticate('jwt', { session: false });
