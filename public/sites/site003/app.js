(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var App, Backbone, Router, app, router;

Backbone = require('bamjs/backbone');

Backbone.$ = $;

App = require('./app');

Router = require('./router');

window.webapp = app = new App({
  el: document.body
});

router = new Router(app);

app.router = router;

Backbone.history.start({
  pushState: false
});



},{"./app":13,"./router":14,"bamjs/backbone":2}],2:[function(require,module,exports){
module.exports = require('backbone') || window.Backbone
},{"backbone":3}],3:[function(require,module,exports){
//     Backbone.js 1.1.2

//     (c) 2010-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(root, factory) {

  // Set up Backbone appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'jquery', 'exports'], function(_, $, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Backbone.
      root.Backbone = factory(root, exports, _, $);
    });

  // Next for Node.js or CommonJS. jQuery may not be needed as a module.
  } else if (typeof exports !== 'undefined') {
    var _ = require('underscore');
    factory(root, exports, _);

  // Finally, as a browser global.
  } else {
    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  }

}(this, function(root, Backbone, _, $) {

  // Initial Setup
  // -------------

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create local references to array methods we'll want to use later.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '1.1.2';

  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  // the `$` variable.
  Backbone.$ = $;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = void 0;
        return this;
      }
      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeningTo = this._listeningTo;
      if (!listeningTo) return this;
      var remove = !name && !callback;
      if (!callback && typeof name === 'object') callback = this;
      if (obj) (listeningTo = {})[obj._listenId] = obj;
      for (var id in listeningTo) {
        obj = listeningTo[id];
        obj.off(name, callback, this);
        if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeningTo = this._listeningTo || (this._listeningTo = {});
      var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
      listeningTo[id] = obj;
      if (!callback && typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var attrs = attributes || {};
    options || (options = {});
    this.cid = _.uniqueId('c');
    this.attributes = {};
    if (options.collection) this.collection = options.collection;
    if (options.parse) attrs = this.parse(attrs, options) || {};
    attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = options;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          options = this._pending;
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, method, xhr, attributes = this.attributes;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options = _.extend({validate: true}, options);

      // If we're not waiting and attributes exist, save acts as
      // `set(attr).save(null, opts)` with validation. Otherwise, check if
      // the model will be valid when the attributes, if any, are set.
      if (attrs && !options.wait) {
        if (!this.set(attrs, options)) return false;
      } else {
        if (!this._validate(attrs, options)) return false;
      }

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);

      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch') options.attrs = attrs;
      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var destroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(resp) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
        if (!model.isNew()) model.trigger('sync', model, resp, options);
      };

      if (this.isNew()) {
        options.success();
        return false;
      }
      wrapError(this, options);

      var xhr = this.sync('delete', this, options);
      if (!options.wait) destroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base =
        _.result(this, 'urlRoot') ||
        _.result(this.collection, 'url') ||
        urlError();
      if (this.isNew()) return base;
      return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return !this.has(this.idAttribute);
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, _.extend(options || {}, { validate: true }));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
      return false;
    }

  });

  // Underscore methods that we want to implement on the Model.
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function(method) {
    Model.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });

  // Backbone.Collection
  // -------------------

  // If models tend to represent a single row of data, a Backbone Collection is
  // more analagous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // Default options for `Collection#set`.
  var setOptions = {add: true, remove: true, merge: true};
  var addOptions = {add: true, remove: false};

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      return this.set(models, _.extend({merge: false}, options, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      var singular = !_.isArray(models);
      models = singular ? [models] : _.clone(models);
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = models[i] = this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byId[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model, options);
      }
      return singular ? models[0] : models;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      options = _.defaults({}, options, setOptions);
      if (options.parse) models = this.parse(models, options);
      var singular = !_.isArray(models);
      models = singular ? (models ? [models] : []) : _.clone(models);
      var i, l, id, model, attrs, existing, sort;
      var at = options.at;
      var targetModel = this.model;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};
      var add = options.add, merge = options.merge, remove = options.remove;
      var order = !sortable && add && remove ? [] : false;

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        attrs = models[i] || {};
        if (attrs instanceof Model) {
          id = model = attrs;
        } else {
          id = attrs[targetModel.prototype.idAttribute || 'id'];
        }

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(id)) {
          if (remove) modelMap[existing.cid] = true;
          if (merge) {
            attrs = attrs === model ? model.attributes : attrs;
            if (options.parse) attrs = existing.parse(attrs, options);
            existing.set(attrs, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }
          models[i] = existing;

        // If this is a new, valid model, push it to the `toAdd` list.
        } else if (add) {
          model = models[i] = this._prepareModel(attrs, options);
          if (!model) continue;
          toAdd.push(model);
          this._addReference(model, options);
        }

        // Do not add multiple models with the same `id`.
        model = existing || model;
        if (order && (model.isNew() || !modelMap[model.id])) order.push(model);
        modelMap[model.id] = true;
      }

      // Remove nonexistent models if appropriate.
      if (remove) {
        for (i = 0, l = this.length; i < l; ++i) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length || (order && order.length)) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          for (i = 0, l = toAdd.length; i < l; i++) {
            this.models.splice(at + i, 0, toAdd[i]);
          }
        } else {
          if (order) this.models.length = 0;
          var orderedModels = order || toAdd;
          for (i = 0, l = orderedModels.length; i < l; i++) {
            this.models.push(orderedModels[i]);
          }
        }
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      // Unless silenced, it's time to fire all appropriate add/sort events.
      if (!options.silent) {
        for (i = 0, l = toAdd.length; i < l; i++) {
          (model = toAdd[i]).trigger('add', model, this, options);
        }
        if (sort || (order && order.length)) this.trigger('sort', this, options);
      }

      // Return the added (or merged) model (or models).
      return singular ? models[0] : models;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options || (options = {});
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i], options);
      }
      options.previousModels = this.models;
      this._reset();
      models = this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return models;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      return this.add(model, _.extend({at: this.length}, options));
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      return this.add(model, _.extend({at: 0}, options));
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function() {
      return slice.apply(this.models, arguments);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      return this._byId[obj] || this._byId[obj.id] || this._byId[obj.cid];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      if (_.isEmpty(attrs)) return first ? void 0 : [];
      return this[first ? 'find' : 'filter'](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        var method = options.reset ? 'reset' : 'set';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
        collection.trigger('sync', collection, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(model, resp) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models);
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) return attrs;
      options = options ? _.clone(options) : {};
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model.validationError) return model;
      this.trigger('invalid', this, model.validationError, options);
      return false;
    },

    // Internal method to create a model's ties to a collection.
    _addReference: function(model, options) {
      this._byId[model.cid] = model;
      if (model.id != null) this._byId[model.id] = model;
      if (!model.collection) model.collection = this;
      model.on('all', this._onModelEvent, this);
    },

    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model, options) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (model && event === 'change:' + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
    'lastIndexOf', 'isEmpty', 'chain', 'sample'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy', 'indexBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  // Backbone.View
  // -------------

  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    options || (options = {});
    _.extend(this, _.pick(options, viewOptions));
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be preferred to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    },

    // Change the view's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
      this.el = this.$el[0];
      if (delegate !== false) this.delegateEvents();
      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save',
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) continue;

        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        if (selector === '') {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
      return this;
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off('.delegateEvents' + this.cid);
      return this;
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
        this.setElement($el, false);
      } else {
        this.setElement(_.result(this, 'el'), false);
      }
    }

  });

  // Backbone.sync
  // -------------

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // If we're sending a `PATCH` request, and we're in an old Internet Explorer
    // that still has ActiveX enabled by default, override jQuery to use that
    // for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
    if (params.type === 'PATCH' && noXhrPatch) {
      params.xhr = function() {
        return new ActiveXObject("Microsoft.XMLHTTP");
      };
    }

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  var noXhrPatch =
    typeof window !== 'undefined' && !!window.ActiveXObject &&
      !(window.XMLHttpRequest && (new XMLHttpRequest).dispatchEvent);

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      var router = this;
      Backbone.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        router.execute(callback, args);
        router.trigger.apply(router, ['route:' + name].concat(args));
        router.trigger('route', name, args);
        Backbone.history.trigger('route', router, name, args);
      });
      return this;
    },

    // Execute a route handler with the provided parameters.  This is an
    // excellent place to do pre-route setup or post-route cleanup.
    execute: function(callback, args) {
      if (callback) callback.apply(this, args);
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      this.routes = _.result(this, 'routes');
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional) {
                     return optional ? match : '([^/?]+)';
                   })
                   .replace(splatParam, '([^?]*?)');
      return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param, i) {
        // Don't decode the search params.
        if (i === params.length - 1) return param || null;
        return param ? decodeURIComponent(param) : null;
      });
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;

  // Cached regex for stripping urls of hash.
  var pathStripper = /#.*$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Are we at the app root?
    atRoot: function() {
      return this.location.pathname.replace(/[^\/]$/, '$&/') === this.root;
    },

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = decodeURI(this.location.pathname + this.location.search);
          var root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Backbone.history has already been started");
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      if (oldIE && this._wantsHashChange) {
        var frame = Backbone.$('<iframe src="javascript:0" tabindex="-1">');
        this.iframe = frame.hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        Backbone.$(window).on('popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
        Backbone.$(window).on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;

      // Transition from hashChange to pushState or vice versa if both are
      // requested.
      if (this._wantsHashChange && this._wantsPushState) {

        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!this._hasPushState && !this.atRoot()) {
          this.fragment = this.getFragment(null, true);
          this.location.replace(this.root + '#' + this.fragment);
          // Return immediately as browser will do redirect to new url
          return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
        } else if (this._hasPushState && this.atRoot() && loc.hash) {
          this.fragment = this.getHash().replace(routeStripper, '');
          this.history.replaceState({}, document.title, this.root + this.fragment);
        }

      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
      if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl();
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragment) {
      fragment = this.fragment = this.getFragment(fragment);
      return _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: !!options};

      var url = this.root + (fragment = this.getFragment(fragment || ''));

      // Strip the hash for matching.
      fragment = fragment.replace(pathStripper, '');

      if (this.fragment === fragment) return;
      this.fragment = fragment;

      // Don't include a trailing slash on the root.
      if (fragment === '' && url !== '/') url = url.slice(0, -1);

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) return this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function(model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error(model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };

  return Backbone;

}));

},{"underscore":12}],4:[function(require,module,exports){
var Backbone = require('./backbone')
var querystring = require('querystring')
var _ = require('./underscore')
var extend = _.extend
var object = _.object
var isRegExp = _.isRegExp
var isFunction = _.isFunction
var zip = _.zip
var pluck = _.pluck
var sortBy = _.sortBy
var keys = _.keys
var difference = _.difference
var map = _.map

function getNames (string) {
    var ret = []
    ret.push.apply(ret, process(string, /(\(\?)?:\w+/g))
    ret.push.apply(ret, process(string, /\*\w+/g))
    return ret
}

function process (string, regex) {
    var matches = string.match(regex) || []
    var indexes = getIndexes(string, regex)
    return zip(matches, indexes)
}

function getIndexes (string, regex) {
    var ret = []
    while (regex.test(string)) {
        ret.push(regex.lastIndex)
    }
    return ret
}

function splice (source, from, to, replacement) {
    replacement = replacement || ''
    return source.slice(0, from) + replacement + source.slice(to)
}

module.exports = Backbone.Router.extend({
    /**
     * Override so our _routes object is unique to each router.
     * I hate this side of js.
     */
    constructor: function () {
        this._routes = {}
        Backbone.Router.prototype.constructor.apply(this, arguments)
    }

    /**
     * Override route to perform some subtle tweaks! Namely, storing raw string
     * routes for reverse routing and passing the name to the
     * buildRequest function
     */
  , route: function (route, name, callback) {
        var _this = this

        if (!isRegExp(route)) {
            this._routes[name] = route
            route = this._routeToRegExp(route)
        }
        if (isFunction(name)) {
            callback = name
            name = ''
        }
        if (!callback) callback = this[name]
        Backbone.history.route(route, function (fragment) {
            var req = _this._buildRequest(route, fragment, name)
            _this.execute(callback, req)
            _this.trigger.apply(_this, [ 'route:' + name, req ])
            _this.trigger('route', name, req)
            Backbone.history.trigger('route', _this, name, req)
        })
    }

    /**
     * Store names of parameters in a propery of route
     */
  , _routeToRegExp: function (route) {
        var ret = Backbone.Router.prototype._routeToRegExp.call(this, route)

        var names = getNames(route)
        ret.names = map(pluck(sortBy(names, '1'), '0'), function (s) {
            return s.slice(1)
        })

        return ret
    }

    /**
     * Create a request object. It should have the route name, named params as
     * keys with their values and a query object which is the query params, an
     * empty object if no query params available.
     */
  , _buildRequest: function (route, fragment, name) {
        var values = this._extractParameters(route, fragment)
        var query = fragment.split('?').slice(1).join('?')
        // Passes the query string as the last cell in the array. Get rid of it!
        // Only for non-regex routes, route.names doesn't exist in regex routes.
        if (route.names) {
            values = values.slice(0, -1)
        }
        names = route.names || map(values, function (v, i) {
            return i
        })

        var req = {
            // Regex routes aren't stored in @_routes and are what we want
            route: this._routes[name] || route
          , fragment: fragment
          , name: name
          , values: values
          , params: object(names, values)
          , query: querystring.parse(query)
        }

        return req
    }

    /**
     * No-op to stop the routes property being used.
     */
  , _bindRoutes: function () {}

    /**
     * Rather than the default backbone behaviour of applying the args to the
     * callback, call the callback with the request object.
     */
  , execute: function (callback, req) {
        if (callback) callback.call(this, req)
    }

    /**
     * Reverse a named route with a barebones request object.
     */
  , reverse: function (name, req) {
        var route = this._routes[name]
        if (!route) return null

        var ret = route
        var params = req.params || {}
        var query = req.query || {}
        var names = keys(params)

        // Step through the optional params
        var optionals = process(route, /\((.*?)\)/g).reverse()
        for (var i = 0; i < optionals.length; i++) {
            var optional = optionals[i][0]
            var lastIndex = optionals[i][1]

            // Get the named parameters
            var nameds = map(pluck(getNames(optional), '0', function (s) {
                return s.slice(1)
            }))

            // If there are no named parameters or we don't have all of them
            var diff = difference(nameds, names).length
            if (nameds.length === 0 || diff !== 0) {
                var route = splice(route, lastIndex - optional.length,
                    lastIndex)
            }
            else {
                var route = splice(route, lastIndex - optional.length,
                    lastIndex, optional.slice(1, -1))
            }
        }

        // Replace nameds
        nameds = getNames(route).reverse()
        for (var i = 0; i < nameds.length; i++) {
            var segment = nameds[i][0]
            var lastIndex = nameds[i][1]

            var value = params[segment.slice(1)]
            if (value === void 0) value = null
            if (value !== null) {
                route = splice(route, lastIndex - segment.length, lastIndex,
                    params[segment.slice(1)])
            }
        }

        // Query string
        query = querystring.stringify(query)
        if (query) route += '?' + query

        return route
    }
})
},{"./backbone":2,"./underscore":5,"querystring":10}],5:[function(require,module,exports){
module.exports = require('underscore') || window._
},{"underscore":12}],6:[function(require,module,exports){
var Backbone = require('./backbone')
var _ = require('underscore')
var without = _.without
var difference = _.difference
var indexOf = _.indexOf

module.exports = Backbone.View.extend({
    // Parent View
    parent: null

    // Child views, is initialised as an array
  , children: null

    // The prefix to use for root view state change events
  , namespace: ''

    /**
     * Ensure the classname is applied, then set the parent and children if any
     * are passed in. Does the normal backbone constructor and then does the
     * first state change.
     */
  , constructor: function (options) {
        options = options || {}
        this.children = []

        if (options.className) this.className = options.className
        if (options.namespace) this.namespace = options.namespace
        if (options.el) this._ensureClass(options.el)
        if (options.parent) this.setParent(options.parent)
        if (options.children && options.children.length) {
            this.addChildren(options.children)
        }

        return Backbone.View.prototype.constructor.call(this, options)
    }

    /**
     * Used to ensure that the className property of the view is applied
     * to an el passed in as an option.
     */
  , _ensureClass: function (el, className) {
        className = className || this.className
        Backbone.$(el).addClass(className)
    }

    /**
     * Adds a list of views as children of this view.
     */
  , addChildren: function (views) {
        for (var i = 0; i < views.length; i++) {
            this.addChild(views[i])
        }
    }

    /**
     * Adds a view as a child of this view.
     */
  , addChild: function (view) {
        if (view.parent) view.unsetParent()
        this.children.push(view)
        view.parent = this
    }

    /**
     * Sets the parent view.
     */
  , setParent: function (parent) {
        if (this.parent) this.unsetParent()
        this.parent = parent
        this.parent.children.push(this)
    }

    /**
     * Unsets the parent view
     */
  , unsetParent: function () {
        if (!this.parent) return
        this.parent.removeChild(this)
    }

    /**
     * Parent and Child accessors.
     */
  , hasParent: function () {
        return !!this.parent
    }
  , getParent: function () {
        return this.parent
    }

  , hasChildren: function () {
        return !!this.children.length
    }
  , getChildren: function () {
        return this.children
    }

  , hasChild: function (view) {
        return indexOf(this.children, view) >= 0
    }

  , hasDescendant: function (view) {
        // First check for direct descendants
        if (this.hasChild(view)) return true

        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i].hasDescendant(view)) return true
        }

        return false
    }

    /**
     * Removing children
     */
  , removeChild: function (child) {
        this.children = without(this.children, child)
        child.parent = null
    }

  , removeChildren: function (children) {
        for (var i = 0; i < children.length; i++) {
            this.removeChild(children[i])
        }
    }

    /**
     * Gets the root view for a particular view. Can be itself.
     */
  , root: function () {
        var root = this
        while (root.hasParent()) {
            root = root.getParent()
        }
        return root
    }

    /**
     * Calls remove on all child views before removing itself
     */
  , remove: function () {
        this.children.forEach(function (child) {
            child.remove()
        })
        this.children = []
        this.parent = null
        this.off()
        this.undelegateEvents()
        Backbone.View.prototype.remove.call(this)
    }

    /**
     * Calls trigger on the root() object with the namespace added, and also on
     * itself withou the namespace.
     */
  , trigger: function () {
        var args = Array.prototype.slice.call(arguments)

        // Trigger the local event
        Backbone.View.prototype.trigger.apply(this, args)

        // Add namespace to the name in args array
        if (this.namespace) args[0] = this.namespace + '.' + args[0]

        // Trigger the root namespaced event
        if (this.parent) this.parent._bubbleTrigger.apply(this.parent, args)
    }

    /**
     * Used when bubbling to prevent namespace pollution
     * as it goes up the chain.
     */
  , _bubbleTrigger: function() {
        var args = Array.prototype.slice.call(arguments)
        Backbone.View.prototype.trigger.apply(this, args)
        if (this.parent) this.parent._bubbleTrigger.apply(this.parent, args)
    }
})
},{"./backbone":2,"underscore":12}],7:[function(require,module,exports){

},{}],8:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],9:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],10:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":8,"./encode":9}],11:[function(require,module,exports){
'use strict';

