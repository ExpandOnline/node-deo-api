'use strict';

var md5 = require('crypto-md5');
var Future = require('ramda-fantasy').Future;
var request = require('request');
var date = require('date-fp');

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
    authenticate: function(){
      return Future(function(rej, res){
        res(md5(key + date.format('YYYY-MM-DD', new Date), 'hex'));
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
        var today = new Date;
        var yesterday = date.add('days', -1, today);
        res(0
          || md5(key + date.format('YYYY-MM-DD', today), 'hex') === token
          || md5(key + date.format('YYYY-MM-DD', yesterday), 'hex') === token
        );
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
