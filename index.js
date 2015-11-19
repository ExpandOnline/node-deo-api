'use strict';

var md5 = require('crypto-md5');
var Future = require('ramda-fantasy').Future;
var request = require('request');

module.exports = function(options){

  var url = options.url || 'https://deo.expandonline.nl';
  var key = String(options.key);

  var createUrl = function(path, thing){
    return url + '/' + path + '/' + md5(key + thing, 'hex') + '/' + thing;
  };

  return {

    /**
     * Creates a URL to the API.
     *
     * @param {String} path The path to the resource.
     * @param {String} thing The thing to request.
     *
     * @return {String} The full URL.
     */
    createUrl: createUrl,

    /**
     * Get an authorization token from the server.
     *
     * @param {String} username The username to log in with.
     * @param {String} password The password to log in with.
     *
     * @return {Future} A Future of an Error or the token.
     */
    authenticate: function(username, password){
      return Future(function(rej, res){
        request(
          {
            method: 'POST',
            url: url + '/login',
            form: {
              _method: 'POST',
              User: {
                username: username,
                password: password
              }
            }
          },
          function(err, response){
            try{

              if(err){
                return rej(err);
              }

              if(response.statusCode >= 400){
                return rej(new Error('Authentication server responded ' + response.statusCode));
              }

              if(response.statusCode === 200){
                return rej(new Error('Invalid username or password'));
              }

              var cookies = response.headers['set-cookie'];

              if(!(cookies && cookies.length > 0)){
                return rej(new Error('Failed to authenticate'));
              }

              var cookie = cookies.filter(function(t){
                return (/DEO=/).test(t)
              })[0];

              if(!cookie){
                return rej(new Error('Failed to authenticate'));
              }

              rej(cookie.split(';')[0].split('=')[1]);

            }
            catch(err){
              rej(err);
            }
          }
        )
      });
    },

    /**
     * Validate an authorization token with the server.
     *
     * @param {String} token The authorization token.
     *
     * @return {Future} A Future of an Error or a Boolean.
     */
    authorize: function(token){
      return Future(function(rej, res){
        var url = createUrl('deo_sessions/verify_session_id/security_suite', token);
        request(url, function(err, response){
          try{
            err
            ? rej(err)
            : response.statusCode >= 400
            ? rej(new Error('Authentication server responded ' + response.statusCode))
            : res(JSON.parse(response.body).authenticated === true);
          }
          catch(err){
            rej(err);
          }
        });
      });
    },

    /**
     * Get the message feed stream.
     *
     * @param {String} user The OAuth user ID.
     *
     * @return {Stream}
     */
    messageFeed: function(user){
      return request(createUrl('webmaster_tools_feeds/messages/security_suite', user));
    }

  };

};
