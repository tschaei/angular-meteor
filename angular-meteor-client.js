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
  'angular-meteor.camera',
  'hashKeyCopier'
]);

angularMeteor.run(['$compile', '$document', '$rootScope', function ($compile, $document, $rootScope) {
  // Recompile after iron:router builds page
  if(typeof Router != 'undefined') {
    var appLoaded = false;
    Router.onAfterAction(function(req, res, next) {
      Tracker.afterFlush(function() {
        if (!appLoaded) {
          $compile($document)($rootScope);
          if (!$rootScope.$$phase) $rootScope.$apply();
          appLoaded = true;
        }
      })
    });
  }
}]);

// Putting all services under $meteor service for syntactic sugar
angularMeteor.service('$meteor', ['$meteorCollection', '$meteorObject', '$meteorMethods', '$meteorSession', '$meteorSubscribe', '$meteorUtils', '$meteorCamera', '$meteorUser',
  function($meteorCollection, $meteorObject, $meteorMethods, $meteorSession, $meteorSubscribe, $meteorUtils, $meteorCamera, $meteorUser){
    this.collection = $meteorCollection;
    this.object = $meteorObject;
    this.subscribe = $meteorSubscribe.subscribe;
    this.call = $meteorMethods.call;
    this.loginWithPassword = $meteorUser.loginWithPassword;
    this.requireUser = $meteorUser.requireUser;
    this.requireValidUser = $meteorUser.requireValidUser;
    this.waitForUser = $meteorUser.waitForUser;
    this.createUser = $meteorUser.createUser;
    this.changePassword = $meteorUser.changePassword;
    this.forgotPassword = $meteorUser.forgotPassword;
    this.resetPassword = $meteorUser.resetPassword;
    this.verifyEmail = $meteorUser.verifyEmail;
    this.loginWithMeteorDeveloperAccount = $meteorUser.loginWithMeteorDeveloperAccount;
    this.loginWithFacebook = $meteorUser.loginWithFacebook;
    this.loginWithGithub = $meteorUser.loginWithGithub;
    this.loginWithGoogle = $meteorUser.loginWithGoogle;
    this.loginWithMeetup = $meteorUser.loginWithMeetup;
    this.loginWithTwitter = $meteorUser.loginWithTwitter;
    this.loginWithWeibo = $meteorUser.loginWithWeibo;
    this.logout = $meteorUser.logout;
    this.logoutOtherClients = $meteorUser.logoutOtherClients;
    this.session = $meteorSession;
    this.autorun = $meteorUtils.autorun;
    this.getCollectionByName = $meteorUtils.getCollectionByName;
    this.getPicture = $meteorCamera.getPicture;
  }]);


var serverInstances = new Meteor.Collection('serverInstances');

window.name = 'NG_DEFER_BOOTSTRAP!';

Meteor.subscribe('serverInstances', function () {
  var modules = [];

  serverInstances.find({}).forEach(function (instance) {
    'use strict';
    modules.push(['$provide', '$injector', function ($provide, $injector) {
      if ($injector.has(instance.name)) {
        $provide.decorator(instance.name, ['$delegate', '$q', function($delegate, $q) {
          var serviceInstance = {};
          angular.forEach(instance.funcDefs, function (funcDef) {
            serviceInstance[funcDef] = function () {
              var args = Array.prototype.slice.call(arguments);

              var deferred = $q.defer();

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

          serviceInstance.$$originalInstance = $delegate;

          return serviceInstance;
        }]);
      }
      else {
        $provide.factory(instance.name, ['$q', '$rootScope', function ($q, $rootScope) {
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

          angular.extend(serviceInstance, instance.properties);

          serverInstances.find({}).observe({
            changed : function (newDpc) {
              angular.extend(serviceInstance, newDpc.properties);
              if (!$rootScope.$$phase) {
                $rootScope.$apply();
              }
            }
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
