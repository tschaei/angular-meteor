/**
 * Created by netanel on 27/02/15.
 */
var serverInstances = new Meteor.Collection(null);

angular.module('angular-meteor', ['angular-meteor.meteor-collection'])
  .run(['ServerAPI', '$injector', '$rootScope', function(ServerAPI, $injector, $rootScope) {
    angular.forEach(ServerAPI.getServerAPIS(), function(api) {
      var instance = $injector.get(api);
      var funcDefs = [];
      for (var key in instance) {
        if (angular.isFunction(instance[key])) {
          funcDefs.push(key);
        }
      }
      var instanceId = serverInstances.insert({ name : api, funcDefs : funcDefs, properties : [] });

      $rootScope.$watch(function() {
        return instance;
      }, function() {
        serverInstances.update({ _id : instanceId }, { $set : { properties : instance } });
      }, true);

    });
  }])
  .run(function() {
    Meteor.publish('serverInstances', function() {
      var self = this;
      var handle = serverInstances.find({}).observeChanges({
        addedBefore: function (id, fields) {
          self.added('serverInstances', id, fields);
        },
        changed: function (id, fields) {
          self.changed('serverInstances', id, fields);
        },
        removed: function (id) {
          self.removed('serverInstances', id);
        }
      });

      self.ready();

      self.onStop(function() {
        handle.stop();
      })
    });
  })
  .run(function($rootScope) {
    var Fibers = Npm.require('fibers');
    var origRun = Fibers.prototype.run;

    Fibers.prototype.run = function() {
        var result = origRun.apply(this, arguments);
        if (!$rootScope.$$phase) {
          $rootScope.$apply();
        }
        return result;
    };
  });

var origBootstrap = angular.bootstrap;
angular.bootstrap = function(modules, config) {
  Meteor.startup(function() {
    origBootstrap(document, modules, config);
  });
};


