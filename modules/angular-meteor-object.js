var angularMeteorObject = angular.module('angular-meteor.object', ['angular-meteor.meteor-collection', 'angular-meteor.utils', 'angular-meteor.subscribe']);

angularMeteorObject.factory('AngularMeteorObject', ['$q', '$meteorSubscribe', '$meteorCollection', function($q, $meteorSubscribe, $meteorCollection) {
  var AngularMeteorObject = {};

  AngularMeteorObject.getRawObject = function () {
    var self = this;

    return angular.copy(_.omit(self, self.$$internalProps));
  };

  AngularMeteorObject.subscribe = function () {
    $meteorSubscribe.subscribe.apply(this, arguments);
    return this;
  };

  AngularMeteorObject.save = function save(docs) {

    console.log('this',this);

    if (this){
      if (this._id){
        this.$$originalCollection.save(this._id);
      }
    }

    /*
    var self = this,
      collection = self.$$collection;

    var deferred = $q.defer();

    if (self)
      if (self._id){
        var updates = docs? docs : angular.copy(_.omit(self, '_id', self.$$internalProps));
        collection.update(
          {_id: self._id},
          { $set: updates },
          function(error, numberOfDocs){
            if (error) {
              deferred.reject(error);
            } else {
              deferred.resolve(numberOfDocs);
            }
          }
        );
      }

    return deferred.promise;
    */
  };

  AngularMeteorObject.reset = function reset() {
    var self = this,
      collection = self.$$collection,
      options = self.$$options,
      id = self.$$id;

    if (collection){
      var serverValue = collection.findOne(id, options);
      var prop;
      if (serverValue) {
        angular.extend(Object.getPrototypeOf(self), Object.getPrototypeOf(serverValue));
        for (prop in serverValue) {
          if (serverValue.hasOwnProperty(prop)) {
            self[prop] = serverValue[prop];
          }
        }
      } else {
        for (prop in _.omit(self, self.$$internalProps)) {
          delete self[prop];
        }
      }
    }
  };

  AngularMeteorObject.stop = function stop() {
    if (this.unregisterAutoDestroy) {
      this.unregisterAutoDestroy();
    }
    this.unregisterAutoDestroy = null;

    if (this.unregisterAutoBind) {
      this.unregisterAutoBind();
    }
    this.unregisterAutoBind = null;

    if (this.autorunComputation && this.autorunComputation.stop) {
      this.autorunComputation.stop();
    }
    this.autorunComputation = null;
  };

// A list of internals properties to not watch for, nor pass to the Document on update and etc.
  AngularMeteorObject.$$internalProps = [
    'save', 'reset', '$$collection', '$$options', '$$id', '$$hashkey', '$$internalProps', 'subscribe', 'stop', 'autorunComputation', 'unregisterAutoBind', 'unregisterAutoDestroy', 'getRawObject',
    'collection', '_eventEmitter'
  ];

  var createAngularMeteorObject = function(collection, id, options, auto){
    // Make data not be an object so we can extend it to preserve
    // Collection Helpers and the like
    var data = new function SubObject() {};

    /*
    data.$$collection = collection;
    data.$$options = options;
    data.$$id = id;
    */

    var selector = id;
    if (!angular.isObject(id))
      selector = {_id : id};

    options = options || {};
    options.limit = 1;

    var collectionData = $meteorCollection(function(){
      return collection.find(selector, options)
    }, auto);

    data.$$originalCollection = collectionData;
    //console.log('data', data);
    //console.log('collection data before', collectionData[0]);
    //console.log('AngularMeteorObject', AngularMeteorObject);
    angular.extend(collectionData[0], data);
    //console.log('collection data after one', collectionData[0]);
    angular.extend(collectionData[0], AngularMeteorObject);

    console.log('the end object', collectionData[0]);

    return collectionData[0];
  };

  return createAngularMeteorObject;
}]);


angularMeteorObject.factory('$meteorObject', ['$rootScope', '$meteorUtils', 'AngularMeteorObject',
  function($rootScope, $meteorUtils, AngularMeteorObject) {
    return function(collection, id, auto, options) {

      // Validate parameters
      if (!collection) {
        throw new TypeError("The first argument of $meteorObject is undefined.");
      }
      if (!angular.isFunction(collection.findOne)) {
        throw new TypeError("The first argument of $meteorObject must be a function or a have a findOne function property.");
      }

      auto = auto !== false; // Making auto default true - http://stackoverflow.com/a/15464208/1426570

      var data = new AngularMeteorObject(collection, id, options, auto);

      return data;
    };
  }]);

angularMeteorObject.run(['$rootScope', '$q', '$meteorObject', '$meteorSubscribe',
  function($rootScope, $q, $meteorObject, $meteorSubscribe) {
    Object.getPrototypeOf($rootScope).$meteorObject = function() {
      var args = Array.prototype.slice.call(arguments);
      var object = $meteorObject.apply(this, args);
      var subscription = null;

      object.subscribe = function () {
        var args = Array.prototype.slice.call(arguments);
        subscription = $meteorSubscribe._subscribe(this, $q.defer(), args);
        return object;
      };

      this.$on('$destroy', function() {
        object.stop();
        if (subscription)
          subscription.stop();
	  });

      return object;
	};
  }]);
