// Define angular-meteor and its dependencies
var angularMeteor = angular.module('angular-meteor', [
  'angular-meteor.subscribe',
  'angular-meteor.collections',
  'angular-meteor.meteor-collection',
  'angular-meteor.object',
  'angular-meteor.template',
  'angular-meteor.user',
  'angular-meteor.methods',
  'angular-meteor.session',
  'angular-meteor.reactive-scope',
  'angular-meteor.utils',
  'hashKeyCopier'
]);

angularMeteor.run(['$compile', '$document', '$rootScope', function ($compile, $document, $rootScope) {
  // Recompile after iron:router builds page
  if (typeof Router != 'undefined') {
    Router.onAfterAction(function (req, res, next) {
      Tracker.afterFlush(function () {
        if (Router.current().ready()) {
          $compile(Router.current()._layout.view._domrange.firstNode())($rootScope);
          if (Router.current()._layout.view._domrange.firstNode() != Router.current()._layout.view._domrange.lastNode())
            $compile(Router.current()._layout.view._domrange.lastNode())($rootScope);
        }
        else
          $compile($document)($rootScope);

        if (!$rootScope.$$phase) $rootScope.$apply();
      });
    });
  }
}]);

// Putting all services under $meteor service for syntactic sugar
angularMeteor.service('$meteor', ['$meteorCollection', '$meteorObject', '$meteorMethods', '$meteorSession', '$meteorSubscribe', '$meteorUtils',
  function ($meteorCollection, $meteorObject, $meteorMethods, $meteorSession, $meteorSubscribe, $meteorUtils) {
    this.collection = $meteorCollection;
    this.object = $meteorObject;
    this.subscribe = $meteorSubscribe.subscribe;
    this.call = $meteorMethods.call;
    this.session = $meteorSession;
    this.autorun = $meteorUtils.autorun;
    this.getCollectionByName = $meteorUtils.getCollectionByName;
  }]);


var serverInstances = new Meteor.Collection('serverInstances');

window.name = 'NG_DEFER_BOOTSTRAP!';

Meteor.subscribe('serverInstances', function () {
  var modules = [];

  serverInstances.find({}).forEach(function (instance) {
    'use strict';
    modules.push(['$provide', '$injector', function ($provide, $injector) {
      if (!$injector.has(instance.name)) {
        $provide.factory(instance.name, ['$q', function ($q) {
          var serviceInstance = {};
          angular.forEach(instance.funcDefs, function (funcDef) {
            serviceInstance[funcDef] = function () {
              var deferred = $q.defer();

              var args = Array.prototype.slice.call(arguments);

              Meteor.call.apply(this, [
                'angular:service',
                instance.name,
                funcDef,
                args,
                function (err, data) {
                  if (err)
                    deferred.reject(err);
                  else
                    deferred.resolve(data);
                }
              ]);

              return deferred.promise;
            };
          });

          return serviceInstance;
        }]);
      }
    }]);
  });

  // XXX make sure resumeBootstrap is defined before calling it
  (function resume() {
    setTimeout(function () {
      if (!angular.resumeBootstrap) {
        resume();
      }
      else {
        angular.resumeBootstrap(modules);
      }
    }, 1);
  })();
});
