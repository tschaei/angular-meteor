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

        // XXX - think if better to apply with meteor's this or the service
        if (Meteor.isClient && angular.isDefined(service.$$originalInstance)) {
          return service.$$originalInstance[prop].apply(this, args);
        }
        else {
          return service[prop].apply(this, args);
        }
      }
    });
  }]);
