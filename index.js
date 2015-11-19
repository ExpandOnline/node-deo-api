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

    createUrl: createUrl,

    authenticate: function(session){
      return Future(function(rej, res){
        var url = createUrl('deo_sessions/verify_session_id/security_suite', session);
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

    messageFeed: function(user){
      return request(createUrl('webmaster_tools_feeds/messages/security_suite', user));
    }

  };

};