/**
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

exports.merge = function merge(a, b) {
  if (arguments.length === 1) {
    var attrs = a[0];
    for (var i = 1; i < a.length; i++) {
      attrs = merge(attrs, a[i]);
    }
    return attrs;
  }
  var ac = a['class'];
  var bc = b['class'];

  if (ac || bc) {
    ac = ac || [];
    bc = bc || [];
    if (!Array.isArray(ac)) ac = [ac];
    if (!Array.isArray(bc)) bc = [bc];
    a['class'] = ac.concat(bc).filter(nulls);
  }

  for (var key in b) {
    if (key != 'class') {
      a[key] = b[key];
    }
  }

  return a;
};

/**
 * Filter null `val`s.
 *
 * @param {*} val
 * @return {Boolean}
 * @api private
 */

function nulls(val) {
  return val != null && val !== '';
}

/**
 * join array as classes.
 *
 * @param {*} val
 * @return {String}
 */
exports.joinClasses = joinClasses;
function joinClasses(val) {
  return (Array.isArray(val) ? val.map(joinClasses) :
    (val && typeof val === 'object') ? Object.keys(val).filter(function (key) { return val[key]; }) :
    [val]).filter(nulls).join(' ');
}

/**
 * Render the given classes.
 *
 * @param {Array} classes
 * @param {Array.<Boolean>} escaped
 * @return {String}
 */
exports.cls = function cls(classes, escaped) {
  var buf = [];
  for (var i = 0; i < classes.length; i++) {
    if (escaped && escaped[i]) {
      buf.push(exports.escape(joinClasses([classes[i]])));
    } else {
      buf.push(joinClasses(classes[i]));
    }
  }
  var text = joinClasses(buf);
  if (text.length) {
    return ' class="' + text + '"';
  } else {
    return '';
  }
};


exports.style = function (val) {
  if (val && typeof val === 'object') {
    return Object.keys(val).map(function (style) {
      return style + ':' + val[style];
    }).join(';');
  } else {
    return val;
  }
};
/**
 * Render the given attribute.
 *
 * @param {String} key
 * @param {String} val
 * @param {Boolean} escaped
 * @param {Boolean} terse
 * @return {String}
 */
exports.attr = function attr(key, val, escaped, terse) {
  if (key === 'style') {
    val = exports.style(val);
  }
  if ('boolean' == typeof val || null == val) {
    if (val) {
      return ' ' + (terse ? key : key + '="' + key + '"');
    } else {
      return '';
    }
  } else if (0 == key.indexOf('data') && 'string' != typeof val) {
    if (JSON.stringify(val).indexOf('&') !== -1) {
      console.warn('Since Jade 2.0.0, ampersands (`&`) in data attributes ' +
                   'will be escaped to `&amp;`');
    };
    if (val && typeof val.toISOString === 'function') {
      console.warn('Jade will eliminate the double quotes around dates in ' +
                   'ISO form after 2.0.0');
    }
    return ' ' + key + "='" + JSON.stringify(val).replace(/'/g, '&apos;') + "'";
  } else if (escaped) {
    if (val && typeof val.toISOString === 'function') {
      console.warn('Jade will stringify dates in ISO form after 2.0.0');
    }
    return ' ' + key + '="' + exports.escape(val) + '"';
  } else {
    if (val && typeof val.toISOString === 'function') {
      console.warn('Jade will stringify dates in ISO form after 2.0.0');
    }
    return ' ' + key + '="' + val + '"';
  }
};

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} escaped
 * @return {String}
 */
