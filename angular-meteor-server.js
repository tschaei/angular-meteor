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
        console.log('updating', instanceId, instance);
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
          console.log('changed', id, fields);
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
  .run(function($rootScope, ServerAPI) {
    //var origRun = Meteor._SynchronousQueue.prototype._run;
    //
    //console.log('replacing run');
    //Meteor._SynchronousQueue.prototype._run = function() {
    //  console.log('running from queue');
    //  var result = origRun.apply(this, arguments);
    //  $rootScope.$apply();
    //  return result;
    //};
    var Fibers = Npm.require('fibers');
    var origRun = Fibers.prototype.run;

    Fibers.prototype.run = function() {
        var result = origRun.apply(this, arguments);
        if (!$rootScope.$$phase) {
          var startTime = new Date();
          $rootScope.$apply();
          console.log ('digest time:', new Date() - startTime);
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


