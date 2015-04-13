/**
 * Created by netanel on 13/04/15.
 */
angular.module('angular-meteor')
  .provider('ServerAPI', function() {
    var serverAPIs = [];
    return {
      register : function(apis) {
        serverAPIs = serverAPIs.concat(apis);
      },
      $get : function() {
        return {
          getServerAPIS : function() {
            return serverAPIs;
          }
        };
      }
    }
  })
  .run(['$injector', function($injector) {
    Meteor.methods({
      'angular:service' : function(name, prop, args) {
        var service = $injector.get(name);
        return service[prop].apply(service, args);
      }
    });
  }]);