exports.attrs = function attrs(obj, terse){
  var buf = [];

  var keys = Object.keys(obj);

  if (keys.length) {
    for (var i = 0; i < keys.length; ++i) {
      var key = keys[i]
        , val = obj[key];

      if ('class' == key) {
        if (val = joinClasses(val)) {
          buf.push(' ' + key + '="' + val + '"');
        }
      } else {
        buf.push(exports.attr(key, val, false, terse));
      }
    }
  }

  return buf.join('');
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function escape(html){
  var result = String(html)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  if (result === '' + html) return html;
  else return result;
};

/**
 * Re-throw the given `err` in context to the
 * the jade in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

exports.rethrow = function rethrow(err, filename, lineno, str){
  if (!(err instanceof Error)) throw err;
  if ((typeof window != 'undefined' || !filename) && !str) {
    err.message += ' on line ' + lineno;
    throw err;
  }
  try {
    str = str || require('fs').readFileSync(filename, 'utf8')
  } catch (ex) {
    rethrow(err, null, lineno)
  }
  var context = 3
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Jade') + ':' + lineno
    + '\n' + context + '\n\n' + err.message;
  throw err;
};

},{"fs":7}],12:[function(require,module,exports){
//     Underscore.js 1.7.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.7.0';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var createCallback = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  _.iteratee = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return createCallback(value, context, argCount);
    if (_.isObject(value)) return _.matches(value);
    return _.property(value);
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    if (obj == null) return obj;
    iteratee = createCallback(iteratee, context);
    var i, length = obj.length;
    if (length === +length) {
      for (i = 0; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    if (obj == null) return [];
    iteratee = _.iteratee(iteratee, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length),
        currentKey;
    for (var index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index = 0, currentKey;
    if (arguments.length < 3) {
      if (!length) throw new TypeError(reduceError);
      memo = obj[keys ? keys[index++] : index++];
    }
    for (; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== + obj.length && _.keys(obj),
        index = (keys || obj).length,
        currentKey;
    if (arguments.length < 3) {
      if (!index) throw new TypeError(reduceError);
      memo = obj[keys ? keys[--index] : --index];
    }
    while (index--) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    predicate = _.iteratee(predicate, context);
    _.some(obj, function(value, index, list) {
      if (predicate(value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    predicate = _.iteratee(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(_.iteratee(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    if (obj == null) return true;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    if (obj == null) return false;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (obj.length !== +obj.length) obj = _.values(obj);
    return _.indexOf(obj, target) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = obj && obj.length === +obj.length ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = low + high >>> 1;
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return obj.length === +obj.length ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = _.iteratee(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    for (var i = 0, length = input.length; i < length; i++) {
      var value = input[i];
      if (!_.isArray(value) && !_.isArguments(value)) {
        if (!strict) output.push(value);
      } else if (shallow) {
        push.apply(output, value);
      } else {
        flatten(value, shallow, strict, output);
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (array == null) return [];
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = _.iteratee(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i];
      if (isSorted) {
        if (!i || seen !== value) result.push(value);
        seen = value;
      } else if (iteratee) {
        var computed = iteratee(value, i, array);
        if (_.indexOf(seen, computed) < 0) {
          seen.push(computed);
          result.push(value);
        }
      } else if (_.indexOf(result, value) < 0) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true, []));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    if (array == null) return [];
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = array.length; i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(slice.call(arguments, 1), true, true, []);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function(array) {
    if (array == null) return [];
    var length = _.max(arguments, 'length').length;
    var results = Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var idx = array.length;
    if (typeof from == 'number') {
      idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
    }
    while (--idx >= 0) if (array[idx] === item) return idx;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var Ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    args = slice.call(arguments, 2);
    bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      Ctor.prototype = func.prototype;
      var self = new Ctor;
      Ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (_.isObject(result)) return result;
      return self;
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = hasher ? hasher.apply(this, arguments) : key;
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last > 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed before being called N times.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      } else {
        func = null;
      }
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    if (!_.isObject(obj)) return obj;
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
      source = arguments[i];
      for (prop in source) {
        if (hasOwnProperty.call(source, prop)) {
            obj[prop] = source[prop];
        }
      }
    }
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj, iteratee, context) {
    var result = {}, key;
    if (obj == null) return result;
    if (_.isFunction(iteratee)) {
      iteratee = createCallback(iteratee, context);
      for (key in obj) {
        var value = obj[key];
        if (iteratee(value, key, obj)) result[key] = value;
      }
    } else {
      var keys = concat.apply([], slice.call(arguments, 1));
      obj = new Object(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        key = keys[i];
        if (key in obj) result[key] = obj[key];
      }
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(concat.apply([], slice.call(arguments, 1)), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    if (!_.isObject(obj)) return obj;
    for (var i = 1, length = arguments.length; i < length; i++) {
      var source = arguments[i];
      for (var prop in source) {
        if (obj[prop] === void 0) obj[prop] = source[prop];
      }
    }
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (
      aCtor !== bCtor &&
      // Handle Object.create(x) cases
      'constructor' in a && 'constructor' in b &&
      !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
        _.isFunction(bCtor) && bCtor instanceof bCtor)
    ) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size, result;
    // Recursively compare objects and arrays.
    if (className === '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size === b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      size = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      result = _.keys(b).length === size;
      if (result) {
        while (size--) {
          // Deep compare each member
          key = keys[size];
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around an IE 11 bug.
  if (typeof /./ !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    var pairs = _.pairs(attrs), length = pairs.length;
    return function(obj) {
      if (obj == null) return !length;
      obj = new Object(obj);
      for (var i = 0; i < length; i++) {
        var pair = pairs[i], key = pair[0];
        if (pair[1] !== obj[key] || !(key in obj)) return false;
      }
      return true;
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = createCallback(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? object[property]() : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],13:[function(require,module,exports){
var Nav, Pages, View, Webapp,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

View = require('bamjs/view');

Pages = {
  home: require('../../components/page-home'),
  matters: require('../../components/page-matters'),
  hall: require('../../components/page-hall')
};

Nav = require('../../components/nav');

Webapp = (function(_super) {
  __extends(Webapp, _super);

  function Webapp() {
    return Webapp.__super__.constructor.apply(this, arguments);
  }

  Webapp.prototype.namespace = 'app';

  Webapp.prototype.pages = {};

  Webapp.prototype.initialize = function() {
    this.nav = new Nav({
      el: this.$('.nav'),
      parent: this
    });
    return this.showPage();
  };

  Webapp.prototype.showPage = function(req) {
    var newPage, options, page, param, reqValues;
    if (!req) {
      page = 'home';
      param = null;
    } else {
      page = req.name;
      param = req.values[0];
    }
    if (param) {
      reqValues = param.split('_');
    }
    newPage = this.pages[page];
    if (this.currentPage) {
      if (this.currentPage !== newPage) {
        this.currentPage.hide();
        this.currentPage = newPage;
      }
    }
    if (!newPage) {
      options = {
        el: this.$("[id='!/" + page + "']"),
        parent: this
      };
      this.currentPage = new Pages[page](options);
      this.pages[page] = this.currentPage;
    }
    this.currentPage.show();
    this.nav.changeNavSel(page);
    if (page === 'matters') {
      return this.currentPage.setMatterGuide(reqValues);
    }
  };

  return Webapp;

})(View);

module.exports = Webapp;



},{"../../components/nav":33,"../../components/page-hall":35,"../../components/page-home":37,"../../components/page-matters":39,"bamjs/view":6}],14:[function(require,module,exports){
var AppRouter, Router,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

Router = require('bamjs/router');

AppRouter = (function(_super) {
  __extends(AppRouter, _super);

  function AppRouter() {
    return AppRouter.__super__.constructor.apply(this, arguments);
  }

  AppRouter.prototype.initialize = function(app) {
    this.app = app;
    return this.buildRoutes();
  };

  AppRouter.prototype.buildRoutes = function() {
    this.route('!/', 'home', this.showPage);
    this.route('!/hall', 'hall', this.showPage);
    return this.route('!/matters/:data', 'matters', this.showPage);
  };

  AppRouter.prototype.showPage = function(req) {
    return this.app.showPage(req);
  };

  return AppRouter;

})(Router);

module.exports = AppRouter;



},{"bamjs/router":4}],15:[function(require,module,exports){
var BusList, BusListModel, View, tmpl,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

View = require('bamjs/view');

BusListModel = require('../../model/bus-list');

tmpl = require('./index.jade');

BusList = (function(_super) {
  var namespace;

  __extends(BusList, _super);

  function BusList() {
    return BusList.__super__.constructor.apply(this, arguments);
  }

  namespace = 'bus-list';

  BusList.prototype.events = {
    'click .bus-list-bg': 'hide',
    'click .btn-close-list': 'hide'
  };

  BusList.prototype.initialize = function() {
    return this.$el.html(tmpl({
      busListModel: this.model
    }));
  };

  BusList.prototype.hide = function(e) {
    this.$('.bus-list-bg').fadeOut(100);
    return this.$('.bus-list').fadeOut(100);
  };

  BusList.prototype.show = function(e) {
    this.$('.bus-list-bg').fadeIn(100);
    return this.$('.bus-list').fadeIn(100);
  };

  return BusList;

})(View);

module.exports = BusList;



},{"../../model/bus-list":47,"./index.jade":16,"bamjs/view":6}],16:[function(require,module,exports){
var jade = require('jade/lib/runtime.js');
module.exports=function(params) { if (params) {params.require = require;} return (
function template(locals) {
var jade_debug = [{ lineno: 1, filename: "d:\\WORKS\\GIT\\SceneNav\\src\\components\\bus-list\\index.jade" }];
try {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (busListModel, undefined) {


buf.push("<div style=\"display:none;\" class=\"bus-list-bg\">");


buf.push("</div>");


buf.push("<div style=\"display:none;\" class=\"bus-list\">");


buf.push("<div class=\"bus-list-title\">" + (jade.escape(null == (jade_interp = busListModel.getName()) ? "" : jade_interp)));


buf.push("<div class=\"btn-close-list\">");


buf.push("关闭");


buf.push("</div>");




buf.push("</div>");


buf.push("<div class=\"bus-list-content\">");


var buslines = busListModel.getBusLines().models


// iterate buslines
;(function(){
  var $$obj = buslines;
  if ('number' == typeof $$obj.length) {

    for (var i = 0, $$l = $$obj.length; i < $$l; i++) {
      var busline = $$obj[i];



if ( i < buslines.length - 1)
{


buf.push("<div class=\"bus-line\">");


buf.push("<div class=\"bus-line-title\">" + (jade.escape(null == (jade_interp = busline.getName()) ? "" : jade_interp)));


buf.push("</div>");


buf.push("<div class=\"bus-line-intro\">" + (null == (jade_interp = busline.getIntro()) ? "" : jade_interp));


buf.push("</div>");


buf.push("</div>");


}
else
{


buf.push("<div class=\"bus-line bus-line-last\">");


buf.push("<div class=\"bus-line-title\">" + (jade.escape(null == (jade_interp = busline.getName()) ? "" : jade_interp)));


buf.push("</div>");


buf.push("<div class=\"bus-line-intro\">" + (null == (jade_interp = busline.getIntro()) ? "" : jade_interp));


buf.push("</div>");


buf.push("</div>");


}


    }

  } else {
    var $$l = 0;
    for (var i in $$obj) {
      $$l++;      var busline = $$obj[i];



if ( i < buslines.length - 1)
{


buf.push("<div class=\"bus-line\">");


buf.push("<div class=\"bus-line-title\">" + (jade.escape(null == (jade_interp = busline.getName()) ? "" : jade_interp)));


buf.push("</div>");


buf.push("<div class=\"bus-line-intro\">" + (null == (jade_interp = busline.getIntro()) ? "" : jade_interp));


buf.push("</div>");


buf.push("</div>");


}
else
{


buf.push("<div class=\"bus-line bus-line-last\">");


buf.push("<div class=\"bus-line-title\">" + (jade.escape(null == (jade_interp = busline.getName()) ? "" : jade_interp)));


buf.push("</div>");


buf.push("<div class=\"bus-line-intro\">" + (null == (jade_interp = busline.getIntro()) ? "" : jade_interp));


buf.push("</div>");


buf.push("</div>");


}


    }

  }
}).call(this);



buf.push("</div>");


buf.push("</div>");

}.call(this,"busListModel" in locals_for_with?locals_for_with.busListModel:typeof busListModel!=="undefined"?busListModel:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
} catch (err) {
  jade.rethrow(err, jade_debug[0].filename, jade_debug[0].lineno, ".bus-list-bg(style='display:none;')\r\n.bus-list(style='display:none;')\r\n\t.bus-list-title= busListModel.getName()\r\n\t\t.btn-close-list 关闭\r\n\t.bus-list-content\r\n\t\t- var buslines = busListModel.getBusLines().models\r\n\t\tfor busline,i in buslines\r\n\t\t\tif i < buslines.length - 1\r\n\t\t\t\t.bus-line\r\n\t\t\t\t\t.bus-line-title= busline.getName()\r\n\t\t\t\t\t.bus-line-intro!= busline.getIntro()\r\n\t\t\telse\r\n\t\t\t\t.bus-line.bus-line-last\r\n\t\t\t\t\t.bus-line-title= busline.getName()\r\n\t\t\t\t\t.bus-line-intro!= busline.getIntro()");
}
}
)(params); }

},{"jade/lib/runtime.js":11}],17:[function(require,module,exports){
var MapHallBtn, View, tmpl,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

View = require('bamjs/view');

tmpl = require('./index.jade');

MapHallBtn = (function(_super) {
  __extends(MapHallBtn, _super);

  function MapHallBtn() {
    return MapHallBtn.__super__.constructor.apply(this, arguments);
  }

  MapHallBtn.prototype.namespace = 'map-hall-btn';

  MapHallBtn.prototype.events = {
    'mouseover .map-hall-btn': 'selOn',
    'mouseout .map-hall-btn': 'selOff',
    'click .map-pin-left': 'onBtnClick'
  };

  MapHallBtn.prototype.initialize = function() {
    this.$el.html(tmpl({
      data: this.model
    }));
    if (this.model.getName() === '') {
      return this.$('.map-hall-btn').hide();
    }
  };

  MapHallBtn.prototype.selOn = function(e) {
    return this.$('.map-hall-btn').addClass('sel');
  };

  MapHallBtn.prototype.selOff = function(e) {
    return this.$('.map-hall-btn').removeClass('sel');
  };

  MapHallBtn.prototype.onBtnClick = function(e) {
    if (this.model.getLink() !== '') {
      return window.open(this.model.getLink());
    }
  };

  return MapHallBtn;

})(View);

module.exports = MapHallBtn;



},{"./index.jade":18,"bamjs/view":6}],18:[function(require,module,exports){
var jade = require('jade/lib/runtime.js');
module.exports=function(params) { if (params) {params.require = require;} return (
function template(locals) {
var jade_debug = [{ lineno: 1, filename: "d:\\WORKS\\GIT\\SceneNav\\src\\components\\map-hall-btn\\index.jade" }];
try {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (data) {


if ( data.getDirection() === 'up')
{


buf.push("<div class=\"map-hall-btn mhb-up\">");


buf.push("<div class=\"map-pin-left\">");


buf.push(" ");


buf.push("<div class=\"map-pin-left-title\">" + (jade.escape(null == (jade_interp = data.getName()) ? "" : jade_interp)));


buf.push("</div>");


buf.push("</div>");


buf.push("</div>");


}
else
{


buf.push("<div class=\"map-hall-btn mhb-down\">");


buf.push("<div class=\"map-pin-left\">");


buf.push(" ");


buf.push("<div class=\"map-pin-left-title\">" + (jade.escape(null == (jade_interp = data.getName()) ? "" : jade_interp)));


buf.push("</div>");


buf.push("</div>");


buf.push("</div>");


}

}.call(this,"data" in locals_for_with?locals_for_with.data:typeof data!=="undefined"?data:undefined));;return buf.join("");
} catch (err) {
  jade.rethrow(err, jade_debug[0].filename, jade_debug[0].lineno, "if data.getDirection() === 'up'\r\n\t.map-hall-btn.mhb-up\r\n\t\t.map-pin-left \r\n\t\t\t\t.map-pin-left-title= data.getName()\r\nelse\r\n\t.map-hall-btn.mhb-down\r\n\t\t.map-pin-left \r\n\t\t\t\t.map-pin-left-title= data.getName()");
}
}
)(params); }

},{"jade/lib/runtime.js":11}],19:[function(require,module,exports){
var MapHallBtn, MapHallBtnModel, MapHallFloor, View, tmpl,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

View = require('bamjs/view');

MapHallBtn = require('../map-hall-btn');

MapHallBtnModel = require('../../model/map-hall-btn');

tmpl = require('./index.jade');

MapHallFloor = (function(_super) {
  var namespace;

  __extends(MapHallFloor, _super);

  function MapHallFloor() {
    return MapHallFloor.__super__.constructor.apply(this, arguments);
  }

  namespace = 'map-hall-floor';

  MapHallFloor.prototype.initialize = function() {
    return this.collection.on('reset', function() {
      return this.render();
    }, this);
  };

  MapHallFloor.prototype.render = function() {
    var el, i, _i, _len, _ref, _results;
    this.$el.html(tmpl({
      mhbcollection: this.collection
    }));
    _ref = this.$('.mhb');
    _results = [];
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      el = _ref[i];
      _results.push(new MapHallBtn({
        el: el,
        parent: this,
        model: this.collection.models[i]
      }));
    }
    return _results;
  };

  return MapHallFloor;

})(View);

module.exports = MapHallFloor;



},{"../../model/map-hall-btn":49,"../map-hall-btn":17,"./index.jade":20,"bamjs/view":6}],20:[function(require,module,exports){
var jade = require('jade/lib/runtime.js');
module.exports=function(params) { if (params) {params.require = require;} return (
function template(locals) {
var jade_debug = [{ lineno: 1, filename: "d:\\WORKS\\GIT\\SceneNav\\src\\components\\map-hall-floor\\index.jade" }];
try {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (mhbcollection, undefined) {


var mhbs = mhbcollection.models
{


// iterate mhbs
;(function(){
  var $$obj = mhbs;
  if ('number' == typeof $$obj.length) {

    for (var i = 0, $$l = $$obj.length; i < $$l; i++) {
      var mhb = $$obj[i];



var pos = 'left : '+mhb.getXpos() + '; top : ' + mhb.getYpos() +';'


buf.push("<div" + (jade.attr("style", pos, true, false)) + " class=\"mhb\">");


buf.push("</div>");


    }

  } else {
    var $$l = 0;
    for (var i in $$obj) {
      $$l++;      var mhb = $$obj[i];



var pos = 'left : '+mhb.getXpos() + '; top : ' + mhb.getYpos() +';'


buf.push("<div" + (jade.attr("style", pos, true, false)) + " class=\"mhb\">");


buf.push("</div>");


    }

  }
}).call(this);



}

}.call(this,"mhbcollection" in locals_for_with?locals_for_with.mhbcollection:typeof mhbcollection!=="undefined"?mhbcollection:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
} catch (err) {
  jade.rethrow(err, jade_debug[0].filename, jade_debug[0].lineno, "- var mhbs = mhbcollection.models\r\n\tfor mhb,i in mhbs\r\n\t\t- var pos = 'left : '+mhb.getXpos() + '; top : ' + mhb.getYpos() +';'\r\n\t\t.mhb(style=pos)");
}
}
)(params); }

},{"jade/lib/runtime.js":11}],21:[function(require,module,exports){
var MapHall, MapHallBtnCollection, MapHallFloor, View, tmpl,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

View = require('bamjs/view');

tmpl = require('./index.jade');

MapHallFloor = require('../map-hall-floor');

MapHallBtnCollection = require('../../model/map-hall-btn/collection');

MapHall = (function(_super) {
  var namespace;

  __extends(MapHall, _super);

  function MapHall() {
    return MapHall.__super__.constructor.apply(this, arguments);
  }

  namespace = 'map-hall';

  MapHall.prototype.events = {
    'click #btn_return': 'onReturn',
    'click #btn_f1': 'onF1',
    'click #btn_f2': 'onF2'
  };

  MapHall.prototype.initialize = function() {
    this.$el.html(tmpl());
    this.mapHallBtnCollection_F1 = new MapHallBtnCollection();
    this.mapHallBtnCollection_F1.url = 'data/hall_level_1.json';
    this.mapHallBtnCollection_F1.fetch({
      reset: true,
      success: function(collection, resp, options) {},
      error: function(collection, resp, options) {
        return alert('error: ' + resp.responseText);
      }
    });
    this.mapHallFloor_F1 = new MapHallFloor({
      el: this.$('#f1'),
      parent: this,
      collection: this.mapHallBtnCollection_F1
    });
    this.mapHallBtnCollection_F2 = new MapHallBtnCollection();
    this.mapHallBtnCollection_F2.url = 'data/hall_level_2.json';
    this.mapHallBtnCollection_F2.fetch({
      reset: true,
      success: function(collection, resp, options) {},
      error: function(collection, resp, options) {
        return alert('error: ' + resp.responseText);
      }
    });
    this.mapHallFloor_F2 = new MapHallFloor({
      el: this.$('#f2'),
      parent: this,
      collection: this.mapHallBtnCollection_F2
    });
    $('#f1').show();
    return $('#f2').hide();
  };

  MapHall.prototype.onReturn = function(e) {
    return this.root().router.navigate('#!/', {
      trigger: true
    });
  };

  MapHall.prototype.onF1 = function(e) {
    $('#f1').fadeIn(100);
    $('#f2').fadeOut(100);
    return $('.floor-indicator').removeClass('f2');
  };

  MapHall.prototype.onF2 = function(e) {
    $('#f1').fadeOut(100);
    $('#f2').fadeIn(100);
    return $('.floor-indicator').addClass('f2');
  };

  return MapHall;

})(View);

module.exports = MapHall;



},{"../../model/map-hall-btn/collection":48,"../map-hall-floor":19,"./index.jade":22,"bamjs/view":6}],22:[function(require,module,exports){
var jade = require('jade/lib/runtime.js');
module.exports=function(params) { if (params) {params.require = require;} return (
function template(locals) {
var jade_debug = [{ lineno: 1, filename: "d:\\WORKS\\GIT\\SceneNav\\src\\components\\map-hall\\index.jade" }];
try {
var buf = [];
var jade_mixins = {};
var jade_interp;



buf.push("<div class=\"map-container hall-bg\">");


buf.push("<div class=\"map-content\">");


buf.push("<div id=\"f1\" class=\"hall-area hall-f1\">");


buf.push("</div>");


buf.push("<div id=\"f2\" class=\"hall-area hall-f2\">");


buf.push("</div>");


buf.push("</div>");


buf.push("</div>");


buf.push("<div class=\"map-mobile-hint\">");


buf.push("</div>");


buf.push("<div id=\"btn_return\" class=\"hall-btn hall-btn-return\">");


buf.push("返回");


buf.push("<div class=\"arrow-return\">");


buf.push("</div>");


buf.push("</div>");


buf.push("<div id=\"btn_f1\" class=\"hall-btn hall-btn-f1\">");


buf.push("一楼");


buf.push("</div>");


buf.push("<div id=\"btn_f2\" class=\"hall-btn hall-btn-f2\">");


buf.push("二楼");


buf.push("</div>");


buf.push("<div class=\"floor-indicator\">");


buf.push("</div>");

;return buf.join("");
} catch (err) {
  jade.rethrow(err, jade_debug[0].filename, jade_debug[0].lineno, ".map-container.hall-bg\r\n\t.map-content\r\n\t\t.hall-area.hall-f1(id='f1')\r\n\t\t.hall-area.hall-f2(id='f2')\r\n.map-mobile-hint\r\n.hall-btn.hall-btn-return(id='btn_return') 返回\r\n\t.arrow-return\r\n.hall-btn.hall-btn-f1(id='btn_f1') 一楼\r\n.hall-btn.hall-btn-f2(id='btn_f2') 二楼\r\n.floor-indicator");
}
}
)(params); }

},{"jade/lib/runtime.js":11}],23:[function(require,module,exports){
var BusLineCollection, BusLineModel, BusList, BusListModel, MapNav, View, tmpl,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

View = require('bamjs/view');

BusList = require('../bus-list');

tmpl = require('./index.jade');

BusListModel = require('../../model/bus-list');

BusLineModel = require('../../model/bus-list/busline');

BusLineCollection = require('../../model/bus-list/buslines');

MapNav = (function(_super) {
  var namespace;

  __extends(MapNav, _super);

  function MapNav() {
    return MapNav.__super__.constructor.apply(this, arguments);
  }

  namespace = 'map-nav';

  MapNav.prototype.events = {
    'click [data-mappin = bus-stop-1]': 'clickBusStop1',
    'click [data-mappin = bus-stop-2]': 'clickBusStop2',
    'click [data-mappin = enter-hall]': 'clickEnterHall'
  };

  MapNav.prototype.initialize = function() {
    this.$el.html(tmpl());
    this.busLineModelArray_1 = [
      {
        Name: '761路（高新区停车场－市政府）',
        Intro: '售票方式：无人售票，票价2元<br> 发车时间：<br> 市政府 05:30－18:50<br> 高新区停车场 7:10－20:30<br> 沿途站点：高新区停车场－华贯路－祥源路北站－锦荣路－正阳西路－程戈庄－河东路－创业大厦－智力岛路－火炬路－汇智桥路－龙湖滟澜海岸－花溪地－西后楼－东蓝家庄－双埠北－四方长途站－小村庄－海泊桥－鞍山路－图书馆－江西路－市政府'
      }, {
        Name: '762路环线（高新区停车场－新业路）',
        Intro: '售票方式：无人售票，季节性票价<br> 发车时间：06:30－18:00<br> 沿途站点：高新区停车场－华贯路－祥源路北站－科海路－科兴路－瑞源路－科兴路西站－科海路西站－思源路－锦暄路－锦荣路－正阳西路－世茂公园美地－秀园路－河东路－创业大厦－聚贤桥路－暖融路－新地路－创业中心－四方车辆研究所－和融路－火炬支路－新业路'
      }, {
        Name: '766路（汽车北站－新韵路）',
        Intro: '售票方式：无人售票，季节性票价<br> 发车时间：05:50－21:00<br> 沿途站点：汽车北站－赵村－仙山西路－东蓝家庄－西后楼－花溪地－龙湖滟澜海岸－火炬路宝源路－广博路东站－广博路秀园路－广博路汇智桥路－创业大厦－智力岛中路－智力岛路－新韵路聚贤桥路－新韵路和融路－新韵路'
      }, {
        Name: '767路（汽车北站－新韵路）',
        Intro: '售票方式：无人售票，季节性票价<br> 发车时间：<br> 汽车北站 06:00－20:40<br> 新韵路 05:50－20:40<br> 沿途站点：汽车北站－安亭路－流亭街道－红埠－流亭医院－东流亭－流亭－高家台小区－流亭国际机场－宝安路－两江路－南城阳－庙头社区－世纪美居－中川路－锦城路－城阳西－城阳村－城子社区－城子－皂户小区－双元路－物流交易中心－和源路丰庆路－星雨华府－河东路华东路－河东路宝源路－河东路华贯路－河东路祥源路－秀园路－河东路－创业大厦－智力岛中路－智力岛路－新韵路聚贤桥路－新韵路和融路－新韵路'
      }, {
        Name: '770路（创业大厦－新韵路）',
        Intro: '售票方式：无人售票，票价1元<br> 发车时间：<br> 新韵路 06:30－20:00<br> 创业大厦 06:50－20:20<br> 沿途站点：创业大厦－汇智桥路南站－新业路南站－同顺路－同顺路北站－新业路聚贤桥路－海信模具南－新业路和融路－创业中心－新业路火炬支路－火炬路西站－新韵路'
      }, {
        Name: '771路（新韵路－创业大厦）',
        Intro: '售票方式：无人售票，票价1元<br> 发车时间：06:50－20:20<br> 沿途站点：新韵路－广博路－乐融路广博路－河东路乐融路－河东路和融路－河东路广盛路－河东路聚贤桥路－高新嘉园－高新企业加速器－创业大厦'
      }, {
        Name: '772路（锦业路－新韵路）',
        Intro: '售票方式：无人售票，票价1元<br> 发车时间：05:50－19:30<br> 沿途站点：锦业路－锦安路东站－和源路正阳西路－宝源路－华贯路丰年路－丰年路祥源路－世贸红墅湾－秀园路－河东路－创业大厦－智力岛路－新韵路聚贤桥路－新韵路和融路－新韵路'
      }, {
        Name: '高新快线（广博路－劲松一路）',
        Intro: '售票方式：无人售票，票价2元<br> 发车时间：07:15－20:15<br> 沿途站点：广博路－创业大厦－红岛－劲松一路'
      }
    ];
    this.busLineCollection_1 = new BusLineCollection(this.busLineModelArray_1);
    this.busListModel_1 = new BusListModel({
      Name: '创业大厦（汇智桥路西站）',
      BusLines: this.busLineCollection_1
    });
    this.busList_1 = new BusList({
      el: this.$('[data-businfo = bus-info-1]'),
      parent: this,
      model: this.busListModel_1
    });
    this.busLineModelArray_2 = [
      {
        Name: '761路（市政府－高新区停车场）',
        Intro: '售票方式：无人售票，票价2元<br> 发车时间：<br> 市政府 05:30－18:50<br> 高新区停车场 7:10－20:30<br> 沿途站点：市政府－江西路－图书馆－鞍山路－海泊桥－小村庄－四方长途站－双埠北－东蓝家庄－西后楼－花溪地－龙湖滟澜海岸－汇智桥路－火炬路－智力岛路－创业大厦－河东路－程戈庄－正阳西路－锦荣路－祥源路北站－华贯路－高新区停车场'
      }, {
        Name: '762路环线（新业路－高新区停车场）',
        Intro: '售票方式：无人售票，季节性票价<br> 发车时间：06:30－18:00<br> 沿途站点：新业路－新地路－暖融路－聚贤桥路－创业大厦－河东路－秀园路－世茂公园美地－正阳西路－锦荣路－锦暄路－思源路－科海路西站－科兴路西站－瑞源路－科兴路－科海路－祥源路北站－华贯路－高新区停车场'
      }, {
        Name: '766路（新韵路－汽车北站）',
        Intro: '售票方式：无人售票，季节性票价<br> 发车时间：05:50－21:00<br> 沿途站点：新韵路－新韵路和融路－新韵路聚贤桥路－智力岛路－智力岛中路－创业大厦－广博路汇智桥路－广博路秀园路－广博路东站－火炬路宝源路－龙湖滟澜海岸－花溪地－西后楼－东蓝家庄－仙山西路－赵村－汽车北站'
      }, {
        Name: '767路（新韵路－汽车北站）',
        Intro: '售票方式：无人售票，季节性票价<br> 发车时间：<br> 汽车北站 06:00－20:40<br> 新韵路 05:50－20:40<br> 沿途站点：新韵路－新韵路和融路－新韵路聚贤桥路－智力岛路－智力岛中路－创业大厦－河东路－秀园路－河东路祥源路－河东路华贯路－河东路宝源路－河东路华东路－星雨华府－和源路丰庆路－物流交易中心－双元路－皂户小区－城子－城子社区－城阳村－城阳西－锦城路－中川路－世纪美居－庙头社区－南城阳－两江路－宝安路－流亭国际机场－高家台小区－流亭－东流亭－流亭医院－红埠－流亭街道－安亭路－汽车北站'
      }, {
        Name: '770路（新韵路－创业大厦）',
        Intro: '售票方式：无人售票，票价1元<br> 发车时间：<br> 新韵路 06:30－20:00<br> 创业大厦 06:50－20:20<br> 沿途站点：新韵路－新业路火炬支路－创业中心－新业路和融路－海信模具南－新业路聚贤桥路－同顺路北站－同顺路－新业路南站－汇智桥路南站－创业大厦'
      }, {
        Name: '772路（新韵路－锦业路）',
        Intro: '售票方式：无人售票，票价1元<br> 发车时间：<br> 新韵路 05:55－19:30<br> 锦业路 06:30－20:05<br> 沿途站点：新韵路－新韵路和融路－新韵路聚贤桥路－智力岛路－创业大厦－河东路－秀园路－世贸红墅湾－丰年路祥源路－华贯路丰年路－宝源路－和源路正阳西路－和源路－锦业路'
      }, {
        Name: '高新快线（劲松一路－广博路）',
        Intro: '售票方式：无人售票，票价2元<br> 发车时间：06:00－19:00<br> 沿途站点：劲松一路－红岛－创业大厦－广博路'
      }
    ];
    this.busLineCollection_2 = new BusLineCollection(this.busLineModelArray_2);
    this.busListModel_2 = new BusListModel({
      Name: '创业大厦（汇智桥路东站）',
      BusLines: this.busLineCollection_2
    });
    return this.busList_2 = new BusList({
      el: this.$('[data-businfo = bus-info-2]'),
      parent: this,
      model: this.busListModel_2
    });
  };

  MapNav.prototype.clickBusStop1 = function(e) {
    return this.busList_1.show();
  };

  MapNav.prototype.clickBusStop2 = function(e) {
    return this.busList_2.show();
  };

  MapNav.prototype.clickEnterHall = function(e) {
    return this.root().router.navigate('#!/hall', {
      trigger: true
    });
  };

  return MapNav;

})(View);

module.exports = MapNav;



},{"../../model/bus-list":47,"../../model/bus-list/busline":45,"../../model/bus-list/buslines":46,"../bus-list":15,"./index.jade":24,"bamjs/view":6}],24:[function(require,module,exports){
var jade = require('jade/lib/runtime.js');
module.exports=function(params) { if (params) {params.require = require;} return (
function template(locals) {
var jade_debug = [{ lineno: 1, filename: "d:\\WORKS\\GIT\\SceneNav\\src\\components\\map-nav\\index.jade" }];
try {
var buf = [];
var jade_mixins = {};
var jade_interp;



buf.push("<div class=\"sitelogo\">");


buf.push("</div>");


buf.push("<div class=\"map-container\">");


buf.push("<div class=\"map-content\">");


buf.push("<div class=\"map-area\">");


buf.push("<div style=\"left: 1292px; top: 427px\" data-mappin=\"bus-stop-1\" class=\"map-pin-left\">");


buf.push(" ");


buf.push("<div class=\"map-pin-left-title\">");


buf.push("创业大厦站");


buf.push("<span>");


buf.push("&nbsp;点击看详情");


buf.push("</span>");


buf.push("</div>");


buf.push("</div>");


buf.push("<div style=\"left: 1164px; top: 564px\" data-mappin=\"bus-stop-2\" class=\"map-pin-left\">");


buf.push(" ");


buf.push("<div class=\"map-pin-left-title\">");


buf.push("创业大厦站");


buf.push("<span>");


buf.push("&nbsp;点击看详情");


buf.push("</span>");


buf.push("</div>");


buf.push("</div>");


buf.push("<div style=\"left: 710px; top: 514px\" data-mappin=\"enter-hall\" class=\"map-pin-right\">");


buf.push(" ");


buf.push("<div class=\"map-pin-right-title\">");


buf.push("点此进入高新区政务办理大厅");


buf.push("</div>");


buf.push("</div>");


buf.push("</div>");


buf.push("</div>");


buf.push("</div>");


buf.push("<div class=\"map-mobile-hint\">");


buf.push("</div>");


buf.push("<div data-businfo=\"bus-info-1\" class=\"businfo\">");


buf.push("</div>");


buf.push("<div data-businfo=\"bus-info-2\" class=\"businfo\">");


buf.push("</div>");

;return buf.join("");
} catch (err) {
  jade.rethrow(err, jade_debug[0].filename, jade_debug[0].lineno, ".sitelogo\r\n.map-container\r\n\t.map-content\r\n\t\t.map-area\r\n\t\t\t.map-pin-left(style = 'left: 1292px; top: 427px' data-mappin='bus-stop-1') \r\n\t\t\t\t.map-pin-left-title 创业大厦站\r\n\t\t\t\t\tspan &nbsp;点击看详情\r\n\t\t\t.map-pin-left(style = 'left: 1164px; top: 564px' data-mappin='bus-stop-2') \r\n\t\t\t\t.map-pin-left-title 创业大厦站\r\n\t\t\t\t\tspan &nbsp;点击看详情\r\n\t\t\t.map-pin-right(style = 'left: 710px; top: 514px' data-mappin='enter-hall') \r\n\t\t\t\t.map-pin-right-title 点此进入高新区政务办理大厅\r\n.map-mobile-hint\r\n.businfo(data-businfo = 'bus-info-1')\r\n.businfo(data-businfo = 'bus-info-2')\r\n");
}
}
)(params); }

},{"jade/lib/runtime.js":11}],25:[function(require,module,exports){
var MDataMaterials, MFormBtns, MatterGuideNodeTable, TableDownload, TableMaterials, View, tmpl,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

View = require('bamjs/view');

tmpl = require('./index.jade');

TableDownload = require('../table-download');

MFormBtns = require('../../model/mform-btn/collection');

TableMaterials = require('../table-materials');

MDataMaterials = require('../../model/mdata-material/collection');

MatterGuideNodeTable = (function(_super) {
  var namespace;

  __extends(MatterGuideNodeTable, _super);

  function MatterGuideNodeTable() {
    return MatterGuideNodeTable.__super__.constructor.apply(this, arguments);
  }

  namespace = 'matter-guide-node-table';

  MatterGuideNodeTable.prototype.setView = function() {
    this.$el.html(tmpl({
      model: this.model
    }));
    this.mDataMaterials = new MDataMaterials();
    this.mDataMaterials.url = this.model.getMaterials();
    this.mDataMaterials.fetch({
      success: function(collection, resp, options) {
        var newTM;
        newTM = new TableMaterials({
          el: $('#materials'),
          collection: collection
        });
        return newTM.setView();
      },
      error: function(collection, resp, options) {
        return alert('error: ' + resp.responseText);
      }
    });
    this.mFormBtns = new MFormBtns();
    this.mFormBtns.url = this.model.getForms();
    return this.mFormBtns.fetch({
      success: function(collection, resp, options) {
        var newTableDownload;
        newTableDownload = new TableDownload({
          el: $('#forms'),
          collection: collection
        });
        return newTableDownload.setView();
      },
      error: function(collection, resp, options) {
        return console.log('error', resp.responseText);
      }
    });
  };

  return MatterGuideNodeTable;

})(View);

module.exports = MatterGuideNodeTable;



},{"../../model/mdata-material/collection":54,"../../model/mform-btn/collection":57,"../table-download":41,"../table-materials":43,"./index.jade":26,"bamjs/view":6}],26:[function(require,module,exports){
var jade = require('jade/lib/runtime.js');
module.exports=function(params) { if (params) {params.require = require;} return (
function template(locals) {
var jade_debug = [{ lineno: 1, filename: "d:\\WORKS\\GIT\\SceneNav\\src\\components\\matter-guide-node-table\\index.jade" }];
try {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (model) {


buf.push("<div class=\"matter-infobox-corner\">");


buf.push("</div>");


buf.push("<div class=\"matter-infobox-content\">");


buf.push("<div class=\"row\">");


buf.push("<div class=\"col-1of1\">");


buf.push("<div class=\"col-content\">");


buf.push("<table class=\"table\">");


buf.push("<tr>");


buf.push("<td width=\"30%\" class=\"text-right\">");


buf.push("受理单位：");


buf.push("</td>");


buf.push("<td>" + (null == (jade_interp = model.getUnit()) ? "" : jade_interp));


buf.push("</td>");


buf.push("</tr>");


buf.push("<tr>");


buf.push("<td class=\"text-right\">");


buf.push("办理地点：");


buf.push("</td>");


buf.push("<td>" + (null == (jade_interp = model.getAddress()) ? "" : jade_interp));


buf.push("</td>");


buf.push("</tr>");


buf.push("<tr>");


buf.push("<td class=\"text-right\">");


buf.push("联系电话：");


buf.push("</td>");


buf.push("<td>" + (null == (jade_interp = model.getTel()) ? "" : jade_interp));


buf.push("</td>");


buf.push("</tr>");


buf.push("<tr>");


buf.push("<td class=\"text-right\">");


buf.push("办理期限：");


buf.push("</td>");


buf.push("<td>" + (null == (jade_interp = model.getTimeLimit()) ? "" : jade_interp));


buf.push("</td>");


buf.push("</tr>");


buf.push("<tr>");


buf.push("<td class=\"text-right\">");


buf.push("办理条件：");


buf.push("</td>");


buf.push("<td>" + (null == (jade_interp = model.getConditions()) ? "" : jade_interp));


buf.push("</td>");


buf.push("</tr>");


buf.push("<tr>");


buf.push("<td class=\"text-right\">");


buf.push("所需申办材料：");


buf.push("</td>");


buf.push("<td id=\"materials\">");


buf.push("</td>");


buf.push("</tr>");


buf.push("<tr>");


buf.push("<td class=\"text-right\">");


buf.push("设立依据：");


buf.push("</td>");


buf.push("<td>" + (null == (jade_interp = model.getBasis()) ? "" : jade_interp));


buf.push("</td>");


buf.push("</tr>");


buf.push("<tr>");


buf.push("<td class=\"text-right\">");


buf.push("表格下载：");


buf.push("</td>");


buf.push("<td id=\"forms\">");


buf.push("</td>");


buf.push("</tr>");


buf.push("</table>");


buf.push("</div>");


buf.push("</div>");


buf.push("</div>");


buf.push("</div>");

}.call(this,"model" in locals_for_with?locals_for_with.model:typeof model!=="undefined"?model:undefined));;return buf.join("");
} catch (err) {
  jade.rethrow(err, jade_debug[0].filename, jade_debug[0].lineno, ".matter-infobox-corner\r\n.matter-infobox-content\r\n\t.row\r\n\t\t.col-1of1\r\n\t\t\t.col-content\r\n\t\t\t\ttable.table\r\n\t\t\t\t\ttr\r\n\t\t\t\t\t\ttd.text-right(width = '30%') 受理单位：\r\n\t\t\t\t\t\ttd!= model.getUnit()\r\n\t\t\t\t\ttr\r\n\t\t\t\t\t\ttd.text-right 办理地点：\r\n\t\t\t\t\t\ttd!= model.getAddress()\r\n\t\t\t\t\ttr\r\n\t\t\t\t\t\ttd.text-right 联系电话：\r\n\t\t\t\t\t\ttd!= model.getTel()\r\n\t\t\t\t\ttr\r\n\t\t\t\t\t\ttd.text-right 办理期限：\r\n\t\t\t\t\t\ttd!= model.getTimeLimit()\r\n\t\t\t\t\ttr\r\n\t\t\t\t\t\ttd.text-right 办理条件：\r\n\t\t\t\t\t\ttd!= model.getConditions()\r\n\t\t\t\t\ttr\r\n\t\t\t\t\t\ttd.text-right 所需申办材料：\r\n\t\t\t\t\t\ttd(id = 'materials')\r\n\t\t\t\t\ttr\r\n\t\t\t\t\t\ttd.text-right 设立依据：\r\n\t\t\t\t\t\ttd!=model.getBasis()\r\n\t\t\t\t\ttr\r\n\t\t\t\t\t\ttd.text-right 表格下载：\r\n\t\t\t\t\t\ttd(id = 'forms')\r\n");
}
}
)(params); }

},{"jade/lib/runtime.js":11}],27:[function(require,module,exports){
var MDataTable, MatterGuideNode, MatterGuideNodeTable, View, tmpl,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

View = require('bamjs/view');

tmpl = require('./index.jade');

MatterGuideNodeTable = require('../matter-guide-node-table');

MDataTable = require('../../model/mdata-table');

MatterGuideNode = (function(_super) {
  var namespace;

  __extends(MatterGuideNode, _super);

  function MatterGuideNode() {
    return MatterGuideNode.__super__.constructor.apply(this, arguments);
  }

  namespace = 'matter-guide-node';

  MatterGuideNode.prototype.initialize = function() {
    return this.$el.html(tmpl());
  };

  MatterGuideNode.prototype.setHtmlView = function(data, dataType, levelId, reqValues) {
    var dataItem, i, _btns, _childData, _currentUrl, _i, _infoUrl, _j, _len, _name, _nodeType, _obj, _ref, _selectedName, _type;
    _selectedName = '';
    _currentUrl = '';
    _infoUrl = '';
    _btns = [];
    if (dataType === 'list') {
      for (i = _i = 0, _len = data.length; _i < _len; i = ++_i) {
        dataItem = data[i];
        if (levelId === 1) {
          _name = dataItem.getName();
          _type = dataItem.getType();
          _childData = dataItem.getChildData();
        } else {
          _name = dataItem['Name'];
          _type = dataItem['Type'];
          _childData = dataItem['ChildData'];
        }
        _obj = {
          Name: _name,
          Type: _type,
          ChildData: _childData,
          id: i
        };
        _btns.push(_obj);
      }
    }
    if (reqValues[levelId]) {
      _nodeType = 'selected';
      if (levelId === 1) {
        _selectedName = data[reqValues[levelId]].getName();
      } else if (levelId >= 2) {
        _selectedName = data[reqValues[levelId]]['Name'];
      }
    } else {
      _nodeType = 'end';
    }
    if (levelId === 1) {
      _currentUrl = reqValues[0];
    } else {
      for (i = _j = 1, _ref = levelId - 1; 1 <= _ref ? _j <= _ref : _j >= _ref; i = 1 <= _ref ? ++_j : --_j) {
        _currentUrl += '_' + reqValues[i];
      }
      _currentUrl = reqValues[0] + _currentUrl;
    }
    if (dataType === 'info') {
      _infoUrl = data;
      this.mDataTable = new MDataTable();
      this.mDataTable.url = _infoUrl;
      this.mDataTable.fetch({
        success: function(model, resp, options) {
          var newMGNT;
          $('#title_' + _currentUrl).html(model.getName());
          newMGNT = new MatterGuideNodeTable({
            el: $('#info_' + _currentUrl),
            model: model
          });
          return newMGNT.setView();
        },
        error: function(model, resp, options) {
          return alert('error' + resp.responseText);
        }
      });
    }
    return this.$el.html(tmpl({
      btns: _btns,
      headNumber: levelId,
      nodeType: _nodeType,
      dataType: dataType,
      selectedName: _selectedName,
      currentUrl: _currentUrl
    }));
  };

  return MatterGuideNode;

})(View);

module.exports = MatterGuideNode;



},{"../../model/mdata-table":56,"../matter-guide-node-table":25,"./index.jade":28,"bamjs/view":6}],28:[function(require,module,exports){
var jade = require('jade/lib/runtime.js');
module.exports=function(params) { if (params) {params.require = require;} return (
function template(locals) {
var jade_debug = [{ lineno: 1, filename: "d:\\WORKS\\GIT\\SceneNav\\src\\components\\matter-guide-node\\index.jade" }];
try {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (btns, currentUrl, dataType, headNumber, nodeType, selectedName, undefined) {


if ( nodeType == 'selected')
{


buf.push("<div class=\"matter-head sel\">");


buf.push("<div class=\"matter-head-number\">" + (null == (jade_interp = headNumber) ? "" : jade_interp));


buf.push("</div>");


buf.push("<div class=\"matter-head-text\">" + (null == (jade_interp = selectedName) ? "" : jade_interp));


buf.push("</div>");


buf.push("<div class=\"matter-head-tail\">");


buf.push("</div>");


buf.push("<div class=\"dotted-vline\">");


buf.push("</div>");


buf.push("<div class=\"matter-head-number-arrow\">");


buf.push("</div>");


buf.push("<a" + (jade.attr("href", '#!/matters/' + currentUrl, true, false)) + " class=\"btn-reselect\">");


buf.push("重选");


buf.push("</a>");


buf.push("</div>");


}


if ( nodeType == 'end')
{


if ( dataType == 'list')
{


buf.push("<div class=\"matter-head\">");


buf.push("<div class=\"matter-head-number\">" + (null == (jade_interp = headNumber) ? "" : jade_interp));


buf.push("</div>");


buf.push("<div class=\"matter-head-text\">");


buf.push("请从以下分类中选择：");


buf.push("</div>");


buf.push("<div class=\"matter-head-tail\">");


buf.push("</div>");


buf.push("<div class=\"dotted-vline\">");


buf.push("</div>");


buf.push("<div class=\"matter-head-number-arrow\">");


buf.push("</div>");


buf.push("</div>");


buf.push("<div class=\"matter-infobox\">");


buf.push("<div class=\"matter-infobox-corner\">");


buf.push("</div>");


buf.push("<div class=\"matter-infobox-content\">");


buf.push("<div class=\"row\">");


// iterate btns
;(function(){
  var $$obj = btns;
  if ('number' == typeof $$obj.length) {

    for (var i = 0, $$l = $$obj.length; i < $$l; i++) {
      var btn = $$obj[i];



buf.push("<div class=\"col-1of4 col-mobile-1of1\">");


buf.push("<div class=\"col-content\">");


if ((btn['Type'] == 'list' || btn['Type'] == 'info'))
{


buf.push("<a" + (jade.attr("href", '#!/matters/' + currentUrl + '_' + btn['id'], true, false)) + " class=\"btn-select-matter\">" + (null == (jade_interp = btn['Name']) ? "" : jade_interp));


buf.push("</a>");


}


if ((btn['Type'] == 'link'))
{


buf.push("<a" + (jade.attr("href", btn['ChildData'], true, false)) + " target=\"_blank\" class=\"btn-select-matter\">" + (null == (jade_interp = btn['Name']) ? "" : jade_interp));


buf.push("</a>");


}


buf.push("</div>");


buf.push("</div>");


    }

  } else {
    var $$l = 0;
    for (var i in $$obj) {
      $$l++;      var btn = $$obj[i];



buf.push("<div class=\"col-1of4 col-mobile-1of1\">");


buf.push("<div class=\"col-content\">");


if ((btn['Type'] == 'list' || btn['Type'] == 'info'))
{


buf.push("<a" + (jade.attr("href", '#!/matters/' + currentUrl + '_' + btn['id'], true, false)) + " class=\"btn-select-matter\">" + (null == (jade_interp = btn['Name']) ? "" : jade_interp));


buf.push("</a>");


}


if ((btn['Type'] == 'link'))
{


buf.push("<a" + (jade.attr("href", btn['ChildData'], true, false)) + " target=\"_blank\" class=\"btn-select-matter\">" + (null == (jade_interp = btn['Name']) ? "" : jade_interp));


buf.push("</a>");


}


buf.push("</div>");


buf.push("</div>");


    }

  }
}).call(this);



buf.push("</div>");


buf.push("</div>");


buf.push("</div>");


}


if ( dataType == 'info')
{


buf.push("<div class=\"matter-head\">");


buf.push("<div" + (jade.attr("id", 'title_'+currentUrl, true, false)) + " class=\"matter-head-text-2\">");


buf.push("</div>");


buf.push("<div class=\"matter-head-tail-2\">");


buf.push("</div>");


buf.push("<div class=\"dotted-vline\">");


buf.push("</div>");


buf.push("</div>");


buf.push("<div" + (jade.attr("id", 'info_'+currentUrl, true, false)) + " class=\"matter-infobox\">");


buf.push("</div>");


}


}

}.call(this,"btns" in locals_for_with?locals_for_with.btns:typeof btns!=="undefined"?btns:undefined,"currentUrl" in locals_for_with?locals_for_with.currentUrl:typeof currentUrl!=="undefined"?currentUrl:undefined,"dataType" in locals_for_with?locals_for_with.dataType:typeof dataType!=="undefined"?dataType:undefined,"headNumber" in locals_for_with?locals_for_with.headNumber:typeof headNumber!=="undefined"?headNumber:undefined,"nodeType" in locals_for_with?locals_for_with.nodeType:typeof nodeType!=="undefined"?nodeType:undefined,"selectedName" in locals_for_with?locals_for_with.selectedName:typeof selectedName!=="undefined"?selectedName:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
} catch (err) {
  jade.rethrow(err, jade_debug[0].filename, jade_debug[0].lineno, "if nodeType == 'selected'\r\n\t.matter-head.sel\r\n\t\t.matter-head-number!= headNumber\r\n\t\t.matter-head-text!= selectedName\r\n\t\t.matter-head-tail\r\n\t\t.dotted-vline\r\n\t\t.matter-head-number-arrow\r\n\t\ta.btn-reselect(href = '#!/matters/' + currentUrl) 重选\r\nif nodeType == 'end'\r\n\tif dataType == 'list'\r\n\t\t.matter-head\r\n\t\t\t.matter-head-number!= headNumber\r\n\t\t\t.matter-head-text 请从以下分类中选择：\r\n\t\t\t.matter-head-tail\r\n\t\t\t.dotted-vline\r\n\t\t\t.matter-head-number-arrow\r\n\t\t.matter-infobox\r\n\t\t\t.matter-infobox-corner\r\n\t\t\t.matter-infobox-content\r\n\t\t\t\t.row\r\n\t\t\t\t\tfor btn, i in btns\r\n\t\t\t\t\t\t.col-1of4.col-mobile-1of1\r\n\t\t\t\t\t\t\t.col-content\r\n\t\t\t\t\t\t\t\tif(btn['Type'] == 'list' || btn['Type'] == 'info')\r\n\t\t\t\t\t\t\t\t\ta.btn-select-matter(href = '#!/matters/' + currentUrl + '_' + btn['id'])!= btn['Name']\r\n\t\t\t\t\t\t\t\tif(btn['Type'] == 'link')\r\n\t\t\t\t\t\t\t\t\ta.btn-select-matter(href = btn['ChildData'] target = '_blank')!= btn['Name']\r\n\tif dataType == 'info'\r\n\t\t.matter-head\r\n\t\t\t.matter-head-text-2(id = 'title_'+currentUrl)\r\n\t\t\t.matter-head-tail-2\r\n\t\t\t.dotted-vline\r\n\t\t.matter-infobox(id = 'info_'+currentUrl)\r\n\r\n\t\t");
}
}
)(params); }

},{"jade/lib/runtime.js":11}],29:[function(require,module,exports){
var MatterDataCollection, MatterGuide, MatterGuideNode, View, tmpl,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

View = require('bamjs/view');

MatterGuideNode = require('../matter-guide-node');

MatterDataCollection = require('../../model/matter-data/collection');

tmpl = require('./index.jade');

MatterGuide = (function(_super) {
  var createMatterNodes, currentLevelNum, namespace;

  __extends(MatterGuide, _super);

  function MatterGuide() {
    return MatterGuide.__super__.constructor.apply(this, arguments);
  }

  namespace = 'matter-guide';

  currentLevelNum = 0;

  MatterGuide.prototype.events = {
    'touchstart .btn-reselect': 'onCssTouchStart',
    'touchstart .btn-select-matter': 'onCssTouchStart',
    'touchend .btn-reselect': 'onCssTouchEnd',
    'touchmove .btn-reselect': 'onCssTouchEnd',
    'touchend .btn-select-matter': 'onCssTouchEnd',
    'touchmove .btn-select-matter': 'onCssTouchEnd'
  };

  MatterGuide.prototype.initialize = function() {
    return this.$el.html(tmpl());
  };

  MatterGuide.prototype.buildMatterNode = function(reqValues) {
    if (!this.matterDataCollection) {
      this.matterDataCollection = new MatterDataCollection();
      this.matterDataCollection.url = 'data/matterData.json';
      return this.matterDataCollection.fetch({
        reset: true,
        success: function(collection, resp, options) {
          return createMatterNodes(reqValues, collection);
        },
        error: function(collection, resp, options) {
          return console.error('Fetch data failure：' + resp.responseText);
        }
      });
    } else {
      return createMatterNodes(reqValues, this.matterDataCollection);
    }
  };

  createMatterNodes = function(reqValues, dataCollection) {
    var i, _baseData, _buildNum, _currentData, _dataType, _i, _matterGuideNode, _totleNum;
    _currentData = _baseData = dataCollection.models;
    _totleNum = _buildNum = reqValues.length;
    if (currentLevelNum > _buildNum) {
      _totleNum = currentLevelNum;
    }
    for (i = _i = 1; 1 <= _totleNum ? _i <= _totleNum : _i >= _totleNum; i = 1 <= _totleNum ? ++_i : --_i) {
      if (i === 1) {
        _currentData = _baseData;
        _dataType = 'list';
      }
      if (i === 2) {
        if (_baseData[reqValues[1]]) {
          _dataType = _baseData[reqValues[1]].getType();
          _currentData = _baseData[reqValues[1]].getChildData();
        }
      }
      if (i >= 3) {
        if (_currentData[reqValues[i - 1]]) {
          _dataType = _currentData[reqValues[i - 1]]['Type'];
          _currentData = _currentData[reqValues[i - 1]]['ChildData'];
        }
      }
      if (i <= _buildNum) {
        if (!$('#level_' + i).html()) {
          $('#matter-guide-nodes').append('<div style="display:none;" id = "level_' + i + '"></div>');
        }
        _matterGuideNode = new MatterGuideNode({
          el: $('#level_' + i)
        });
        _matterGuideNode.setHtmlView(_currentData, _dataType, i, reqValues);
        $('#level_' + i).fadeIn(100);
      }
      if (i > _buildNum) {
        $('#level_' + i).fadeOut(100);
      }
    }
    return currentLevelNum = _buildNum;
  };

  MatterGuide.prototype.onCssTouchStart = function(e) {
    return $(e.target).addClass('touched');
  };

  MatterGuide.prototype.onCssTouchEnd = function(e) {
    return $(e.target).removeClass('touched');
  };

  return MatterGuide;

})(View);

module.exports = MatterGuide;



},{"../../model/matter-data/collection":50,"../matter-guide-node":27,"./index.jade":30,"bamjs/view":6}],30:[function(require,module,exports){
var jade = require('jade/lib/runtime.js');
module.exports=function(params) { if (params) {params.require = require;} return (
function template(locals) {
var jade_debug = [{ lineno: 1, filename: "d:\\WORKS\\GIT\\SceneNav\\src\\components\\matter-guide\\index.jade" }];
try {
var buf = [];
var jade_mixins = {};
var jade_interp;



buf.push("<div class=\"matter-guide-title\">");


buf.push("<div class=\"matter-guide-icon\">");


buf.push("</div>");


buf.push("<div class=\"matter-guide-text\">");


buf.push("<h2>");


buf.push("引导式导航");


buf.push("</h2>");


buf.push("<p>");


buf.push("不知道想要办理的事项属于哪个部门？您可以通过引导式导航，逐步筛选，找到要办理的事项");


buf.push("</p>");


buf.push("</div>");


buf.push("</div>");


buf.push("<div id=\"matter-guide-nodes\">");


buf.push("</div>");

;return buf.join("");
} catch (err) {
  jade.rethrow(err, jade_debug[0].filename, jade_debug[0].lineno, ".matter-guide-title\r\n\t.matter-guide-icon\r\n\t.matter-guide-text\r\n\t\th2 引导式导航\r\n\t\tp 不知道想要办理的事项属于哪个部门？您可以通过引导式导航，逐步筛选，找到要办理的事项\r\ndiv(id='matter-guide-nodes')\r\n\r\n\r\n\r\n\r\n\r\n");
}
}
)(params); }

},{"jade/lib/runtime.js":11}],31:[function(require,module,exports){
var MatterCollection, MatterList, View, tmpl,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

View = require('bamjs/view');

MatterCollection = require('../../model/matter-list/collection');

tmpl = require('./index.jade');

MatterList = (function(_super) {
  var namespace;

  __extends(MatterList, _super);

  function MatterList() {
    return MatterList.__super__.constructor.apply(this, arguments);
  }

  namespace = 'matter-list';

  MatterList.prototype.initialize = function() {
    return this.collection.on('reset', function() {
      return this.render();
    }, this);
  };

  MatterList.prototype.render = function() {
    return this.$el.html(tmpl({
      matterCollection: this.collection
    }));
  };

  return MatterList;

})(View);

module.exports = MatterList;



},{"../../model/matter-list/collection":52,"./index.jade":32,"bamjs/view":6}],32:[function(require,module,exports){
var jade = require('jade/lib/runtime.js');
module.exports=function(params) { if (params) {params.require = require;} return (
function template(locals) {
var jade_debug = [{ lineno: 1, filename: "d:\\WORKS\\GIT\\SceneNav\\src\\components\\matter-list\\index.jade" }];
try {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (matterCollection, undefined) {


buf.push("<ul class=\"ulist\">");


var matters = matterCollection.models


// iterate matters
;(function(){
  var $$obj = matters;
  if ('number' == typeof $$obj.length) {

    for (var i = 0, $$l = $$obj.length; i < $$l; i++) {
      var matter = $$obj[i];



buf.push("<li>");


buf.push("<a" + (jade.attr("href", matter.getLink(), true, false)) + " class=\"ulist-content\">" + (null == (jade_interp = matter.getInfo()) ? "" : jade_interp));


buf.push("<div class=\"ulist-dot\">");


buf.push("</div>");




buf.push("</a>");


buf.push("</li>");


    }

  } else {
    var $$l = 0;
    for (var i in $$obj) {
      $$l++;      var matter = $$obj[i];



buf.push("<li>");


buf.push("<a" + (jade.attr("href", matter.getLink(), true, false)) + " class=\"ulist-content\">" + (null == (jade_interp = matter.getInfo()) ? "" : jade_interp));


buf.push("<div class=\"ulist-dot\">");


buf.push("</div>");




buf.push("</a>");


buf.push("</li>");


    }

  }
}).call(this);



buf.push("</ul>");

}.call(this,"matterCollection" in locals_for_with?locals_for_with.matterCollection:typeof matterCollection!=="undefined"?matterCollection:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
} catch (err) {
  jade.rethrow(err, jade_debug[0].filename, jade_debug[0].lineno, "ul.ulist\r\n\t- var matters = matterCollection.models\r\n\tfor matter,i in matters\r\n\t\tli\r\n\t\t\ta.ulist-content(href=matter.getLink())!= matter.getInfo()\r\n\t\t\t\t.ulist-dot");
}
}
)(params); }

},{"jade/lib/runtime.js":11}],33:[function(require,module,exports){
var Nav, View, tmpl, _,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

View = require('bamjs/view');

_ = require('underscore');

tmpl = require('./index.jade');

Nav = (function(_super) {
  var currentPage, namespace, navPages;

  __extends(Nav, _super);

  function Nav() {
    return Nav.__super__.constructor.apply(this, arguments);
  }

  namespace = 'nav';

  currentPage = null;

  navPages = ['home', 'matters'];

  Nav.prototype.events = {
    'click [data-nav = home]': 'clickHome',
    'click [data-nav = matters]': 'clickMatters',
    'click [data-nav = wsbs]': 'clickWSBS',
    'click [data-nav = lslp]': 'clickLSLP',
    'click [data-nav = lslp-sub1]': 'clickLSLP1',
    'click [data-nav = lslp-sub2]': 'clickLSLP2',
    'click [data-nav = hdjl]': 'clickHDJL'
  };

  Nav.prototype.initialize = function() {
    return this.$el.html(tmpl());
  };

  Nav.prototype.clickHome = function(e) {
    if (!$('[data-nav = home]').hasClass('sel')) {
      this.changeNavSel('home');
      return this.root().router.navigate('#!/', {
        trigger: true
      });
    }
  };

  Nav.prototype.clickMatters = function(e) {
    if (!$('[data-nav = matters]').hasClass('sel')) {
      this.changeNavSel('matters');
      return this.root().router.navigate('#!/matters/mNode', {
        trigger: true
      });
    }
  };

  Nav.prototype.clickWSBS = function(e) {
    return alert('建设中');
  };

  Nav.prototype.clickLSLP = function(e) {
    if ($('[data-nav = lslp-sub]').css('display') === 'none') {
      $('[data-nav = lslp-sub]').fadeIn(100);
      $(document).one('click', function() {
        return $('[data-nav = lslp-sub]').fadeOut(100);
      });
    } else {
      $('[data-nav = lslp-sub]').fadeOut(100);
    }
    return e.stopImmediatePropagation();
  };

  Nav.prototype.clickLSLP1 = function(e) {
    return alert('建设中');
  };

  Nav.prototype.clickLSLP2 = function(e) {
    return alert('建设中');
  };

  Nav.prototype.clickHDJL = function(e) {
    return alert('建设中');
  };

  Nav.prototype.changeNavSel = function(pageName) {
    if (_.find(navPages, function(navstring) {
      return navstring === pageName;
    })) {
      if (pageName !== currentPage) {
        this.$("[data-nav='" + pageName + "']").addClass('sel');
        if (currentPage) {
          this.$("[data-nav='" + currentPage + "']").removeClass('sel');
        }
        return currentPage = pageName;
      }
    }
  };

  return Nav;

})(View);

module.exports = Nav;



},{"./index.jade":34,"bamjs/view":6,"underscore":12}],34:[function(require,module,exports){
var jade = require('jade/lib/runtime.js');
module.exports=function(params) { if (params) {params.require = require;} return (
function template(locals) {
var jade_debug = [{ lineno: 1, filename: "d:\\WORKS\\GIT\\SceneNav\\src\\components\\nav\\index.jade" }];
try {
var buf = [];
var jade_mixins = {};
var jade_interp;



buf.push("<ul>");


buf.push("<li data-nav=\"wsbs\">");


buf.push("<div class=\"nav-sel\">");


buf.push("</div>");


buf.push("<div class=\"nav-icon nav-icon-1\">");


buf.push("</div>");


buf.push("<div class=\"nav-text\">");


buf.push("网上办事");


buf.push("</div>");


buf.push("</li>");


buf.push("<li data-nav=\"lslp\">");


buf.push("<div class=\"nav-sel\">");


buf.push("</div>");


buf.push("<div class=\"nav-icon nav-icon-2\">");


buf.push("</div>");


buf.push("<div class=\"nav-text\">");


buf.push("联审联批");


buf.push("</div>");


buf.push("<div data-nav=\"lslp-sub\" class=\"nav-sub\">");


buf.push("<div class=\"nav-sub-arrow\">");


buf.push("</div>");


buf.push("<div data-nav=\"lslp-sub1\" class=\"nav-sub-btn\">");


buf.push("市场主体设立联审联批");


buf.push("</div>");


buf.push("<div data-nav=\"lslp-sub2\" class=\"nav-sub-btn\">");


buf.push("建设工程项目联审联批");


buf.push("</div>");


buf.push("</div>");


buf.push("</li>");


buf.push("<li data-nav=\"home\">");


buf.push("<div class=\"nav-sel\">");


buf.push("</div>");


buf.push("<div class=\"nav-icon nav-icon-3\">");


buf.push("</div>");


buf.push("<div class=\"nav-text\">");


buf.push("场景导航");


buf.push("</div>");


buf.push("</li>");


buf.push("<li data-nav=\"matters\">");


buf.push("<div class=\"nav-sel\">");


buf.push("</div>");


buf.push("<div class=\"nav-icon nav-icon-4\">");


buf.push("</div>");


buf.push("<div class=\"nav-text\">");


buf.push("办事导航");


buf.push("</div>");


buf.push("</li>");


buf.push("<li data-nav=\"hdjl\">");


buf.push("<div class=\"nav-sel\">");


buf.push("</div>");


buf.push("<div class=\"nav-icon nav-icon-5\">");


buf.push("</div>");


buf.push("<div class=\"nav-text\">");


buf.push("互动交流");


buf.push("</div>");


buf.push("</li>");


buf.push("</ul>");

;return buf.join("");
} catch (err) {
  jade.rethrow(err, jade_debug[0].filename, jade_debug[0].lineno, "ul\r\n\tli(data-nav='wsbs')\r\n\t\t.nav-sel\r\n\t\t.nav-icon.nav-icon-1\r\n\t\t.nav-text 网上办事\r\n\tli(data-nav='lslp')\r\n\t\t.nav-sel\r\n\t\t.nav-icon.nav-icon-2\r\n\t\t.nav-text 联审联批\r\n\t\t.nav-sub(data-nav='lslp-sub')\r\n\t\t\t.nav-sub-arrow\r\n\t\t\t.nav-sub-btn(data-nav='lslp-sub1') 市场主体设立联审联批\r\n\t\t\t.nav-sub-btn(data-nav='lslp-sub2') 建设工程项目联审联批\r\n\tli(data-nav='home')\r\n\t\t.nav-sel\r\n\t\t.nav-icon.nav-icon-3\r\n\t\t.nav-text 场景导航\r\n\tli(data-nav='matters')\r\n\t\t.nav-sel\r\n\t\t.nav-icon.nav-icon-4\r\n\t\t.nav-text 办事导航\r\n\tli(data-nav='hdjl')\r\n\t\t.nav-sel\r\n\t\t.nav-icon.nav-icon-5\r\n\t\t.nav-text 互动交流\r\n");
}
}
)(params); }

},{"jade/lib/runtime.js":11}],35:[function(require,module,exports){
var MapHall, PageHall, View, tmpl,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

View = require('bamjs/view');

MapHall = require('../map-hall');

tmpl = require('./index.jade');

PageHall = (function(_super) {
  var namespace;

  __extends(PageHall, _super);

  function PageHall() {
    return PageHall.__super__.constructor.apply(this, arguments);
  }

  namespace = 'page-hall';

  PageHall.prototype.initialize = function() {
    this.$el.html(tmpl());
    return this.maphall = new MapHall({
      el: this.$('.page-hall'),
      parent: this
    });
  };

  PageHall.prototype.hide = function() {
    return this.$el.addClass('hidden');
  };

  PageHall.prototype.show = function() {
    return this.$el.removeClass('hidden');
  };

  return PageHall;

})(View);

module.exports = PageHall;



},{"../map-hall":21,"./index.jade":36,"bamjs/view":6}],36:[function(require,module,exports){
var jade = require('jade/lib/runtime.js');
module.exports=function(params) { if (params) {params.require = require;} return (
function template(locals) {
var jade_debug = [{ lineno: 1, filename: "d:\\WORKS\\GIT\\SceneNav\\src\\components\\page-hall\\index.jade" }];
try {
var buf = [];
var jade_mixins = {};
var jade_interp;



buf.push("<div class=\"page-hall\">");


buf.push("</div>");

;return buf.join("");
} catch (err) {
  jade.rethrow(err, jade_debug[0].filename, jade_debug[0].lineno, ".page-hall");
}
}
)(params); }

},{"jade/lib/runtime.js":11}],37:[function(require,module,exports){
var MapNav, PageHome, View, tmpl,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

View = require('bamjs/view');

MapNav = require('../map-nav');

tmpl = require('./index.jade');

PageHome = (function(_super) {
  var namespace;

  __extends(PageHome, _super);

  function PageHome() {
    return PageHome.__super__.constructor.apply(this, arguments);
  }

  namespace = 'page-home';

  PageHome.prototype.initialize = function() {
    this.$el.html(tmpl());
    return this.mapnav = new MapNav({
      el: this.$('.map-nav'),
      parent: this
    });
  };

  PageHome.prototype.hide = function() {
    return this.$el.addClass('hidden');
  };

  PageHome.prototype.show = function() {
    return this.$el.removeClass('hidden');
  };

  return PageHome;

})(View);

module.exports = PageHome;



},{"../map-nav":23,"./index.jade":38,"bamjs/view":6}],38:[function(require,module,exports){
var jade = require('jade/lib/runtime.js');
module.exports=function(params) { if (params) {params.require = require;} return (
function template(locals) {
var jade_debug = [{ lineno: 1, filename: "d:\\WORKS\\GIT\\SceneNav\\src\\components\\page-home\\index.jade" }];
try {
var buf = [];
var jade_mixins = {};
var jade_interp;



buf.push("<div class=\"page-home\">");


buf.push("<div class=\"map-nav\">");


buf.push("</div>");


buf.push("</div>");

;return buf.join("");
} catch (err) {
  jade.rethrow(err, jade_debug[0].filename, jade_debug[0].lineno, ".page-home\r\n\t.map-nav");
}
}
)(params); }

},{"jade/lib/runtime.js":11}],39:[function(require,module,exports){
var MatterCollection, MatterGuide, MatterList, MatterModel, PageMatters, View, tmpl,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

View = require('bamjs/view');

tmpl = require('./index.jade');

MatterList = require('../matter-list');

MatterGuide = require('../matter-guide');

MatterModel = require('../../model/matter-list');

MatterCollection = require('../../model/matter-list/collection');

PageMatters = (function(_super) {
  var namespace;

  __extends(PageMatters, _super);

  function PageMatters() {
    return PageMatters.__super__.constructor.apply(this, arguments);
  }

  namespace = 'page-matters';

  PageMatters.prototype.events = {
    'click #btn_bgxz': 'onBtnBGXZ',
    'click #btn_yksl': 'onBtnYKSL',
    'click #list_rmsx': 'onListRMSX',
    'click #list_kstd': 'onListKSTD'
  };

  PageMatters.prototype.initialize = function() {
    this.$el.html(tmpl());
    this.rmsxCollection = new MatterCollection();
    this.rmsxCollection.url = 'data/list_rmsx.json';
    this.rmsxCollection.fetch({
      reset: true,
      error: function(collection, response) {
        return console.info("error" + ":" + response.responseText);
      }
    });
    this.rmsxlist = new MatterList({
      el: this.$('#list_rmsx_content'),
      parent: this,
      collection: this.rmsxCollection
    });
    this.kstdCollection = new MatterCollection();
    this.kstdCollection.url = 'data/list_kstd.json';
    this.kstdCollection.fetch({
      reset: true,
      error: function(collection, response) {
        return console.info("error" + ":" + response.responseText);
      }
    });
    this.kstdlist = new MatterList({
      el: this.$('#list_kstd_content'),
      parent: this,
      collection: this.kstdCollection
    });
    return this.matterguide = new MatterGuide({
      el: this.$('#matter_guide'),
      parent: this
    });
  };

  PageMatters.prototype.setMatterGuide = function(reqValues) {
    return this.matterguide.buildMatterNode(reqValues);
  };

  PageMatters.prototype.onBtnBGXZ = function(e) {
    return alert('建设中');
  };

  PageMatters.prototype.onBtnYKSL = function(e) {
    return alert('建设中');
  };

  PageMatters.prototype.onListRMSX = function(e) {
    this.$('#list_rmsx_content').toggleClass('mobile-hidden');
    this.$('#list_rmsx_arrow').toggleClass('box-title-arrow-down');
    return this.$('#list_rmsx_arrow').toggleClass('box-title-arrow-up');
  };

  PageMatters.prototype.onListKSTD = function(e) {
    this.$('#list_kstd_content').toggleClass('mobile-hidden');
    this.$('#list_kstd_arrow').toggleClass('box-title-arrow-down');
    return this.$('#list_kstd_arrow').toggleClass('box-title-arrow-up');
  };

  PageMatters.prototype.hide = function() {
    return this.$el.addClass('hidden');
  };

  PageMatters.prototype.show = function() {
    return this.$el.removeClass('hidden');
  };

  return PageMatters;

})(View);

module.exports = PageMatters;



},{"../../model/matter-list":53,"../../model/matter-list/collection":52,"../matter-guide":29,"../matter-list":31,"./index.jade":40,"bamjs/view":6}],40:[function(require,module,exports){
var jade = require('jade/lib/runtime.js');
module.exports=function(params) { if (params) {params.require = require;} return (
function template(locals) {
var jade_debug = [{ lineno: 1, filename: "d:\\WORKS\\GIT\\SceneNav\\src\\components\\page-matters\\index.jade" }];
try {
var buf = [];
var jade_mixins = {};
var jade_interp;



buf.push("<div class=\"page-matters\">");


buf.push("<div class=\"row-container\">");


buf.push("<div class=\"row-content\">");


buf.push("<div class=\"row\">");


buf.push("<div class=\"col-1of4 col-mobile-1of1\">");


buf.push("<div class=\"col-1of1\">");


buf.push("<div class=\"col-1of2\">");


buf.push("<div class=\"col-content\">");


buf.push("<div id=\"btn_bgxz\" class=\"btn-BGXZ\">");


buf.push("表格下载");


buf.push("</div>");


buf.push("</div>");


buf.push("</div>");


buf.push("<div class=\"col-1of2\">");


buf.push("<div class=\"col-content\">");


buf.push("<div id=\"btn_yksl\" class=\"btn-YKSL\">");


buf.push("一口受理");


buf.push("</div>");


buf.push("</div>");


buf.push("</div>");


buf.push("</div>");


buf.push("<div class=\"col-1of1\">");


buf.push("<div class=\"col-content\">");


buf.push("<div id=\"list_rmsx\" class=\"box-title\">");


buf.push("<div class=\"box-title-text\">");


buf.push("热门事项");


buf.push("</div>");


buf.push("<div id=\"list_rmsx_arrow\" class=\"box-title-arrow-down\">");


buf.push("</div>");


buf.push("</div>");


buf.push("<div id=\"list_rmsx_content\" class=\"box-content mobile-hidden\">");


buf.push("</div>");


buf.push("</div>");


buf.push("<div class=\"col-content\">");


buf.push("<div id=\"list_kstd\" class=\"box-title\">");


buf.push("<div class=\"box-title-text\">");


buf.push("快速通道");


buf.push("</div>");


buf.push("<div id=\"list_kstd_arrow\" class=\"box-title-arrow-down\">");


buf.push("</div>");


buf.push("</div>");


buf.push("<div id=\"list_kstd_content\" class=\"box-content mobile-hidden\">");


buf.push("</div>");


buf.push("</div>");


buf.push("</div>");


buf.push("</div>");


buf.push("<div class=\"col-3of4 col-mobile-1of1\">");


buf.push("<div class=\"col-content\">");


buf.push("<div id=\"matter_guide\">");


buf.push("</div>");


buf.push("</div>");


buf.push("</div>");


buf.push("</div>");


buf.push("</div>");


buf.push("</div>");


buf.push("</div>");

;return buf.join("");
} catch (err) {
  jade.rethrow(err, jade_debug[0].filename, jade_debug[0].lineno, ".page-matters\r\n\t.row-container\r\n\t\t.row-content\r\n\t\t\t.row\r\n\t\t\t\t.col-1of4.col-mobile-1of1\r\n\t\t\t\t\t.col-1of1\r\n\t\t\t\t\t\t.col-1of2\r\n\t\t\t\t\t\t\t.col-content\r\n\t\t\t\t\t\t\t\t.btn-BGXZ(id='btn_bgxz') 表格下载\r\n\t\t\t\t\t\t.col-1of2\r\n\t\t\t\t\t\t\t.col-content\r\n\t\t\t\t\t\t\t\t.btn-YKSL(id='btn_yksl') 一口受理\r\n\t\t\t\t\t.col-1of1\r\n\t\t\t\t\t\t.col-content\r\n\t\t\t\t\t\t\t.box-title(id='list_rmsx')\r\n\t\t\t\t\t\t\t\t.box-title-text 热门事项\r\n\t\t\t\t\t\t\t\t.box-title-arrow-down(id='list_rmsx_arrow')\r\n\t\t\t\t\t\t\t.box-content.mobile-hidden(id='list_rmsx_content')\r\n\t\t\t\t\t\t.col-content\r\n\t\t\t\t\t\t\t.box-title(id='list_kstd')\r\n\t\t\t\t\t\t\t\t.box-title-text 快速通道\r\n\t\t\t\t\t\t\t\t.box-title-arrow-down(id='list_kstd_arrow')\r\n\t\t\t\t\t\t\t.box-content.mobile-hidden(id='list_kstd_content')\r\n\t\t\t\t.col-3of4.col-mobile-1of1\r\n\t\t\t\t\t.col-content\r\n\t\t\t\t\t\tdiv(id='matter_guide')");
}
}
)(params); }

},{"jade/lib/runtime.js":11}],41:[function(require,module,exports){
var TableDownload, View, tmpl,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

View = require('bamjs/view');

tmpl = require('./index.jade');

TableDownload = (function(_super) {
  var namespace;

  __extends(TableDownload, _super);

  function TableDownload() {
    return TableDownload.__super__.constructor.apply(this, arguments);
  }

  namespace = 'table-download';

  TableDownload.prototype.setView = function() {
    return this.$el.html(tmpl({
      collection: this.collection
    }));
  };

  return TableDownload;

})(View);

module.exports = TableDownload;



},{"./index.jade":42,"bamjs/view":6}],42:[function(require,module,exports){
var jade = require('jade/lib/runtime.js');
module.exports=function(params) { if (params) {params.require = require;} return (
function template(locals) {
var jade_debug = [{ lineno: 1, filename: "d:\\WORKS\\GIT\\SceneNav\\src\\components\\table-download\\index.jade" }];
try {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (collection, undefined) {


var links = collection.models


// iterate links
;(function(){
  var $$obj = links;
  if ('number' == typeof $$obj.length) {

    for (var i = 0, $$l = $$obj.length; i < $$l; i++) {
      var link = $$obj[i];



buf.push("<a" + (jade.attr("href", link.getUrl(), true, false)) + ">" + (null == (jade_interp = link.getName()) ? "" : jade_interp));


buf.push("</a>");


    }

  } else {
    var $$l = 0;
    for (var i in $$obj) {
      $$l++;      var link = $$obj[i];



buf.push("<a" + (jade.attr("href", link.getUrl(), true, false)) + ">" + (null == (jade_interp = link.getName()) ? "" : jade_interp));


buf.push("</a>");


    }

  }
}).call(this);


}.call(this,"collection" in locals_for_with?locals_for_with.collection:typeof collection!=="undefined"?collection:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
} catch (err) {
  jade.rethrow(err, jade_debug[0].filename, jade_debug[0].lineno, "- var links = collection.models\r\nfor link,i in links\r\n\ta(href = link.getUrl())!= link.getName()");
}
}
)(params); }

},{"jade/lib/runtime.js":11}],43:[function(require,module,exports){
var TableMaterials, View, tmpl,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

View = require('bamjs/view');

tmpl = require('./index.jade');

TableMaterials = (function(_super) {
  var namespace;

  __extends(TableMaterials, _super);

  function TableMaterials() {
    return TableMaterials.__super__.constructor.apply(this, arguments);
  }

  namespace = 'table-materials';

  TableMaterials.prototype.setView = function() {
    return this.$el.html(tmpl({
      collection: this.collection
    }));
  };

  return TableMaterials;

})(View);

module.exports = TableMaterials;



},{"./index.jade":44,"bamjs/view":6}],44:[function(require,module,exports){
var jade = require('jade/lib/runtime.js');
module.exports=function(params) { if (params) {params.require = require;} return (
function template(locals) {
var jade_debug = [{ lineno: 1, filename: "d:\\WORKS\\GIT\\SceneNav\\src\\components\\table-materials\\index.jade" }];
try {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (collection, undefined) {


var strings = collection.models


// iterate strings
;(function(){
  var $$obj = strings;
  if ('number' == typeof $$obj.length) {

    for (var i = 0, $$l = $$obj.length; i < $$l; i++) {
      var string = $$obj[i];



buf.push("<div class=\"material\">" + (null == (jade_interp = string.getName()) ? "" : jade_interp));


buf.push("</div>");


    }

  } else {
    var $$l = 0;
    for (var i in $$obj) {
      $$l++;      var string = $$obj[i];



buf.push("<div class=\"material\">" + (null == (jade_interp = string.getName()) ? "" : jade_interp));


buf.push("</div>");


    }

  }
}).call(this);


}.call(this,"collection" in locals_for_with?locals_for_with.collection:typeof collection!=="undefined"?collection:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
} catch (err) {
  jade.rethrow(err, jade_debug[0].filename, jade_debug[0].lineno, "- var strings = collection.models\r\nfor string,i in strings\r\n\t.material!= string.getName()");
}
}
)(params); }

},{"jade/lib/runtime.js":11}],45:[function(require,module,exports){
var BusLine, Model,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

Model = require('bamjs/backbone').Model;

BusLine = (function(_super) {
  __extends(BusLine, _super);

  function BusLine() {
    return BusLine.__super__.constructor.apply(this, arguments);
  }

  BusLine.prototype.defaults = {
    Name: '',
    Intro: ''
  };

  BusLine.prototype.getName = function() {
    return this.get('Name');
  };

  BusLine.prototype.getIntro = function() {
    return this.get('Intro');
  };

  return BusLine;

})(Model);

module.exports = BusLine;



},{"bamjs/backbone":2}],46:[function(require,module,exports){
var BusLine, BusLines, Collection,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

Collection = require('bamjs/backbone').Collection;

BusLine = require('./busline');

BusLines = (function(_super) {
  __extends(BusLines, _super);

  function BusLines() {
    return BusLines.__super__.constructor.apply(this, arguments);
  }

  BusLines.prototype.model = BusLine;

  return BusLines;

})(Collection);

module.exports = BusLines;



},{"./busline":45,"bamjs/backbone":2}],47:[function(require,module,exports){
var BusList, Model,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

Model = require('bamjs/backbone').Model;

BusList = (function(_super) {
  __extends(BusList, _super);

  function BusList() {
    return BusList.__super__.constructor.apply(this, arguments);
  }

  BusList.prototype.defaults = {
    Name: '',
    BusLines: null
  };

  BusList.prototype.getName = function() {
    return this.get('Name');
  };

  BusList.prototype.getBusLines = function() {
    return this.get('BusLines');
  };

  return BusList;

})(Model);

module.exports = BusList;



},{"bamjs/backbone":2}],48:[function(require,module,exports){
var Collection, MapHallBtnCollection, MapHallBtnModel,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

Collection = require('bamjs/backbone').Collection;

MapHallBtnModel = require('./');

MapHallBtnCollection = (function(_super) {
  __extends(MapHallBtnCollection, _super);

  function MapHallBtnCollection() {
    return MapHallBtnCollection.__super__.constructor.apply(this, arguments);
  }

  MapHallBtnCollection.prototype.model = MapHallBtnModel;

  return MapHallBtnCollection;

})(Collection);

module.exports = MapHallBtnCollection;



},{"./":49,"bamjs/backbone":2}],49:[function(require,module,exports){
var MapHallBtnModel, Model,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

Model = require('bamjs/backbone').Model;

MapHallBtnModel = (function(_super) {
  __extends(MapHallBtnModel, _super);

  function MapHallBtnModel() {
    return MapHallBtnModel.__super__.constructor.apply(this, arguments);
  }

  MapHallBtnModel.prototype.defaults = {
    Number: 0,
    Name: '',
    Direction: '',
    Xpos: '',
    Ypos: '',
    Link: ''
  };

  MapHallBtnModel.prototype.getNumber = function() {
    return this.get('Number');
  };

  MapHallBtnModel.prototype.getName = function() {
    return this.get('Name');
  };

  MapHallBtnModel.prototype.getDirection = function() {
    return this.get('Direction');
  };

  MapHallBtnModel.prototype.getXpos = function() {
    return this.get('Xpos');
  };

  MapHallBtnModel.prototype.getYpos = function() {
    return this.get('Ypos');
  };

  MapHallBtnModel.prototype.getLink = function() {
    return this.get('Link');
  };

  return MapHallBtnModel;

})(Model);

module.exports = MapHallBtnModel;



},{"bamjs/backbone":2}],50:[function(require,module,exports){
var Collection, MatterData, MatterDataCollection,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

Collection = require('bamjs/backbone').Collection;

MatterData = require('./');

MatterDataCollection = (function(_super) {
  __extends(MatterDataCollection, _super);

  function MatterDataCollection() {
    return MatterDataCollection.__super__.constructor.apply(this, arguments);
  }

  MatterDataCollection.prototype.model = MatterData;

  return MatterDataCollection;

})(Collection);

module.exports = MatterDataCollection;



},{"./":51,"bamjs/backbone":2}],51:[function(require,module,exports){
var MatterData, Model,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

Model = require('bamjs/backbone').Model;

MatterData = (function(_super) {
  __extends(MatterData, _super);

  function MatterData() {
    return MatterData.__super__.constructor.apply(this, arguments);
  }

  MatterData.prototype.defaults = {
    Name: '',
    Type: '',
    ChildData: ''
  };

  MatterData.prototype.getName = function() {
    return this.get('Name');
  };

  MatterData.prototype.getType = function() {
    return this.get('Type');
  };

  MatterData.prototype.getChildData = function() {
    return this.get('ChildData');
  };

  return MatterData;

})(Model);

module.exports = MatterData;



},{"bamjs/backbone":2}],52:[function(require,module,exports){
var Collection, Matter, Matters,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

Collection = require('bamjs/backbone').Collection;

Matter = require('./');

Matters = (function(_super) {
  __extends(Matters, _super);

  function Matters() {
    return Matters.__super__.constructor.apply(this, arguments);
  }

  Matters.prototype.model = Matter;

  return Matters;

})(Collection);

module.exports = Matters;



},{"./":53,"bamjs/backbone":2}],53:[function(require,module,exports){
var Matter, Model,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

Model = require('bamjs/backbone').Model;

Matter = (function(_super) {
  __extends(Matter, _super);

  function Matter() {
    return Matter.__super__.constructor.apply(this, arguments);
  }

  Matter.prototype.defaults = {
    Info: '',
    Link: ''
  };

  Matter.prototype.getInfo = function() {
    return this.get('Info');
  };

  Matter.prototype.getLink = function() {
    return this.get('Link');
  };

  return Matter;

})(Model);

module.exports = Matter;



},{"bamjs/backbone":2}],54:[function(require,module,exports){
var Collection, MDataMaterial, MDataMaterials,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

Collection = require('bamjs/backbone').Collection;

MDataMaterial = require('./');

MDataMaterials = (function(_super) {
  __extends(MDataMaterials, _super);

  function MDataMaterials() {
    return MDataMaterials.__super__.constructor.apply(this, arguments);
  }

  MDataMaterials.prototype.model = MDataMaterial;

  return MDataMaterials;

})(Collection);

module.exports = MDataMaterials;



},{"./":55,"bamjs/backbone":2}],55:[function(require,module,exports){
var MDataMaterial, Model,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

Model = require('bamjs/backbone').Model;

MDataMaterial = (function(_super) {
  __extends(MDataMaterial, _super);

  function MDataMaterial() {
    return MDataMaterial.__super__.constructor.apply(this, arguments);
  }

  MDataMaterial.prototype.defaults = {
    Name: ''
  };

  MDataMaterial.prototype.getName = function() {
    return this.get('Name');
  };

  return MDataMaterial;

})(Model);

module.exports = MDataMaterial;



},{"bamjs/backbone":2}],56:[function(require,module,exports){
var MDataTable, Model,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

Model = require('bamjs/backbone').Model;

MDataTable = (function(_super) {
  __extends(MDataTable, _super);

  function MDataTable() {
    return MDataTable.__super__.constructor.apply(this, arguments);
  }

  MDataTable.prototype.defaults = {
    dic_name: '',
    id: '',
    AcceptDept: '',
    Address: '',
    Tel: '',
    PromiseTimeLimit: '',
    ProcessCondition: '',
    Materials: '',
    ProcessFoundation: '',
    Forms: ''
  };

  MDataTable.prototype.getName = function() {
    return this.get('dic_name');
  };

  MDataTable.prototype.getID = function() {
    return this.get('id');
  };

  MDataTable.prototype.getUnit = function() {
    return this.get('AcceptDept');
  };

  MDataTable.prototype.getAddress = function() {
    return this.get('Address');
  };

  MDataTable.prototype.getTel = function() {
    return this.get('Tel');
  };

  MDataTable.prototype.getTimeLimit = function() {
    return this.get('PromiseTimeLimit');
  };

  MDataTable.prototype.getConditions = function() {
    return this.get('ProcessCondition');
  };

  MDataTable.prototype.getMaterials = function() {
    return this.get('Materials');
  };

  MDataTable.prototype.getBasis = function() {
    return this.get('ProcessFoundation');
  };

  MDataTable.prototype.getForms = function() {
    return this.get('Forms');
  };

  return MDataTable;

})(Model);

module.exports = MDataTable;



},{"bamjs/backbone":2}],57:[function(require,module,exports){
var Collection, MFormBtn, MFormBtns,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

Collection = require('bamjs/backbone').Collection;

MFormBtn = require('./');

MFormBtns = (function(_super) {
  __extends(MFormBtns, _super);

  function MFormBtns() {
    return MFormBtns.__super__.constructor.apply(this, arguments);
  }

  MFormBtns.prototype.model = MFormBtn;

  return MFormBtns;

})(Collection);

module.exports = MFormBtns;



},{"./":58,"bamjs/backbone":2}],58:[function(require,module,exports){
var MFormBtn, Model,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

Model = require('bamjs/backbone').Model;

MFormBtn = (function(_super) {
  __extends(MFormBtn, _super);

  function MFormBtn() {
    return MFormBtn.__super__.constructor.apply(this, arguments);
  }

  MFormBtn.prototype.defaults = {
    Name: '',
    Url: ''
  };

  MFormBtn.prototype.getName = function() {
    return this.get('Name');
  };

  MFormBtn.prototype.getUrl = function() {
    return this.get('Url');
  };

  return MFormBtn;

})(Model);

module.exports = MFormBtn;



},{"bamjs/backbone":2}]},{},[1]);
