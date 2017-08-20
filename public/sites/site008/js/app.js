(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
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
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

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
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
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
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
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
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
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
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
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
    var set = isArrayLike(obj) ? obj : _.values(obj);
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
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
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
      iteratee = cb(iteratee, context);
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

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
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
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
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
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
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

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
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
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
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
  _.defer = _.partial(_.delay, _, 1);

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
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
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

      if (last < wait && last >= 0) {
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

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
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

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
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
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
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

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
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

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
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

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
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

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
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
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
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
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
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
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
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

},{}],2:[function(require,module,exports){
/* ==================================================================================
 * edu-portal: app.js
 * 主程序入口
 * ================================================================================== */

//var attachFastClick = require('fastclick');
var Popbox = require('../../../../libs/dolphin/js/popbox');
var UiCtrl = require('./view/uiCtrl');
var BrowserCtrl = require('./view/browserCtrl');
var DataCtrl = require('./data/dataCtrl');

var Webapp = function () {

    //attachFastClick(document.body);
    popbox = new Popbox($);

    browserCtrl = new BrowserCtrl();
    uiCtrl = new UiCtrl();
    dataCtrl = new DataCtrl(uiCtrl);

    //contrustor
    function Webapp() {}

    return Webapp;
}();

$(document).ready(function () {
    var app = new Webapp();
});

},{"../../../../libs/dolphin/js/popbox":14,"./data/dataCtrl":3,"./view/browserCtrl":7,"./view/uiCtrl":13}],3:[function(require,module,exports){
/* ==================================================================================
 * edu-portal: dataCtrl.js
 * 管理数据存取和显示
 * ================================================================================== */
var UrlService = require('./urlService');
var Variables = require('../util/variables');
var _ = require('underscore');

var DataCtrl = function () {

    var urlService = new UrlService();
    var variables = new Variables();

    var userInfo = null;
    var layoutListData = null;
    var appListData = null;

    var el_body = $('body');

    function finished(count, cb) {
        var complete = 0;
        return function () {
            if (++complete === count) cb();
        };
    }

    //constructor
    function DataCtrl(uiCtrl) {
        loadData();
        el_body.bind('data.load', function () {
            loadData();
        });
        el_body.bind('data.changeLayout', function (evt, layoutId) {
            changeLayout(layoutId);
        });
        el_body.bind('data.changeTheme', function (evt, themeId) {
            changeTheme(themeId);
        });
        el_body.bind('data.deleteLayout', function (evt, layoutId) {
            deleteLayout(layoutId);
        });
        el_body.bind('data.updateLayout', function (evt, layoutId, layoutData) {
            updateLayout(layoutId, layoutData);
        });
        el_body.bind('data.newLayout', function (evt, layoutData) {
            newLayout(layoutData);
        });
        el_body.bind('data.logout', function (evt) {
            logout();
        });
        el_body.bind('data.resetLayoutData', function (evt, layoutId) {
            resetLayoutData(layoutId);
        });
    }

    var loadData = function () {
        var dataLoadFinished = finished(3, function () {
            setUserInfo(userInfo);
            setAppList(appListData);
            setLayout(userInfo, appListData, layoutListData);
            uiCtrl.loadingHide();
            uiCtrl.bindeEvents();
        });
        getUserInfo(dataLoadFinished);
        getLayoutListData(dataLoadFinished);
        getAppListData(dataLoadFinished);
    };

    var resetLayoutData = function (layoutId) {
        getLayoutListData(function () {
            setLayout(userInfo, appListData, layoutListData);
            var layoutData = _.findWhere(layoutListData, { _id: layoutId });

            el_body.trigger('ui.editlayout', [layoutData, appListData, layoutId]);
            uiCtrl.loadingHide();
        });
    };

    var logout = function () {
        $.ajax({
            type: 'post',
            url: urlService.getUrl("USER_LOGOUT"),
            dataType: 'json',
            success: function (data) {
                if (data.resultCode == 'JSPE-200') {
                    console.log('退出成功！');
                    location.href = window.www_head;
                } else {
                    console.log(data.errorMessage);
                    el_body.trigger('ui.showtoptip', [data.errorMessage, 2000]);
                }
            },
            error: function () {
                console.log('退出请求失败！');
                el_body.trigger('ui.showtoptip', ['退出请求失败', 2000]);
            }
        });
    };

    var updateLayout = function (layoutId, layoutData) {
        uiCtrl.loadingShow();
        $.ajax({
            type: 'post',
            url: urlService.getUrl("UPDATE_LAYOUT"),
            data: {
                layoutId: layoutId,
                layout: JSON.stringify(layoutData)
            },
            dataType: 'json',
            success: function (data) {
                if (data.resultCode == 'JSPE-200') {
                    console.log('保存布局成功！');
                    el_body.trigger('ui.showtoptip', ['保存布局成功', 2000]);
                    el_body.trigger('data.resetLayoutData', [layoutId]);
                } else {
                    console.log(data.errorMessage);
                    el_body.trigger('ui.showtoptip', [data.errorMessage, 2000]);
                }
            },
            error: function () {
                console.log('保存布局请求失败！');
                uiCtrl.loadingHide();
                el_body.trigger('ui.showtoptip', ['保存布局请求失败', 2000]);
            }
        });
    };

    var newLayout = function (layoutData) {
        uiCtrl.loadingShow();
        $.ajax({
            type: 'post',
            url: urlService.getUrl("NEW_LAYOUT"),
            data: {
                layout: JSON.stringify(layoutData)
            },
            dataType: 'json',
            success: function (data) {
                if (data.resultCode == 'JSPE-200') {
                    console.log('保存新布局成功！');
                    el_body.trigger('ui.showtoptip', ['保存新布局成功', 2000]);
                    el_body.trigger('data.resetLayoutData', [data.resultBean]);
                    uiCtrl.setContainer(2);
                } else {
                    console.log(data.errorMessage);
                    el_body.trigger('ui.showtoptip', [data.errorMessage, 2000]);
                }
            },
            error: function () {
                console.log('保存新布局请求失败！');
                uiCtrl.loadingHide();
                el_body.trigger('ui.showtoptip', ['保存新布局请求失败', 2000]);
            }
        });
    };

    var changeLayout = function (layoutId) {
        /*
        $.ajax({
            type : 'post',
            url : urlService.getUrl("CHANGE_USER_INFO"),
            data : {
                layoutId : layoutId,
                themeId : userInfo.themeId
            },
            dataType : 'json',
            success : function(data){
                if(data.resultCode == 'JSPE-200'){
                    console.log('更换布局成功');
                    uiCtrl.changeLayout(layoutListData, appListData, layoutId);
                    el_body.trigger('ui.showtoptip', ['更换布局成功', 2000]);
                } else {
                    console.log(data.errorMessage);
                    el_body.trigger('ui.showtoptip', [data.errorMessage, 2000]);
                }
            },
            error : function(){
                console.log('更换布局请求失败！');
                el_body.trigger('ui.showtoptip', ['更换布局请求失败', 2000]);
            }
        });*/
        uiCtrl.changeLayout(layoutListData, appListData, layoutId);
        el_body.trigger('ui.showtoptip', ['更换布局成功', 2000]);
    };

    var deleteLayout = function (layoutId) {
        $.ajax({
            type: 'post',
            url: urlService.getUrl("DELETE_LAYOUT"),
            data: { layoutId: layoutId },
            dataType: 'json',
            success: function (data) {
                if (data.resultCode == 'JSPE-200') {
                    console.log('删除布局成功');
                    uiCtrl.deleteLayout(layoutId, appListData);
                    //去掉已删除的布局数据
                    layoutListData = $.grep(layoutListData, function (cur, i) {
                        return cur['_id'] != layoutId;
                    });
                    el_body.trigger('ui.showtoptip', ['删除布局成功', 2000]);
                } else {
                    console.log(data.errorMessage);
                    el_body.trigger('ui.showtoptip', [data.errorMessage, 2000]);
                }
            },
            error: function () {
                console.log('删除布局请求失败！');
                el_body.trigger('ui.showtoptip', ['删除布局请求失败', 2000]);
            }
        });
    };

    var changeTheme = function (themeId) {
        /*
        $.ajax({
            type : 'post',
            url : urlService.getUrl("CHANGE_USER_INFO"),
            data : {
                layoutId : userInfo.layoutId,
                themeId : themeId
            },
            dataType : 'json',
            success : function(data){
                if(data.resultCode == 'JSPE-200'){
                    console.log('更换主题成功');
                    uiCtrl.setTheme(themeId);
                    el_body.trigger('ui.showtoptip', ['更换主题成功', 2000]);
                } else {
                    console.log(data.errorMessage);
                    el_body.trigger('ui.showtoptip', ['data.errorMessage', 2000]);
                }
            },
            error : function(){
                console.log('更换主题请求失败！');
                el_body.trigger('ui.showtoptip', ['更换主题请求失败', 2000]);
            }
        });*/
        uiCtrl.setTheme(themeId);
        el_body.trigger('ui.showtoptip', ['更换主题成功', 2000]);
    };

    var getUserInfo = function (cb) {
        $.ajax({
            type: 'get',
            //type : 'post',
            url: urlService.getDevUrl('USER_INFO'),
            //url : urlService.getUrl('USER_INFO'),
            dataType: 'json',
            success: function (data) {
                if (data.resultCode == 'JSPE-200') {
                    userInfo = data.resultBean;
                    if (userInfo.length != 0) {
                        cb();
                    }
                    console.log('获取用户信息成功');
                } else {
                    console.log(data.errorMessage);
                    el_body.trigger('ui.showtoptip', [data.errorMessage, 2000]);
                }
            },
            error: function () {
                console.log('获取用户信息失败！');
                el_body.trigger('ui.showtoptip', ['获取用户信息失败', 2000]);
            }
        });
    };

    var getLayoutListData = function (cb) {

        $.ajax({
            type: 'get',
            //type : 'post',
            url: urlService.getDevUrl('LAYOUT_LIST'),
            //url : urlService.getUrl('LAYOUT_LIST'),
            dataType: 'json',
            success: function (data) {
                if (data.resultCode == 'JSPE-200') {
                    layoutListData = digestLayoutData(data.resultBean);
                    if (layoutListData.length != 0) {
                        cb();
                    }
                    console.log('获取布局列表成功');
                } else {
                    console.log(data.errorMessage);
                    uiCtrl.showTopTip(data.errorMessage, 2000);
                    el_body.trigger('ui.showtoptip', [data.errorMessage, 2000]);
                }
            },
            error: function () {
                console.log('获取布局列表失败！');
                el_body.trigger('ui.showtoptip', ['获取布局列表失败', 2000]);
            }
        });
    };

    var getAppListData = function (cb) {
        $.ajax({
            type: 'get',
            //type : 'post',
            url: urlService.getDevUrl('APP_LIST'),
            //url : urlService.getUrl('APP_LIST'),
            dataType: 'json',
            success: function (data) {
                if (data.resultCode == 'JSPE-200') {
                    appListData = digestAppListData(data.resultBean);
                    if (appListData.length != 0) {
                        cb();
                    }
                    console.log('获取应用列表成功');
                } else {
                    console.log(data.errorMessage);
                    el_body.trigger('ui.showtoptip', [data.errorMessage, 2000]);
                }
            },
            error: function () {
                console.log('获取应用列表失败！');
                el_body.trigger('ui.showtoptip', ['获取应用列表失败', 2000]);
            }
        });
    };

    var setUserInfo = function (data) {
        uiCtrl.setUserInfo(data);
        uiCtrl.setTheme(data.themeId);
    };

    var digestLayoutData = function (data) {
        resultData = [];
        for (var i = 0; i < data.length; i++) {
            var id = data[i]._id;
            var operatorId = data[i].operatorId;
            var layout = eval('(' + data[i].layout + ')');
            var layoutObj = {
                _id: id,
                operatorId: operatorId,
                layout: layout
            };
            resultData.push(layoutObj);
        }
        return resultData;
    };

    var digestAppListData = function (data) {
        resultData = [];
        for (var i = 0; i < data.length; i++) {
            var oneAppData = data[i];
            var appId = oneAppData.bxAppId;
            var appName = oneAppData.bxAppName;
            var appDesc = oneAppData.description;

            var appPortalStyle = eval('(' + oneAppData.protalStyle + ')');
            var appIconClass = "";
            var appColorClass = "";
            var appType = "";
            var appLink = "";
            if (appPortalStyle != null) {
                appIconClass = appPortalStyle.appIcon;
                appColorClass = variables.getColorClass(appPortalStyle.appColor - 1);
                appType = appPortalStyle.appType;
                appLink = appPortalStyle.appLink;
            }

            var appObj = {
                bxAppId: appId,
                bxAppName: appName,
                description: appDesc,
                appIcon: appIconClass,
                appColor: appColorClass,
                appType: appType,
                menuLink: appLink
            };

            resultData.push(appObj);
        }
        return resultData;
    };
    var setAppList = function (data) {
        uiCtrl.setAppList(data);
    };

    var setLayout = function (userInfo, appListData, layoutListData) {
        uiCtrl.setHomeLayout(layoutListData, appListData, userInfo.layoutId);
        uiCtrl.setLayoutList(layoutListData, appListData, userInfo.layoutId);
    };

    return DataCtrl;
}();

module.exports = DataCtrl;

},{"../util/variables":5,"./urlService":4,"underscore":1}],4:[function(require,module,exports){
/* ==================================================================================
 * edu-portal: urlService.js
 * 管理ajax访问地址
 * ================================================================================== */

var UrlService = function () {

    //var urlRoot = "http://manager.i3618.com.cn";
    var urlRoot = window.core_remote;
    var urlLogout = window.system_remote;
    var urlDevRoot = "./data";

    var urls = {
        USER_INFO: "portal/webConfig", //获取用户信息
        CHANGE_USER_INFO: "portal/changeConfig", //修改用户信息
        LAYOUT_LIST: "portal/layoutList", //获取布局列表
        APP_LIST: "bx/subapp/findCanSubApp", //获取应用列表
        DELETE_LAYOUT: "portal/deleteLayout", //删除布局
        NEW_LAYOUT: "portal/newLayout", //新建布局
        UPDATE_LAYOUT: "portal/updateLayout", //修改布局
        USER_LOGOUT: "user/logOut" //退出
    };

    var devUrls = {
        USER_INFO: "/userinfo.json",
        LAYOUT_LIST: '/layoutlist.json',
        APP_LIST: "/applist.json"
    };

    //constructor
    function UrlService() {}

    UrlService.prototype.getUrl = function (urlname) {
        if (urlname != 'USER_LOGOUT') {
            return urlRoot + urls[urlname];
        } else {
            return urlLogout + urls[urlname];
        }
    };

    UrlService.prototype.getDevUrl = function (urlname) {
        return urlDevRoot + devUrls[urlname];
    };

    return UrlService;
}();

module.exports = UrlService;

},{}],5:[function(require,module,exports){
/* ==================================================================================
 * edu-portal: variables.js
 * 颜色、块大小、块类型等数组
 * ================================================================================== */

var Variables = function () {

    colorClasses = ["bn-color-blue", "bn-color-purple", "bn-color-pink", "bn-color-red", "bn-color-orange", "bn-color-yellow", "bn-color-green", "bn-color-cyan", "bn-color-gray"];

    blockSizes = ["bn-size-1x1", "bn-size-1x2", "bn-size-2x1", "bn-size-2x2"];

    //constructor
    function Variables() {}

    Variables.prototype.getColorClass = function (index) {
        return colorClasses[index];
    };

    Variables.prototype.getSizeClass = function (index) {
        return blockSizes[index];
    };

    return Variables;
}();

module.exports = Variables;

},{}],6:[function(require,module,exports){
/* ==================================================================================
 * edu-portal: appListCtrl.js
 * 应用列表
 * ================================================================================== */
var Variables = require('../util/variables');

var AppListCtrl = function () {

    el_body = $('body');
    el_applist = $('#applist');
    el_popover_content = $('.popover-content');

    variables = new Variables();

    //constructor
    function AppListCtrl() {}

    AppListCtrl.prototype.setAppList = function (appListData) {
        //alert(JSON.stringify(appListData));
        var appListHtml = "";
        var appPopListHtml = "";
        var popoverHtml = "<div class='popover-bg'></div>";
        //alert(appListData.length);
        for (i = 0; i < appListData.length; i++) {
            var data = appListData[i];
            var appId = data.bxAppId;
            var appTitle = data.bxAppName;

            var appColorClass = data.appColor;
            var appIconClass = data.appIcon;
            var appType = data.appType;
            var appLink = data.menuLink;
            //alert(eval('(' + data.portalStyle +')'));

            var popboxHtml = "";
            var blockDiv = "<div class='bn-block appbox bn-layout-1 " + appColorClass + "' id='appid_" + appId + "'>";
            var appBtnHtml = "<div class='col-1of4'>" + "<div class='col-content'>" + "<div class='appbtn popbox-dismiss' id='appbtnid_" + appId + "'  data-target='#popover_applist'>" + "<i class='iconfont " + appIconClass + "'></i>" + " " + appTitle + "</div>" + "</div>" + "</div>";
            if (appType != 1) {
                blockDiv = "<div class='bn-block appbox bn-layout-1 " + appColorClass + "' id='appid_" + appId + "' " + "data-toggle='popbox' data-target='#popover_" + appId + "'>";
                popboxHtml = "<div class='popover-box popbox-model' id='popover_" + appId + "'>" + "<div class='popover-box-title'>" + "<div class='pull-left'>" + "<i class='iconfont " + appIconClass + "'></i> " + appTitle + "</div>" + "<div class='pull-right popbox-dismiss cursor-pointer' data-target='#popover_" + appId + "'>" + "<i class='fa fa-close'></i>" + "</div>" + "</div>" + "<div class='popover-box-content'>" + "<iframe src='" + appLink + "' width='100%' height='100%'></iframe>" + "</div>" + "</div>";
            }
            var appString = blockDiv + "<div class='sel-box'></div>" + "<div class='bn-block-content'>" + "<i class='bn-icon iconfont " + appIconClass + "'></i>" + "<div class='bn-title'>" + appTitle + "</div>" + "</div>" + "</div>";
            appListHtml += appString;
            popoverHtml += popboxHtml;
            appPopListHtml += appBtnHtml;
        }
        var appPopboxHtml = "<div class='popover-box popbox-model applist' id='popover_applist'>" + "<div class='popover-box-title'>" + "<div class='pull-left'>" + "选择应用" + "</div>" + "<div class='pull-right popbox-dismiss cursor-pointer' data-target='#popover_applist'>" + "<i class='fa fa-close'></i>" + "</div>" + "</div>" + "<div class='popover-box-content space-20px'>" + appPopListHtml + "</div>" + "</div>";
        popoverHtml += appPopboxHtml;
        el_popover_content.html(popoverHtml);
        el_applist.html(appListHtml);
        el_applist.find('.bn-block').click(function () {
            appIndex = $(this).index();
            if (appListData[appIndex].appType == 1) {
                //window.open(appListData[appIndex].menuLink);
                el_body.trigger('ui.showtoptip', ['实际项目中点此将链接到对应的外部网站', 2500]);
            } else {
                el_body.trigger('popover.show');
            }
        });
    };

    return AppListCtrl;
}();

module.exports = AppListCtrl;

},{"../util/variables":5}],7:[function(require,module,exports){
/* ==================================================================================
 * edu-portal: browserCtrl.js
 * 检测浏览器运行环境，对动画、触摸的支持等
 * ================================================================================== */

var BrowserCtrl = function () {

    browser = {};

    //constructor
    function BrowserCtrl() {
        checkBrowser();
    }

    //代理检测
    var checkBrowser = function () {
        var supportAnim = supportCss3('animation');

        var isTouch = "ontouchstart" in window || navigator.msMaxTouchPoints;

        browser = {
            "supportAnim": supportAnim,
            "isTouch": isTouch
        };

        if (supportAnim) {
            $("body").addClass('support-anim');
        } else {
            $("body").addClass('no-support-anim');
        }

        if (isTouch) {
            $("body").addClass('is-touch');
        } else {
            $("body").addClass('no-touch');
        }
    };

    //检测css3属性是否支持
    var supportCss3 = function (style) {
        var prefix = ['webkit', 'Moz', 'ms', 'o'],
            i,
            humpString = [],
            htmlStyle = document.documentElement.style,
            _toHumb = function (string) {
            return string.replace(/-(\w)/g, function ($0, $1) {
                return $1.toUpperCase();
            });
        };

        for (i in prefix) humpString.push(_toHumb(prefix[i] + '-' + style));

        humpString.push(_toHumb(style));

        for (i in humpString) if (humpString[i] in htmlStyle) return true;

        return false;
    };

    BrowserCtrl.prototype.getBrowserSupport = function () {
        return browser;
    };

    return BrowserCtrl;
}();

module.exports = BrowserCtrl;

},{}],8:[function(require,module,exports){
/* ==================================================================================
 * edu-portal: editLayoutCtrl.js
 * 编辑布局
 * ================================================================================== */
var Variables = require('../util/variables');
var _ = require('underscore');

var EditLayoutCtrl = function () {

    el_body = $('body');
    el_editLayout_title = $('#editlayout_title'); //标题
    el_editlayout_content = $('.editlayout-block-container'); //块容器
    el_editlayout_size_btns = $('.editlayout-size-item'); //块大小按钮们
    el_editlayout_color_btns = $('.editlayout-color-item'); //块颜色按钮们
    el_editlayout_type_btns = $('.editlayout-type-btn'); //块类型按钮们
    el_ghost_blocks = $('.bn-block-ghost'); //辅助拖拽定位的隐形块

    currentSizeId = 0; //当前选中块的大小
    currentColorId = 0; //当前选中块的颜色
    currentTypeId = 0; //当前选中块的类型
    currentAppId = 0; //当前选中块的appid

    variables = new Variables();

    occupiedArray = new Array(); //存储每个格子是否被占据

    isNewLayout = false; //是否是新建布局

    selBlockId = 0; //当前选中的块的id
    blockTotalNum = 0; //存在过的块的总数
    blockDomDataArray = []; //存在过的所有块的数据

    originData = []; //初始布局数据
    tempData = []; //修改后的暂存数据
    appListData = []; //应用列表数据
    layoutId = 0; //布局ID

    //新建布局用的空数据
    emptyData = {
        _id: "",
        operatorId: "",
        layout: [{ "bxAppId": "", "blockSize": 0, "blockPosCol": 1, "blockPosRow": 1, "blockColor": 1, "blockType": 1 }]
    };

    //constructor
    function EditLayoutCtrl() {

        //保存
        $('#btn_save_layout').click(function () {
            if (checkSaveable()) {
                if (!isNewLayout) {
                    el_body.trigger('data.updateLayout', [layoutId, tempData.layout]);
                } else {
                    el_body.trigger('data.newLayout', [tempData.layout]);
                }
            };
        });

        handleAddNewBlock();
    }

    //对象深拷贝
    var clone = function (obj) {
        var o;
        switch (typeof obj) {
            case 'undefined':
                break;
            case 'string':
                o = obj + '';break;
            case 'number':
                o = obj - 0;break;
            case 'boolean':
                o = obj;break;
            case 'object':
                if (obj === null) {
                    o = null;
                } else {
                    if (obj instanceof Array) {
                        o = [];
                        for (var i = 0, len = obj.length; i < len; i++) {
                            o.push(clone(obj[i]));
                        }
                    } else {
                        o = {};
                        for (var k in obj) {
                            o[k] = clone(obj[k]);
                        }
                    }
                }
                break;
            default:
                o = obj;break;
        }
        return o;
    };

    //设置编辑布局页面
    EditLayoutCtrl.prototype.setEditLayout = function (theLayoutData, theAppListData, theLayoutId) {
        var base = this;

        //初始化编辑布局的状态
        selBlockId = 0;
        blockTotalNum = 0;
        el_editlayout_content.html('');
        appListData = theAppListData;
        layoutId = theLayoutId;
        if (theLayoutData != 'empty') {
            isNewLayout = false;
            originData = clone(theLayoutData);
            el_editLayout_title.html('编辑布局');
        } else {
            isNewLayout = true;
            originData = clone(emptyData);
            el_editLayout_title.html('新建布局');
        }
        tempData = clone(originData);

        var layoutHtml = "";
        var layoutBlockData = originData.layout;

        $('.appbtn').removeClass('used');
        $('.appbtn').removeClass('sel');

        //根据布局数据设置编辑布局页面内容
        for (var i = 0; i < layoutBlockData.length; i++) {
            var blockData = layoutBlockData[i];
            var appTitle = "";
            var appDesc = "";
            var appId = "";
            var appIconClass = "";
            var appData = null;

            if (!isNewLayout) {
                for (j = 0; j < theAppListData.length; j++) {
                    if (parseInt(theAppListData[j].bxAppId) == parseInt(blockData.bxAppId)) {
                        appData = theAppListData[j];
                        break;
                    }
                }
                if (appData != null) {
                    appTitle = appData.bxAppName;
                    appDesc = appData.description;
                    appId = appData.bxAppId;
                    $('#appbtnid_' + appId).addClass('used');
                    appIconClass = appData.appIcon;
                }
            }

            var blockSizeClass = variables.getSizeClass(blockData.blockSize);
            var blockColorClass = variables.getColorClass(blockData.blockColor - 1);
            var blockPosColClass = 'bn-pos-col-' + blockData.blockPosCol;
            var blockPosRowClass = 'bn-pos-row-' + blockData.blockPosRow;
            var blockTypeClass = 'bn-layout-' + blockData.blockType;

            var blockDomData = {
                appTitle: appTitle,
                appDesc: appDesc,
                appId: appId,
                appIconClass: appIconClass,
                blockSizeClass: variables.getSizeClass(blockData.blockSize),
                blockColorClass: variables.getColorClass(blockData.blockColor - 1),
                blockPosColClass: 'bn-pos-col-' + blockData.blockPosCol,
                blockPosRowClass: 'bn-pos-row-' + blockData.blockPosRow,
                blockTypeClass: 'bn-layout-' + blockData.blockType
            };
            addOneBlockDom(blockDomData);
        }

        base.setEditLayoutBlocks();

        //复位
        $('#btn_reset_layout').click(function () {
            base.setEditLayout(theLayoutData, appListData, layoutId);
        });
    };

    var addOneBlockDom = function (blockDomData) {
        blockTotalNum++;
        blockDomData.blockId = blockTotalNum - 1;
        blockDomDataArray.push(blockDomData);
        var blockHtml = "<div class='bn-block " + blockDomData.blockSizeClass + " " + blockDomData.blockColorClass + " " + blockDomData.blockPosColClass + " " + blockDomData.blockPosRowClass + " " + blockDomData.blockTypeClass + "' id='blockid_" + blockDomData.blockId + "'>" + "<div class='sel-box'></div>" + "<div class='editlayout-popbox'>" + "<div class='editlayout_popbtn editlayout_popbtn_1' data-toggle='popbox' data-target='#popover_applist'>选择应用</div>" + "<div class='editlayout_popbtn editlayout_popbtn_2'>删除</div>" + "<div class='editlayout_poparrow'></div>" + "</div>" + "<div class='bn-new-mark'>" + "<i class='iconfont icon-new'></i>" + "</div>" + "<div class='bn-block-content'>" + "<i class='bn-icon iconfont " + blockDomData.appIconClass + "'></i>" + "<div class='bn-title'>" + blockDomData.appTitle + "</div>" + "<div class='bn-text'>" + blockDomData.appDesc + "</div>" + "</div>" + "</div>";
        el_editlayout_content.append(blockHtml);
        addOneBlockActions($('#blockid_' + blockDomData.blockId));
    };

    //设置选定块的相关交互操作
    var addOneBlockActions = function (el_block) {
        //如果是当前选中的块，设置被选中状态
        if (selBlockId == el_block.attr('id').split('_')[1]) {
            selectBlock(selBlockId);
        }

        //鼠标按下，选中块，并执行拖拽运算
        el_block.find('.sel-box').mousedown(function (e) {
            selectBlock(el_block.attr('id').split('_')[1]);
            var InitPositionX = el_block.position().left;
            var InitPositionY = el_block.position().top;
            var mouseDownPosiX = e.pageX;
            var mouseDownPosiY = e.pageY;
            $(this).bind("mousemove", function (ev) {
                var tempX = parseInt(ev.pageX) - parseInt(mouseDownPosiX) + parseInt(InitPositionX);
                var tempY = parseInt(ev.pageY) - parseInt(mouseDownPosiY) + parseInt(InitPositionY);
                getNearestPosition(el_block.position().left, el_block.position().top);
                el_block.css({ 'left': tempX + 'px', 'top': tempY + 'px' });
                el_block.addClass('is-dragging');
            });
        });

        el_block.find('.sel-box').mouseup(function () {
            $(this).unbind("mousemove");
            el_block.removeClass('is-dragging');
            //todo 获得最近的位置
            //getNearestPosition(el_block.position().left, el_block.position().top);
            el_block.attr('style', '');
        });

        el_block.find(".editlayout_popbtn_1").click(function () {
            selectBlock(el_block.attr('id').split('_')[1]);
            $('body').trigger('popover.show');
        });

        el_block.find(".editlayout_popbtn_2").click(function () {
            selectBlock(el_block.attr('id').split('_')[1]);
            deleteBlock();
        });
    };

    //点击添加新磁贴
    var handleAddNewBlock = function () {
        el_ghost_blocks.click(function () {
            var $this = $(this);
            var newBlockData = {
                bxAppId: "",
                blockSize: 0,
                blockPosCol: parseInt($this.attr('id').split('_')[2]),
                blockPosRow: parseInt($this.attr('id').split('_')[1]),
                blockColor: 1,
                blockType: 1
            };
            tempData.layout.push(newBlockData);
            var blockDomData = {
                appTitle: "",
                appDesc: "",
                appId: "",
                appIconClass: "",
                blockSizeClass: variables.getSizeClass(newBlockData.blockSize),
                blockColorClass: variables.getColorClass(newBlockData.blockColor - 1),
                blockPosColClass: 'bn-pos-col-' + newBlockData.blockPosCol,
                blockPosRowClass: 'bn-pos-row-' + newBlockData.blockPosRow,
                blockTypeClass: 'bn-layout-' + newBlockData.blockType
            };
            addOneBlockDom(blockDomData);
            selectBlock(blockDomData.blockId);
        });
    };

    //设置更改颜色、布局类型、块大小等板块的功能
    EditLayoutCtrl.prototype.setEditLayoutBlocks = function () {
        //更改颜色
        el_editlayout_color_btns.click(function () {
            $this = $(this);
            var thisIndex = $this.index();
            var blockIndex = getBlockIndexById(selBlockId);
            var blockData = tempData.layout[blockIndex];
            if (blockData.blockColor - 1 != thisIndex) {
                blockData.blockColor = thisIndex + 1;
                setColorBtns(thisIndex);
                setBlockCss();
            }
        });

        //更改块的布局类型
        el_editlayout_type_btns.click(function () {
            $this = $(this);
            var thisIndex = $this.index();
            var blockIndex = getBlockIndexById(selBlockId);
            var blockData = tempData.layout[blockIndex];
            if (blockData.blockType - 1 != thisIndex) {
                blockData.blockType = thisIndex + 1;
                setTypeBtns(thisIndex);
                setBlockCss();
            }
        });

        //更改块的大小
        el_editlayout_size_btns.click(function () {
            $this = $(this);
            if (!$this.hasClass('disabled')) {
                var thisIndex = $this.index();
                var blockIndex = getBlockIndexById(selBlockId);
                var blockData = tempData.layout[blockIndex];
                var blockCol = blockData.blockPosCol - 1;
                var blockRow = blockData.blockPosRow - 1;
                if (blockData.blockSize != thisIndex) {
                    if (blockData.blockSize == 0) {
                        //当前选中块大小为1x1时
                        if (thisIndex == 1) {
                            //目标大小1x2
                            if (checkPosOccupied(blockRow + 1, blockCol) && !checkPosOccupied(blockRow - 1, blockCol)) {
                                blockData.blockPosRow -= 1;
                            }
                        }
                        if (thisIndex == 2) {
                            //目标大小2x1
                            if (checkPosOccupied(blockRow, blockCol + 1) && !checkPosOccupied(blockRow, blockCol - 1)) {
                                blockData.blockPosCol -= 1;
                            }
                        }
                        if (thisIndex == 3) {
                            //目标大小2x2
                            if (!checkPosOccupied(blockRow, blockCol + 1) && !checkPosOccupied(blockRow + 1, blockCol) && !checkPosOccupied(blockRow + 1, blockCol + 1)) {} else if (!checkPosOccupied(blockRow, blockCol + 1) && !checkPosOccupied(blockRow - 1, blockCol) && !checkPosOccupied(blockRow - 1, blockCol + 1)) {
                                blockData.blockPosRow -= 1;
                            } else if (!checkPosOccupied(blockRow, blockCol - 1) && !checkPosOccupied(blockRow - 1, blockCol) && !checkPosOccupied(blockRow - 1, blockCol - 1)) {
                                blockData.blockPosRow -= 1;
                                blockData.blockPosCol -= 1;
                            } else if (!checkPosOccupied(blockRow, blockCol - 1) && !checkPosOccupied(blockRow + 1, blockCol) && !checkPosOccupied(blockRow + 1, blockCol - 1)) {
                                blockData.blockPosCol -= 1;
                            }
                        }
                    } else if (blockData.blockSize == 1) {
                        //当选中块大小为1x2时
                        if (thisIndex == 2) {
                            //目标大小2x1
                            if (!checkPosOccupied(blockRow, blockCol + 1)) {} else if (!checkPosOccupied(blockRow + 1, blockCol + 1)) {
                                blockData.blockPosRow += 1;
                            } else if (!checkPosOccupied(blockRow, blockCol - 1)) {
                                blockData.blockPosCol -= 1;
                            } else if (!checkPosOccupied(blockRow + 1, blockCol - 1)) {
                                blockData.blockPosCol -= 1;
                                blockData.blockPosRow += 1;
                            }
                        } else if (thisIndex == 3) {
                            //目标大小2x2
                            if (!checkPosOccupied(blockRow, blockCol + 1) && !checkPosOccupied(blockRow + 1, blockCol + 1)) {} else if (!checkPosOccupied(blockRow, blockCol - 1) && !checkPosOccupied(blockRow + 1, blockCol - 1)) {
                                blockData.blockPosCol -= 1;
                            }
                        }
                    } else if (blockData.blockSize == 2) {
                        //当选中块大小为2x1时
                        if (thisIndex == 1) {
                            //目标大小1x2
                            if (!checkPosOccupied(blockRow + 1, blockCol)) {} else if (!checkPosOccupied(blockRow + 1, blockCol + 1)) {
                                blockData.blockPosCol += 1;
                            } else if (!checkPosOccupied(blockRow - 1, blockCol)) {
                                blockData.blockPosRow -= 1;
                            } else if (!checkPosOccupied(blockRow - 1, blockCol + 1)) {
                                blockData.blockPosRow -= 1;
                                blockData.blockPosCol += 1;
                            }
                        } else if (thisIndex == 3) {
                            //目标大小2x2
                            if (!checkPosOccupied(blockRow + 1, blockCol) && !checkPosOccupied(blockRow + 1, blockCol + 1)) {} else if (!checkPosOccupied(blockRow - 1, blockCol) && !checkPosOccupied(blockRow - 1, blockCol + 1)) {
                                blockData.blockPosRow -= 1;
                            }
                        }
                    }
                    blockData.blockSize = thisIndex;
                    setSizeBtns(thisIndex, blockData.blockPosCol, blockData.blockPosRow);
                    setBlockCss();
                }
            }
        });

        //选择app
        $('.appbtn').click(function () {
            var $this = $(this);
            var blockIndex = getBlockIndexById(selBlockId);
            var blockData = tempData.layout[blockIndex];
            var oldAppId = blockData.bxAppId;
            if (!$this.hasClass('sel') && !$this.hasClass('used')) {
                appId = $this.attr('id').split('_')[1];
                $('#appbtnid_' + oldAppId).removeClass('used');
                $('#appbtnid_' + appId).addClass('used');
                setAppBtn(appId);
                blockData.bxAppId = appId;
                setBlockApp(appId);
            }
        });
    };

    //根据blockId获取blockIndex(序号)
    var getBlockIndexById = function (blockId) {
        var blockIndex = null;
        el_editlayout_content.find('.bn-block').each(function () {
            var $this = $(this);
            if (blockId == $this.attr('id').split('_')[1]) {
                blockIndex = $this.index();
            }
        });
        return blockIndex;
    };

    //根据block的col和row获取blockIndex
    var getBlockIdByPos = function (row, col) {
        var blockId = null;
        var targetBlock = el_editlayout_content.find('.bn-pos-col-' + col + '.bn-pos-row-' + row);
        if (targetBlock.length > 0) {
            //alert(targetBlock.length);
            //alert('row: ' + row +'   col: '+ col + '      ' + targetBlock.eq(0).attr('id'));
            blockId = targetBlock.eq(0).attr('id').split('_')[1];
            //alert(blockIndex);
        }
        return blockId;
    };

    //根据blockId选择block
    var selectBlock = function (blockId) {
        if (blockId == selBlockId) {
            $('#blockid_' + blockId).addClass('sel');
        } else {
            $('#blockid_' + selBlockId).removeClass('sel');
            $('#blockid_' + blockId).addClass('sel');
            selBlockId = blockId;
        }
        var blockIndex = getBlockIndexById(blockId);
        if (blockIndex != null) {
            var blockData = tempData.layout[blockIndex];
            setBlockState(blockData);
        }
    };

    //设置块状态
    var setBlockState = function (blockData) {

        var sizeId = blockData.blockSize;
        var colorId = blockData.blockColor - 1;
        var typeId = blockData.blockType - 1;
        var appId = blockData.bxAppId;
        var posCol = blockData.blockPosCol;
        var posRow = blockData.blockPosRow;

        setSizeBtns(sizeId, posCol, posRow);
        setColorBtns(colorId);
        setTypeBtns(typeId);
        setAppBtn(appId);
    };

    var setSizeBtns = function (sizeId, posCol, posRow) {

        if (currentSizeId != sizeId) {
            el_editlayout_size_btns.eq(currentSizeId).removeClass('current');
            el_editlayout_size_btns.eq(sizeId).addClass('current');
            currentSizeId = sizeId;
        } else {
            el_editlayout_size_btns.eq(currentSizeId).addClass('current');
        }

        el_editlayout_size_btns.each(function () {
            $(this).removeClass('disabled');
        });

        var row = posRow - 1;
        var col = posCol - 1;

        //当块大小为1x1时
        if (currentSizeId == 0) {

            //判断1x2按钮是否可用
            if (checkPosOccupied(row + 1, col) && checkPosOccupied(row - 1, col)) {
                el_editlayout_size_btns.eq(1).addClass('disabled');
            }

            //判断2x1按钮是否可用
            if (checkPosOccupied(row, col + 1) && checkPosOccupied(row, col - 1)) {
                el_editlayout_size_btns.eq(2).addClass('disabled');
            }

            //判断2x2按钮是否可用
            if ((checkPosOccupied(row, col + 1) || checkPosOccupied(row + 1, col + 1) || checkPosOccupied(row + 1, col)) && (checkPosOccupied(row, col + 1) || checkPosOccupied(row - 1, col + 1) || checkPosOccupied(row - 1, col)) && (checkPosOccupied(row, col - 1) || checkPosOccupied(row - 1, col - 1) || checkPosOccupied(row - 1, col)) && (checkPosOccupied(row, col - 1) || checkPosOccupied(row + 1, col - 1) || checkPosOccupied(row + 1, col))) {

                el_editlayout_size_btns.eq(3).addClass('disabled');
            }
        } else if (currentSizeId == 1) {
            //当块大小为1x2时

            //判断2x1按钮是否可用
            if (checkPosOccupied(row, col + 1) && checkPosOccupied(row + 1, col + 1) && checkPosOccupied(row, col - 1) && checkPosOccupied(row + 1, col - 1)) {
                el_editlayout_size_btns.eq(2).addClass('disabled');
            }

            //判断2x2按钮是否可用
            if (!(!checkPosOccupied(row, col + 1) && !checkPosOccupied(row + 1, col + 1)) && !(!checkPosOccupied(row, col - 1) && !checkPosOccupied(row + 1, col - 1))) {
                el_editlayout_size_btns.eq(3).addClass('disabled');
            }
        } else if (currentSizeId == 2) {
            //当块大小为2x1时

            //判断1x2按钮是否可用
            if (checkPosOccupied(row + 1, col) && checkPosOccupied(row + 1, col + 1) && checkPosOccupied(row - 1, col) && checkPosOccupied(row - 1, col + 1)) {
                el_editlayout_size_btns.eq(1).addClass('disabled');
            }

            //判断2x2按钮是否可用
            if (!(!checkPosOccupied(row - 1, col) && !checkPosOccupied(row - 1, col + 1)) && !(!checkPosOccupied(row + 1, col) && !checkPosOccupied(row + 1, col + 1))) {
                el_editlayout_size_btns.eq(3).addClass('disabled');
            }
        }
    };

    var setColorBtns = function (colorId) {
        if (currentColorId != colorId) {
            el_editlayout_color_btns.eq(currentColorId).removeClass('current');
            el_editlayout_color_btns.eq(colorId).addClass('current');
            currentColorId = colorId;
        } else {
            el_editlayout_color_btns.eq(currentColorId).addClass('current');
        }
    };

    var setTypeBtns = function (typeId) {
        if (currentTypeId != typeId) {
            el_editlayout_type_btns.eq(currentTypeId).removeClass('current');
            el_editlayout_type_btns.eq(typeId).addClass('current');
            currentTypeId = typeId;
        } else {
            el_editlayout_type_btns.eq(currentTypeId).addClass('current');
        }
    };

    var setAppBtn = function (appId) {
        if (appId && appId != '') {
            if (currentAppId != appId) {
                $('#appbtnid_' + currentAppId).removeClass('sel');
                $('#appbtnid_' + appId).addClass('sel');
                currentAppId = appId;
            } else {
                $('#appbtnid_' + currentAppId).addClass('sel');
            }
        } else {
            $('.appbtn').removeClass('sel');
        }
    };

    var setBlockCss = function () {
        var blockIndex = getBlockIndexById(selBlockId);
        var blockData = tempData.layout[blockIndex];
        var blockSizeClass = variables.getSizeClass(blockData.blockSize);
        var blockColorClass = variables.getColorClass(blockData.blockColor - 1);
        var blockPosColClass = 'bn-pos-col-' + blockData.blockPosCol;
        var blockPosRowClass = 'bn-pos-row-' + blockData.blockPosRow;
        var blockTypeClass = 'bn-layout-' + blockData.blockType;
        var blockClass = 'bn-block ' + blockSizeClass + ' ' + blockColorClass + ' ' + blockPosColClass + ' ' + blockPosRowClass + ' ' + blockTypeClass + ' ' + 'sel';

        $('#blockid_' + selBlockId).attr('class', blockClass);
    };

    var setBlockCssById = function (blockId) {
        var blockIndex = getBlockIndexById(blockId);
        var blockData = tempData.layout[blockIndex];
        var blockSizeClass = variables.getSizeClass(blockData.blockSize);
        var blockColorClass = variables.getColorClass(blockData.blockColor - 1);
        var blockPosColClass = 'bn-pos-col-' + blockData.blockPosCol;
        var blockPosRowClass = 'bn-pos-row-' + blockData.blockPosRow;
        var blockTypeClass = 'bn-layout-' + blockData.blockType;
        var blockClass = 'bn-block ' + blockSizeClass + ' ' + blockColorClass + ' ' + blockPosColClass + ' ' + blockPosRowClass + ' ' + blockTypeClass;

        if (blockId == selBlockId) {
            blockClass += ' sel';
        }

        $('#blockid_' + blockId).attr('class', blockClass);
    };

    var setBlockApp = function (appId) {
        appData = $.grep(appListData, function (cur, i) {
            return cur['bxAppId'] == appId;
        });
        var el_block = $('#blockid_' + selBlockId);
        el_block.find('.bn-title').html(appData[0].bxAppName);
        var iconClass = 'bn-icon iconfont ' + appData[0].appIcon;
        el_block.find('.bn-icon').attr('class', iconClass);
        el_block.find('.bn-text').html(appData[0].description);
    };

    //获得当前块最近的网格位置
    var getNearestPosition = function (blockPosX, blockPosY) {
        var distance = null;
        var targetId = 0;

        el_ghost_blocks.each(function () {
            var $this = $(this);
            var thisIndex = $this.index();
            var posX = $this.position().left;
            var posY = $this.position().top;
            var distX = blockPosX - posX;
            var distY = blockPosY - posY;
            var thisDistance = Math.pow(distX * distX + distY * distY, 0.5);
            if (distance == null) {
                distance = thisDistance;
            } else if (distance > thisDistance) {
                distance = thisDistance;
                targetId = thisIndex;
            }
            //console.log(thisDistance);
        });
        //获取最近ghostblock的id，通过id获得其row和col值
        var attrId = el_ghost_blocks.eq(targetId).attr('id').split('_');
        var rowId = attrId[1];
        var colId = attrId[2];
        var blockIndex = getBlockIndexById(selBlockId);
        var blockData = tempData.layout[blockIndex];
        var selblockSize = blockData.blockSize; //选中的块的大小
        var selBlockPosRow = blockData.blockPosRow; //选中块的行位置
        var selBlockPosCol = blockData.blockPosCol; //选中块的列位置
        if (rowId == 3 && (selblockSize == 1 || selblockSize == 3)) {
            rowId = 2;
        }
        if (colId == 5 && (selblockSize == 2 || selblockSize == 3)) {
            colId = 4;
        }

        /***********
        /* 移动块时被占据的块的移动控制
        ************/
        var targetRow = parseInt(rowId); //目标位置行
        var targetCol = parseInt(colId); //目标位置列
        var canMove = false; //选中的块可否移动

        //当目标位置不是当前选中块的基准位置时
        if (selBlockPosRow != targetRow || selBlockPosCol != targetCol) {
            //选中的块是1x1时+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            if (selblockSize == 0) {
                var targetBlockInfo = getBlockInfoByPos(targetRow, targetCol);
                if (targetBlockInfo == false) {
                    //目标位置为空
                    canMove = true;
                } else {
                    //目标位置不为空
                    //相对位置信息
                    var relInfo = getPosRelative(targetBlockInfo, blockPosX, blockPosY);

                    //目标位置有块的基准点
                    if (targetBlockInfo.blockStartsHere) {
                        //目标位置块大小1x1
                        if (targetBlockInfo.blockData.blockSize == 0) {
                            if (relInfo.relCol == 'left' && canStepLeft(targetBlockInfo)) {
                                moveBlockBy(targetBlockInfo, 0, -1);
                            } else if (relInfo.relCol == 'right' && canStepRight(targetBlockInfo)) {
                                moveBlockBy(targetBlockInfo, 0, 1);
                            } else if (relInfo.relRow == 'top' && canStepTop(targetBlockInfo)) {
                                moveBlockBy(targetBlockInfo, -1, 0);
                            } else if (relInfo.relRow == 'down' && canStepDown(targetBlockInfo)) {
                                moveBlockBy(targetBlockInfo, 1, 0);
                            } else {
                                moveBlockTo(targetBlockInfo, selBlockPosRow, selBlockPosCol);
                            }
                            canMove = true;
                        }
                        //目标位置大小1x2
                        else if (targetBlockInfo.blockData.blockSize == 1) {
                                if (relInfo.relCol == 'left' && canStepLeft(targetBlockInfo)) {
                                    moveBlockBy(targetBlockInfo, 0, -1);
                                    canMove = true;
                                } else if (relInfo.relCol == 'right' && canStepRight(targetBlockInfo)) {
                                    moveBlockBy(targetBlockInfo, 0, 1);
                                    canMove = true;
                                } else if (relInfo.relRow == 'down' && canStepDown(targetBlockInfo)) {
                                    moveBlockBy(targetBlockInfo, 1, 0);
                                    canMove = true;
                                } else {
                                    if (selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol) {
                                        moveBlockBy(targetBlockInfo, 1, 0);
                                        canMove = true;
                                    } else if (!checkPosOccupied(selBlockPosRow, selBlockPosCol - 1)) {
                                        moveBlockTo(targetBlockInfo, selBlockPosRow, selBlockPosCol);
                                        canMove = true;
                                    }
                                }
                            }
                            //目标位置大小2x1
                            else if (targetBlockInfo.blockData.blockSize == 2) {
                                    if (relInfo.relCol == 'right' && canStepRight(targetBlockInfo)) {
                                        moveBlockBy(targetBlockInfo, 0, 1);
                                        canMove = true;
                                    } else if (relInfo.relRow == 'top' && canStepTop(targetBlockInfo)) {
                                        moveBlockBy(targetBlockInfo, -1, 0);
                                        canMove = true;
                                    } else if (relInfo.relRow == 'down' && canStepDown(targetBlockInfo)) {
                                        moveBlockBy(targetBlockInfo, 1, 0);
                                        canMove = true;
                                    } else {
                                        if (selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2) {
                                            moveBlockBy(targetBlockInfo, 0, 1);
                                            canMove = true;
                                        } else if (!checkPosOccupied(selBlockPosRow - 1, selBlockPosCol)) {
                                            moveBlockTo(targetBlockInfo, selBlockPosRow, selBlockPosCol);
                                            canMove = true;
                                        }
                                    }
                                }
                                //目标位置大小2x2
                                else if (targetBlockInfo.blockData.blockSize == 3) {
                                        if (relInfo.relCol == 'right' && canStepRight(targetBlockInfo)) {
                                            moveBlockBy(targetBlockInfo, 0, 1);
                                            canMove = true;
                                        } else if (relInfo.relRow == 'down' && canStepDown(targetBlockInfo)) {
                                            moveBlockBy(targetBlockInfo, 1, 0);
                                            canMove = true;
                                        } else {
                                            if (selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                                moveBlockBy(targetBlockInfo, 0, 1);
                                                canMove = true;
                                            } else if (selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol + 1 && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2)) {
                                                moveBlockBy(targetBlockInfo, 1, 0);
                                                canMove = true;
                                            } else if (!checkPosOccupied(selBlockPosRow - 1, selBlockPosCol) && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) && !checkPosOccupied(selBlockPosRow, selBlockPosCol)) {
                                                moveBlockTo(targetBlockInfo, selBlockPosRow, selBlockPosCol);
                                                canMove = true;
                                            }
                                        }
                                    }
                    } else {
                        //目标位置没有基准点
                        //目标位置基准点在左侧
                        if (targetBlockInfo.blockOffset == 'left') {
                            //大小为2x1
                            if (targetBlockInfo.blockData.blockSize == 2) {
                                if (relInfo.relCol == 'left' && canStepLeft(targetBlockInfo)) {
                                    moveBlockBy(targetBlockInfo, 0, -1);
                                    canMove = true;
                                } else if (relInfo.relRow == 'top' && canStepTop(targetBlockInfo)) {
                                    moveBlockBy(targetBlockInfo, -1, 0);
                                    canMove = true;
                                } else if (relInfo.relRow == 'down' && canStepDown(targetBlockInfo)) {
                                    moveBlockBy(targetBlockInfo, 1, 0);
                                    canMove = true;
                                } else {
                                    if (selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2) {
                                        moveBlockBy(targetBlockInfo, 0, -1);
                                        canMove = true;
                                    } else if (!checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2)) {
                                        moveBlockTo(targetBlockInfo, selBlockPosRow, selBlockPosCol - 1);
                                        canMove = true;
                                    }
                                }
                            }
                            //大小为2x2
                            else if (targetBlockInfo.blockData.blockSize == 3) {
                                    if (selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) || relInfo.relCol == 'left' && canStepLeft(targetBlockInfo)) {
                                        moveBlockBy(targetBlockInfo, 0, -1);
                                        canMove = true;
                                    } else if (selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol - 1 && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol) || relInfo.relRow == 'down' && canStepDown(targetBlockInfo)) {
                                        moveBlockBy(targetBlockInfo, 1, 0);
                                        canMove = true;
                                    } else if (!checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 2) && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1)) {
                                        moveBlockTo(targetBlockInfo, selBlockPosRow, selBlockPosCol - 1);
                                        canMove = true;
                                    }
                                }
                        } else if (targetBlockInfo.blockOffset == 'topleft') {
                            //目标位置在左上方
                            //大小为2x2
                            if (targetBlockInfo.blockData.blockSize == 3) {
                                if (relInfo.relCol == 'left' && canStepLeft(targetBlockInfo) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                    moveBlockBy(targetBlockInfo, 0, -1);
                                    canMove = true;
                                } else if (relInfo.relRow == 'top' && canStepTop(targetBlockInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol - 1 && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2)) {
                                    moveBlockBy(targetBlockInfo, -1, 0);
                                    canMove = true;
                                } else if (!checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 2) && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                    moveBlockTo(targetBlockInfo, selBlockPosRow - 1, selBlockPosCol - 1);
                                    canMove = true;
                                }
                            }
                        } else if (targetBlockInfo.blockOffset == 'top') {
                            //目标位置在上方
                            //大小为1x2
                            if (targetBlockInfo.blockData.blockSize == 1) {
                                if (relInfo.relCol == 'left' && canStepLeft(targetBlockInfo)) {
                                    moveBlockBy(targetBlockInfo, 0, -1);
                                    canMove = true;
                                } else if (relInfo.relCol == 'right' && canStepRight(targetBlockInfo)) {
                                    moveBlockBy(targetBlockInfo, 0, 1);
                                    canMove = true;
                                } else if (canStepTop(targetBlockInfo)) {
                                    moveBlockBy(targetBlockInfo, -1, 0);
                                    canMove = true;
                                } else {
                                    if (selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol - 1 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 1 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                        moveBlockBy(targetBlockInfo, 0, -1);
                                        canMove = true;
                                    } else if (selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 1 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 1 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                        moveBlockBy(targetBlockInfo, 0, 1);
                                        canMove = true;
                                    } else if (selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol) {
                                        moveBlockBy(targetBlockInfo, -1, 0);
                                        canMove = true;
                                    }
                                }
                            } else if (targetBlockInfo.blockData.blockSize == 3) {
                                //2x2
                                if (canStepRight(targetBlockInfo) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                    moveBlockBy(targetBlockInfo, 0, 1);
                                    canMove = true;
                                } else if (canStepTop(targetBlockInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol + 1 && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2)) {
                                    moveBlockBy(targetBlockInfo, -1, 0);
                                    canMove = true;
                                }
                            }
                        }
                    }
                }
            }
            //选中的块是1x2时+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            else if (selblockSize == 1) {
                    var targetBlockInfo = getBlockInfoByPos(targetRow, targetCol);
                    //目标位置下方位置的块信息
                    var targetBlockBottomInfo = getBlockInfoByPos(targetRow + 1, targetCol);
                    //向上移动一格
                    if (targetRow == selBlockPosRow - 1 && targetCol == selBlockPosCol) {
                        //目标位置为空
                        if (!targetBlockInfo) {
                            canMove = true;
                        } else if (targetBlockInfo.blockStartsHere) {
                            var relInfo = getPosRelative(targetBlockInfo, blockPosX, blockPosY);
                            if (targetBlockInfo.blockData.blockSize == 0) {
                                //1x1
                                if (relInfo.relCol == 'left' && canStepLeft(targetBlockInfo)) {
                                    moveBlockBy(targetBlockInfo, 0, -1);
                                } else if (relInfo.relCol == 'right' && canStepRight(targetBlockInfo)) {
                                    moveBlockBy(targetBlockInfo, 0, 1);
                                } else {
                                    moveBlockBy(targetBlockInfo, 2, 0);
                                }
                                canMove = true;
                            } else if (targetBlockInfo.blockData.blockSize == 2) {
                                //2x1
                                if (canStepRight(targetBlockInfo)) {
                                    moveBlockBy(targetBlockInfo, 0, 1);
                                    canMove = true;
                                } else if (!checkPosOccupied(selBlockPosRow, selBlockPosCol)) {
                                    moveBlockBy(targetBlockInfo, 2, 0);
                                    canMove = true;
                                }
                            }
                        } else {
                            //块的基准点不在目标位置
                            if (targetBlockInfo.blockData.blockSize == 2) {
                                //2x1
                                if (canStepLeft(targetBlockInfo)) {
                                    moveBlockBy(targetBlockInfo, 0, -1);
                                    canMove = true;
                                } else if (!checkPosOccupied(selBlockPosRow, selBlockPosCol - 2)) {
                                    moveBlockBy(targetBlockInfo, 2, 0);
                                    canMove = true;
                                }
                            }
                        }
                    }
                    //向下移动一格
                    else if (targetRow == selBlockPosRow + 1 && targetCol == selBlockPosCol) {
                            if (!targetBlockBottomInfo) {
                                //位置为空
                                canMove = true;
                            } else if (targetBlockBottomInfo.blockStartsHere) {
                                var relInfo = getPosRelative(targetBlockBottomInfo, blockPosX, blockPosY);
                                if (targetBlockBottomInfo.blockData.blockSize == 0) {
                                    //1x1
                                    if (relInfo.relCol == 'left' && canStepLeft(targetBlockBottomInfo)) {
                                        moveBlockBy(targetBlockBottomInfo, 0, -1);
                                    } else if (relInfo.relCol == 'right' && canStepRight(targetBlockBottomInfo)) {
                                        moveBlockBy(targetBlockBottomInfo, 0, 1);
                                    } else {
                                        moveBlockBy(targetBlockBottomInfo, -2, 0);
                                    }
                                    canMove = true;
                                } else if (targetBlockBottomInfo.blockData.blockSize == 2) {
                                    //2x1
                                    if (canStepRight(targetBlockBottomInfo)) {
                                        moveBlockBy(targetBlockBottomInfo, 0, 1);
                                        canMove = true;
                                    } else if (!checkPosOccupied(selBlockPosRow - 1, selBlockPosCol)) {
                                        moveBlockBy(targetBlockBottomInfo, -2, 0);
                                    }
                                }
                            } else {
                                if (targetBlockBottomInfo.blockData.blockSize == 2) {
                                    //2x1
                                    if (canStepLeft(targetBlockBottomInfo)) {
                                        moveBlockBy(targetBlockBottomInfo, 0, -1);
                                        canMove = true;
                                    } else if (!checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2)) {
                                        moveBlockBy(targetBlockBottomInfo, -2, 0);
                                        canMove = true;
                                    }
                                }
                            }
                        } else {
                            //其它移动状态
                            if (!targetBlockInfo && !targetBlockBottomInfo) {
                                canMove = true;
                            } else if (targetBlockInfo.blockData == targetBlockBottomInfo.blockData) {
                                var relInfo = getPosRelative(targetBlockInfo, blockPosX, blockPosY);
                                //1x2
                                if (targetBlockInfo.blockData.blockSize == 1) {
                                    if (relInfo.relCol == 'left' && canStepLeft(targetBlockInfo)) {
                                        moveBlockBy(targetBlockInfo, 0, -1);
                                    } else if (relInfo.relCol == 'right' && canStepRight(targetBlockInfo)) {
                                        moveBlockBy(targetBlockInfo, 0, 1);
                                    } else {
                                        if (selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol - 1 && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 1 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                            moveBlockBy(targetBlockInfo, 0, -1);
                                        } else if (selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 1 && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 1 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                            moveBlockBy(targetBlockInfo, 0, 1);
                                        } else {
                                            moveBlockTo(targetBlockInfo, selBlockPosRow, selBlockPosCol);
                                        }
                                    }
                                    canMove = true;
                                } else if (targetBlockInfo.blockData.blockSize == 3) {
                                    //2x2
                                    if (targetBlockInfo.blockStartsHere) {
                                        if (canStepRight(targetBlockInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1)) {
                                            moveBlockBy(targetBlockInfo, 0, 1);
                                            canMove = true;
                                        }
                                    } else {
                                        if (canStepLeft(targetBlockInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1)) {
                                            moveBlockBy(targetBlockInfo, 0, -1);
                                            canMove = true;
                                        }
                                    }
                                }
                            }
                            //目标位置下方位置的块不为空，上方也不为空，且是两个不同的块
                            else if (targetBlockInfo && targetBlockBottomInfo) {
                                    var relInfo = getPosRelative(targetBlockInfo, blockPosX, blockPosY);
                                    var relBottomInfo = getPosRelative(targetBlockBottomInfo, blockPosX, blockPosY);
                                    if (targetBlockInfo.blockData.blockSize == 0 && targetBlockBottomInfo.blockData.blockSize == 0) {
                                        //1x1 & 1x1
                                        if (relInfo.relCol == 'left' && canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo)) {
                                            moveBlockBy(targetBlockInfo, 0, -1);
                                            moveBlockBy(targetBlockBottomInfo, 0, -1);
                                            canMove = true;
                                        } else if (relInfo.relCol == 'right' && canStepRight(targetBlockInfo) && canStepRight(targetBlockBottomInfo)) {
                                            moveBlockBy(targetBlockInfo, 0, 1);
                                            moveBlockBy(targetBlockBottomInfo, 0, 1);
                                            canMove = true;
                                        } else {
                                            if (selBlockPosRow == targetRow && selBlockPosCol == targetCol - 1) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            } else if (selBlockPosRow == targetRow && selBlockPosCol == targetCol + 1) {
                                                moveBlockBy(targetBlockInfo, 0, 1);
                                                moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                canMove = true;
                                            }
                                        }
                                    } else if (targetBlockInfo.blockStartsHere && targetBlockBottomInfo.blockStartsHere) {
                                        if (targetBlockInfo.blockData.blockSize == 0 && targetBlockBottomInfo.blockData.blockSize == 1) {
                                            //1x1 & 1x2
                                            if (relInfo.relCol == 'left' && canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            } else if (relInfo.relCol == 'right' && canStepRight(targetBlockInfo) && canStepRight(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, 1);
                                                moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                canMove = true;
                                            } else {
                                                if (selBlockPosRow == targetRow && selBlockPosCol == targetCol - 1 && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1)) {
                                                    moveBlockBy(targetBlockInfo, 0, -1);
                                                    moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                    canMove = true;
                                                } else if (selBlockPosRow == targetRow && selBlockPosCol == targetCol + 1 && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1)) {
                                                    moveBlockBy(targetBlockInfo, 0, 1);
                                                    moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                    canMove = true;
                                                }
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 0 && targetBlockBottomInfo.blockData.blockSize == 2) {
                                            //1x1 & 2x1
                                            if (canStepRight(targetBlockInfo) && canStepRight(targetBlockBottomInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && canStepRight(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, 1);
                                                moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                canMove = true;
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 0 && targetBlockBottomInfo.blockData.blockSize == 3) {
                                            //1x1 & 2x2
                                            if (canStepRight(targetBlockInfo) && canStepRight(targetBlockBottomInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && canStepRight(targetBlockInfo) && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1)) {
                                                moveBlockBy(targetBlockInfo, 0, 1);
                                                moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                canMove = true;
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 2 && targetBlockBottomInfo.blockData.blockSize == 0) {
                                            //2x1 & 1x1
                                            if (canStepRight(targetBlockInfo) && canStepRight(targetBlockBottomInfo) || canStepRight(targetBlockBottomInfo) && selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2) {
                                                moveBlockBy(targetBlockInfo, 0, 1);
                                                moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                canMove = true;
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 2 && targetBlockBottomInfo.blockData.blockSize == 2) {
                                            //2x1 & 2x1
                                            if (canStepRight(targetBlockInfo) && canStepRight(targetBlockBottomInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2) {
                                                moveBlockBy(targetBlockInfo, 0, 1);
                                                moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                canMove = true;
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 2 && targetBlockBottomInfo.blockData.blockSize == 1) {
                                            //2x1 & 1x2
                                            if (canStepRight(targetBlockInfo) && canStepRight(targetBlockBottomInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && canStepRight(targetBlockBottomInfo) || canStepRight(targetBlockInfo) && selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 1) {
                                                moveBlockBy(targetBlockInfo, 0, 1);
                                                moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                canMove = true;
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 2 && targetBlockBottomInfo.blockData.blockSize == 3) {
                                            //2x1 & 2x2
                                            if (canStepRight(targetBlockInfo) && canStepRight(targetBlockBottomInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1)) {
                                                moveBlockBy(targetBlockInfo, 0, 1);
                                                moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                canMove = true;
                                            }
                                        }
                                    } else if (targetBlockInfo.blockStartsHere && !targetBlockBottomInfo.blockStartsHere) {
                                        //1x1 && (2x1 || 2x2)
                                        if (targetBlockInfo.blockData.blockSize == 0 && targetBlockBottomInfo.blockData.blockSize == 2) {
                                            //1x1 & 2x1
                                            if (canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 && canStepLeft(targetBlockInfo) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol - 1 && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 0 && targetBlockBottomInfo.blockData.blockSize == 3) {
                                            //1x1 & 2x2
                                            if (canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 && canStepLeft(targetBlockInfo) && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 2 && canStepLeft(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            }
                                        }
                                    } else if (!targetBlockInfo.blockStartsHere && targetBlockBottomInfo.blockStartsHere) {
                                        if (targetBlockInfo.blockData.blockSize == 1 && targetBlockBottomInfo.blockData.blockSize == 0) {
                                            //1x2 & 1x1
                                            if (relInfo.relCol == 'left' && canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            } else if (relInfo.relCol == 'right' && canStepRight(targetBlockInfo) && canStepRight(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, 1);
                                                moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                canMove = true;
                                            } else {
                                                if (selBlockPosRow == targetRow && selBlockPosCol == targetCol - 1 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol - 1 && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1)) {
                                                    moveBlockBy(targetBlockInfo, 0, -1);
                                                    moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                    canMove = true;
                                                } else if (selBlockPosRow == targetRow && selBlockPosCol == targetCol + 1 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 1 && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1)) {
                                                    moveBlockBy(targetBlockInfo, 0, 1);
                                                    moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                    canMove = true;
                                                }
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 1 && targetBlockBottomInfo.blockData.blockSize == 2) {
                                            //1x2 & 2x1
                                            if (canStepRight(targetBlockInfo) && canStepRight(targetBlockBottomInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && canStepRight(targetBlockInfo) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 1 && canStepRight(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, 1);
                                                moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                canMove = true;
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 3 && targetBlockBottomInfo.blockData.blockSize == 2) {
                                            //2x2 & 2x1
                                            if (targetBlockInfo.blockData.blockPosCol == targetCol) {
                                                if (canStepRight(targetBlockInfo) && canStepRight(targetBlockBottomInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 2 && canStepRight(targetBlockBottomInfo)) {
                                                    moveBlockBy(targetBlockInfo, 0, 1);
                                                    moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                    canMove = true;
                                                }
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 3 && targetBlockBottomInfo.blockData.blockSize == 0) {
                                            //2x2 & 1x1
                                            if (targetBlockInfo.blockData.blockPosCol == targetCol) {
                                                if (canStepRight(targetBlockInfo) && canStepRight(targetBlockBottomInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 2 && canStepRight(targetBlockBottomInfo)) {
                                                    moveBlockBy(targetBlockInfo, 0, 1);
                                                    moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                    canMove = true;
                                                }
                                            } else if (targetBlockInfo.blockData.blockPosCol == targetCol - 1) {
                                                if (canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol - 2 && canStepLeft(targetBlockBottomInfo)) {
                                                    moveBlockBy(targetBlockInfo, 0, -1);
                                                    moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                    canMove = true;
                                                }
                                            }
                                        }
                                    } else if (!targetBlockInfo.blockStartsHere && !targetBlockBottomInfo.blockStartsHere) {
                                        if (targetBlockInfo.blockData.blockSize == 2 && targetBlockBottomInfo.blockData.blockSize == 2) {
                                            //2x1 & 2x1
                                            if (canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 2 && targetBlockBottomInfo.blockData.blockSize == 3) {
                                            //2x1 & 2x2
                                            if (canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 3 && targetBlockBottomInfo.blockData.blockSize == 2) {
                                            //2x2 & 2x1
                                            if (canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            }
                                        }
                                    }
                                } else if (targetBlockInfo && !targetBlockBottomInfo) {
                                    //下方块为空
                                    var relInfo = getPosRelative(targetBlockInfo, blockPosX, blockPosY);
                                    if (targetBlockInfo.blockStartsHere) {
                                        if (targetBlockInfo.blockData.blockSize == 0) {
                                            //1x1
                                            if (relInfo.relCol == 'left' && canStepLeft(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                canMove = true;
                                            } else if (relInfo.relCol == 'right' && canStepRight(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, 1);
                                                canMove = true;
                                            } else if (relInfo.relRow == 'top' && canStepTop(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                canMove = true;
                                            } else {
                                                if (selBlockPosRow == targetRow && selBlockPosCol == targetCol - 1) {
                                                    moveBlockBy(targetBlockInfo, 0, -1);
                                                    canMove = true;
                                                } else if (selBlockPosRow == targetRow && selBlockPosCol == targetCol + 1) {
                                                    moveBlockBy(targetBlockInfo, 0, 1);
                                                    canMove = true;
                                                }
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 2) {
                                            //2x1
                                            if (canStepRight(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, 1);
                                                canMove = true;
                                            } else if (canStepTop(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                canMove = true;
                                            } else {
                                                if (selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 2) {
                                                    moveBlockBy(targetBlockInfo, 0, 1);
                                                    canMove = true;
                                                }
                                            }
                                        }
                                    } else {
                                        //基准点不在目标位置
                                        if (targetBlockInfo.blockData.blockSize == 1) {
                                            //1x2
                                            if (relInfo.relCol == 'left' && canStepLeft(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                canMove = true;
                                            } else if (relInfo.relCol == 'right' && canStepRight(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, 1);
                                                canMove = true;
                                            } else {
                                                if (selBlockPosRow == targetRow && selBlockPosCol == targetCol - 1 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                                    moveBlockBy(targetBlockInfo, 0, -1);
                                                    canMove = true;
                                                } else if (selBlockPosRow == targetRow && selBlockPosCol == targetCol + 1 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                                    moveBlockBy(targetBlockInfo, 0, 1);
                                                    canMove = true;
                                                }
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 3) {
                                            //2x2
                                            if (targetBlockInfo.blockData.blockPosCol == targetCol - 1) {
                                                if (canStepLeft(targetBlockInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol - 2) {
                                                    moveBlockBy(targetBlockInfo, 0, -1);
                                                    canMove = true;
                                                }
                                            } else if (targetBlockInfo.blockData.blockPosCol == targetCol) {
                                                if (canStepRight(targetBlockInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 2) {
                                                    moveBlockBy(targetBlockInfo, 0, 1);
                                                    canMove = true;
                                                }
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 2) {
                                            //2x1
                                            if (canStepLeft(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                canMove = true;
                                            } else if (canStepTop(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                canMove = true;
                                            } else {
                                                if (selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol - 2) {
                                                    moveBlockBy(targetBlockInfo, 0, -1);
                                                    canMove = true;
                                                }
                                            }
                                        }
                                    }
                                } else if (!targetBlockInfo && targetBlockBottomInfo) {
                                    //目标位置为空，下方不为空
                                    var relBottomInfo = getPosRelative(targetBlockBottomInfo, blockPosX, blockPosY);
                                    if (targetBlockBottomInfo.blockStartsHere) {
                                        //基准点在目标下方位置
                                        if (targetBlockBottomInfo.blockData.blockSize == 0) {
                                            //1x1
                                            if (relBottomInfo.relCol == 'left' && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            } else if (relBottomInfo.relCol == 'right' && canStepRight(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                canMove = true;
                                            } else if (relBottomInfo.relRow == 'down' && canStepDown(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockBottomInfo, 1, 0);
                                                canMove = true;
                                            } else {
                                                if (canStepLeft(targetBlockBottomInfo)) {
                                                    moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                } else if (canStepRight(targetBlockBottomInfo)) {
                                                    moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                } else if (canStepDown(targetBlockBottomInfo)) {
                                                    moveBlockBy(targetBlockBottomInfo, 1, 0);
                                                } else {
                                                    moveBlockTo(targetBlockBottomInfo, selBlockPosRow + 1, selBlockPosCol);
                                                }
                                                canMove = true;
                                            }
                                        } else if (targetBlockBottomInfo.blockData.blockSize == 1) {
                                            //1x2
                                            if (relBottomInfo.relCol == 'left' && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            } else if (relBottomInfo.relCol == 'right' && canStepRight(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                canMove = true;
                                            } else {
                                                if (selBlockPosRow == targetRow && selBlockPosCol == targetCol - 1 && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1)) {
                                                    moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                    canMove = true;
                                                } else if (selBlockPosRow == targetRow && selBlockPosCol == targetCol + 1 && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1)) {
                                                    moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                    canMove = true;
                                                }
                                            }
                                        } else if (targetBlockBottomInfo.blockData.blockSize == 2) {
                                            //2x1
                                            if (canStepRight(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                canMove = true;
                                            } else if (canStepDown(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockBottomInfo, 1, 0);
                                                canMove = true;
                                            } else if (selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 2) {
                                                moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                canMove = true;
                                            }
                                        } else if (targetBlockBottomInfo.blockData.blockSize == 3) {
                                            //2x2
                                            if (canStepRight(targetBlockBottomInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 2) {
                                                moveBlockBy(targetBlockBottomInfo, 0, 1);
                                                canMove = true;
                                            }
                                        }
                                    } else {
                                        //基准点不在目标下方位置
                                        if (targetBlockBottomInfo.blockData.blockSize == 2) {
                                            //2x1
                                            if (canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            } else if (canStepDown(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockBottomInfo, 1, 0);
                                                canMove = true;
                                            } else {
                                                if ((selBlockPosRow == targetRow || selBlockPosRow == targetRow + 1) && selBlockPosCol == targetCol - 2) {
                                                    moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                    canMove = true;
                                                }
                                            }
                                        } else if (targetBlockBottomInfo.blockData.blockSize == 3) {
                                            //2x2
                                            if (canStepLeft(targetBlockBottomInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 2) {
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            }
                                        }
                                    }
                                }
                        }
                }
                //当选中的块是2x1时
                else if (selblockSize == 2) {
                        var targetBlockInfo = getBlockInfoByPos(targetRow, targetCol);
                        //目标位置下方位置的块信息
                        var targetBlockRightInfo = getBlockInfoByPos(targetRow, targetCol + 1);
                        //向左移动一格
                        if (targetRow == selBlockPosRow && targetCol == selBlockPosCol - 1) {
                            //目标位置为空
                            if (!targetBlockInfo) {
                                canMove = true;
                            } else if (targetBlockInfo.blockStartsHere) {
                                //目标基准点在此位置
                                if (targetBlockInfo.blockData.blockSize == 0) {
                                    //1x1
                                    if (canStepLeft(targetBlockInfo)) {
                                        moveBlockBy(targetBlockInfo, 0, -1);
                                    } else if (canStepTop(targetBlockInfo)) {
                                        moveBlockBy(targetBlockInfo, -1, 0);
                                    } else if (canStepDown(targetBlockInfo)) {
                                        moveBlockBy(targetBlockInfo, 1, 0);
                                    } else {
                                        moveBlockTo(targetBlockInfo, selBlockPosRow, selBlockPosCol + 1);
                                    }
                                    canMove = true;
                                } else if (targetBlockInfo.blockData.blockSize == 1) {
                                    //1x2
                                    if (canStepLeft(targetBlockInfo)) {
                                        moveBlockBy(targetBlockInfo, 0, -1);
                                        canMove = true;
                                    } else if (canStepDown(targetBlockInfo)) {
                                        moveBlockBy(targetBlockInfo, 1, 0);
                                        canMove = true;
                                    } else if (!checkPosOccupied(selBlockPosRow, selBlockPosCol)) {
                                        moveBlockTo(targetBlockInfo, selBlockPosRow, selBlockPosCol + 1);
                                    }
                                }
                            } else {
                                if (targetBlockInfo.blockData.blockSize == 1) {
                                    //1x2
                                    if (canStepLeft(targetBlockInfo)) {
                                        moveBlockBy(targetBlockInfo, 0, -1);
                                        canMove = true;
                                    } else if (canStepTop(targetBlockInfo)) {
                                        moveBlockBy(targetBlockInfo, -1, 0);
                                        canMove = true;
                                    } else if (!checkPosOccupied(selBlockPosRow - 2, selBlockPosCol)) {
                                        moveBlockTo(targetBlockInfo, selBlockPosRow - 1, selBlockPosCol + 1);
                                    }
                                } else if (targetBlockInfo.blockData.blockSize == 2) {
                                    //2x1
                                    if (canStepLeft(targetBlockInfo)) {
                                        moveBlockBy(targetBlockInfo, 0, -1);
                                        canMove = true;
                                    } else if (canStepTop(targetBlockInfo)) {
                                        moveBlockBy(targetBlockInfo, -1, 0);
                                        canMove = true;
                                    } else if (canStepDown(targetBlockInfo)) {
                                        moveBlockBy(targetBlockInfo, 1, 0);
                                        canMove = true;
                                    }
                                } else if (targetBlockInfo.blockData.blockSize == 3) {
                                    //2x2
                                    if (targetBlockInfo.blockData.blockPosRow == targetRow) {
                                        if (canStepLeft(targetBlockInfo)) {
                                            moveBlockBy(targetBlockInfo, 0, -1);
                                            canMove = true;
                                        } else if (canStepDown(targetBlockInfo)) {
                                            moveBlockBy(targetBlockInfo, 1, 0);
                                            canMove = true;
                                        }
                                    } else {
                                        if (canStepLeft(targetBlockInfo)) {
                                            moveBlockBy(targetBlockInfo, 0, -1);
                                            canMove = true;
                                        } else if (canStepTop(targetBlockInfo)) {
                                            moveBlockBy(targetBlockInfo, -1, 0);
                                            canMove = true;
                                        }
                                    }
                                }
                            }
                        }
                        //向右移动一格
                        else if (targetRow == selBlockPosRow && targetCol == selBlockPosCol + 1) {
                                if (!targetBlockRightInfo) {
                                    canMove = true;
                                } else if (targetBlockRightInfo.blockStartsHere) {
                                    if (targetBlockRightInfo.blockData.blockSize == 0) {
                                        //1x1
                                        if (canStepRight(targetBlockRightInfo)) {
                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                        } else if (canStepTop(targetBlockRightInfo)) {
                                            moveBlockBy(targetBlockRightInfo, -1, 0);
                                        } else if (canStepDown(targetBlockRightInfo)) {
                                            moveBlockBy(targetBlockRightInfo, 1, 0);
                                        } else {
                                            moveBlockTo(targetBlockRightInfo, selBlockPosRow, selBlockPosCol);
                                        }
                                        canMove = true;
                                    } else if (targetBlockRightInfo.blockData.blockSize == 1) {
                                        //1x2
                                        if (canStepRight(targetBlockRightInfo)) {
                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                            canMove = true;
                                        } else if (canStepDown(targetBlockRightInfo)) {
                                            moveBlockBy(targetBlockRightInfo, 1, 0);
                                            canMove = true;
                                        } else if (!checkPosOccupied(selBlockPosRow, selBlockPosCol - 1)) {
                                            moveBlockTo(targetBlockRightInfo, selBlockPosRow, selBlockPosCol);
                                            canMove = true;
                                        }
                                    } else if (targetBlockRightInfo.blockData.blockSize == 2) {
                                        //2x1
                                        if (canStepRight(targetBlockRightInfo)) {
                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                            canMove = true;
                                        } else if (canStepTop(targetBlockRightInfo)) {
                                            moveBlockBy(targetBlockRightInfo, -1, 0);
                                            canMove = true;
                                        } else if (canStepDown(targetBlockRightInfo)) {
                                            moveBlockBy(targetBlockRightInfo, 1, 0);
                                            canMove = true;
                                        }
                                    } else if (targetBlockRightInfo.blockData.blockSize == 3) {
                                        //2x2
                                        if (canStepRight(targetBlockRightInfo)) {
                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                            canMove = true;
                                        } else if (canStepDown(targetBlockRightInfo)) {
                                            moveBlockBy(targetBlockRightInfo, 1, 0);
                                            canMove = true;
                                        }
                                    }
                                } else {
                                    //基准点不在此位置
                                    if (targetBlockRightInfo.blockData.blockSize == 1) {
                                        //1x2
                                        if (canStepRight(targetBlockRightInfo)) {
                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                            canMove = true;
                                        } else if (canStepTop(targetBlockRightInfo)) {
                                            moveBlockBy(targetBlockRightInfo, -1, 0);
                                            canMove = true;
                                        } else if (!checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                            moveBlockTo(targetBlockRightInfo, selBlockPosRow - 1, selBlockPosCol);
                                        }
                                    } else if (targetBlockRightInfo.blockData.blockSize == 3) {
                                        //2x2
                                        if (canStepRight(targetBlockRightInfo)) {
                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                            canMove = true;
                                        } else if (canStepTop(targetBlockRightInfo)) {
                                            moveBlockBy(targetBlockRightInfo, -1, 0);
                                            canMove = true;
                                        }
                                    }
                                }
                            }
                            //其他移动状态
                            else {
                                    if (!targetBlockInfo && !targetBlockRightInfo) {
                                        canMove = true;
                                    } else if (targetBlockInfo.blockData == targetBlockRightInfo.blockData) {
                                        var relInfo = getPosRelative(targetBlockInfo, blockPosX, blockPosY);
                                        if (targetBlockInfo.blockData.blockSize == 2) {
                                            //2x1
                                            if (relInfo.relRow == 'top' && canStepTop(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                canMove = true;
                                            } else if (relInfo.relRow == 'down' && canStepDown(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, 1, 0);
                                                canMove = true;
                                            } else if (relInfo.relCol == 'left' && canStepLeft(targetBlockInfo) && !checkPosOccupied(targetRow - 1, targetCol - 3)) {
                                                moveBlockBy(targetBlockInfo, 0, -2);
                                                canMove = true;
                                            } else if (relInfo.relCol == 'right' && canStepRight(targetBlockInfo) && !checkPosOccupied(targetRow - 1, targetCol + 2)) {
                                                moveBlockBy(targetBlockInfo, 0, 2);
                                                canMove = true;
                                            } else {
                                                moveBlockTo(targetBlockInfo, selBlockPosRow, selBlockPosCol);
                                                canMove = true;
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 3) {
                                            //2x2
                                            if (targetBlockInfo.blockStartsHere) {
                                                if (canStepDown(targetBlockInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol) {
                                                    moveBlockBy(targetBlockInfo, 1, 0);
                                                    canMove = true;
                                                } else if (selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) && !checkPosOccupied(selBlockPosRow, selBlockPosCol) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol)) {
                                                    moveBlockBy(targetBlockInfo, 0, 2);
                                                } else if (selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) && !checkPosOccupied(selBlockPosRow, selBlockPosCol) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol)) {
                                                    moveBlockBy(targetBlockInfo, 0, -2);
                                                }
                                            } else {
                                                if (canStepTop(targetBlockInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol) {
                                                    moveBlockBy(targetBlockInfo, -1, 0);
                                                    canMove = true;
                                                } else if (selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) && !checkPosOccupied(selBlockPosRow, selBlockPosCol) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol)) {
                                                    moveBlockBy(targetBlockInfo, 0, 2);
                                                } else if (selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) && !checkPosOccupied(selBlockPosRow, selBlockPosCol) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol)) {
                                                    moveBlockBy(targetBlockInfo, 0, -2);
                                                }
                                            }
                                        }
                                    }
                                    //目标位置的块不为空，右侧也不为空，且是两个不同的块
                                    else if (targetBlockInfo && targetBlockRightInfo) {
                                            var relInfo = getPosRelative(targetBlockInfo, blockPosX, blockPosY);
                                            var relRightInfo = getPosRelative(targetBlockRightInfo, blockPosX, blockPosY);
                                            if (targetBlockInfo.blockStartsHere && targetBlockRightInfo.blockStartsHere) {
                                                if (targetBlockInfo.blockData.blockSize == 0 && targetBlockRightInfo.blockData.blockSize == 0) {
                                                    //1x1 & 1x1
                                                    if (relInfo.relRow == 'down' && canStepDown(targetBlockInfo) && canStepDown(targetBlockRightInfo)) {
                                                        moveBlockBy(targetBlockInfo, 1, 0);
                                                        moveBlockBy(targetBlockRightInfo, 1, 0);
                                                        canMove = true;
                                                    } else if (relInfo.relRow == 'top' && canStepTop(targetBlockInfo) && canStepTop(targetBlockRightInfo)) {
                                                        moveBlockBy(targetBlockInfo, -1, 0);
                                                        moveBlockBy(targetBlockRightInfo, -1, 0);
                                                        canMove = true;
                                                    } else {
                                                        if (canStepLeft(targetBlockInfo) && canStepRight(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                                            canMove = true;
                                                        } else {
                                                            moveBlockTo(targetBlockInfo, selBlockPosRow, selBlockPosCol);
                                                            moveBlockTo(targetBlockRightInfo, selBlockPosRow, selBlockPosCol + 1);
                                                            canMove = true;
                                                        }
                                                    }
                                                } else if (targetBlockInfo.blockData.blockSize == 0 && targetBlockRightInfo.blockData.blockSize == 1) {
                                                    //1x1 & 1x2
                                                    if (canStepDown(targetBlockInfo) && canStepRight(targetBlockRightInfo)) {
                                                        moveBlockBy(targetBlockInfo, 1, 0);
                                                        moveBlockBy(targetBlockRightInfo, 0, 1);
                                                        canMove = true;
                                                    } else if (canStepLeft(targetBlockInfo) && canStepRight(targetBlockRightInfo)) {
                                                        moveBlockBy(targetBlockInfo, 0, -1);
                                                        moveBlockBy(targetBlockRightInfo, 0, 1);
                                                        canMove = true;
                                                    } else {
                                                        if (selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && canStepDown(targetBlockInfo)) {
                                                            moveBlockBy(targetBlockInfo, 1, 0);
                                                            moveBlockBy(targetBlockRightInfo, 1, 0);
                                                            canMove = true;
                                                        } else if (selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 1 && canStepDown(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, 1, 0);
                                                            moveBlockBy(targetBlockRightInfo, 1, 0);
                                                            canMove = true;
                                                        } else if (selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 1 && canStepRight(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, 1, 0);
                                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                                            canMove = true;
                                                        }
                                                    }
                                                } else if (targetBlockInfo.blockData.blockSize == 1 && targetBlockRightInfo.blockData.blockSize == 0) {
                                                    //1x2 & 1x1
                                                    if (canStepDown(targetBlockRightInfo) && canStepLeft(targetBlockInfo)) {
                                                        moveBlockBy(targetBlockRightInfo, 1, 0);
                                                        moveBlockBy(targetBlockInfo, 0, -1);
                                                        canMove = true;
                                                    } else if (canStepLeft(targetBlockInfo) && canStepRight(targetBlockRightInfo)) {
                                                        moveBlockBy(targetBlockInfo, 0, -1);
                                                        moveBlockBy(targetBlockRightInfo, 0, 1);
                                                        canMove = true;
                                                    } else {
                                                        if (selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && canStepDown(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, 1, 0);
                                                            moveBlockBy(targetBlockRightInfo, 1, 0);
                                                            canMove = true;
                                                        } else if (selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 1 && canStepDown(targetBlockInfo)) {
                                                            moveBlockBy(targetBlockInfo, 1, 0);
                                                            moveBlockBy(targetBlockRightInfo, 1, 0);
                                                            canMove = true;
                                                        } else if (selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 1 && canStepLeft(targetBlockInfo)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            moveBlockBy(targetBlockRightInfo, 1, 0);
                                                            canMove = true;
                                                        }
                                                    }
                                                } else if (targetBlockInfo.blockData.blockSize == 0 && targetBlockRightInfo.blockData.blockSize == 2) {
                                                    //1x1 & 2x1
                                                    if (relInfo.relRow == 'top' && canStepTop(targetBlockInfo) && canStepTop(targetBlockRightInfo)) {
                                                        moveBlockBy(targetBlockInfo, -1, 0);
                                                        moveBlockBy(targetBlockRightInfo, -1, 0);
                                                        canMove = true;
                                                    } else if (relInfo.relRow == 'down' && canStepDown(targetBlockInfo) && canStepDown(targetBlockRightInfo)) {
                                                        moveBlockBy(targetBlockInfo, 1, 0);
                                                        moveBlockBy(targetBlockRightInfo, 1, 0);
                                                        canMove = true;
                                                    } else if (!checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1)) {
                                                        moveBlockTo(targetBlockInfo, selBlockPosRow, selBlockPosCol);
                                                        moveBlockTo(targetBlockRightInfo, selBlockPosRow, selBlockPosCol + 1);
                                                        canMove = true;
                                                    }
                                                } else if (targetBlockInfo.blockData.blockSize == 1 && targetBlockRightInfo.blockData.blockSize == 2) {
                                                    //1x2 & 2x1
                                                    if (canStepLeft(targetBlockInfo) && canStepDown(targetBlockRightInfo)) {
                                                        moveBlockBy(targetBlockInfo, 0, -1);
                                                        moveBlockBy(targetBlockRightInfo, 1, 0);
                                                        canMove = true;
                                                    } else if (canStepLeft(targetBlockInfo) && canStepRight(targetBlockRightInfo)) {
                                                        moveBlockBy(targetBlockInfo, 0, -1);
                                                        moveBlockBy(targetBlockRightInfo, 0, 1);
                                                        canMove = true;
                                                    } else {
                                                        if (selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && canStepDown(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, 1, 0);
                                                            moveBlockBy(targetBlockRightInfo, 1, 0);
                                                            canMove = true;
                                                        } else if (selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 1 && canStepDown(targetBlockInfo)) {
                                                            moveBlockBy(targetBlockInfo, 1, 0);
                                                            moveBlockBy(targetBlockRightInfo, 1, 0);
                                                            canMove = true;
                                                        } else if (selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 1 && canStepLeft(targetBlockInfo)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            moveBlockBy(targetBlockRightInfo, 1, 0);
                                                            canMove = true;
                                                        }
                                                    }
                                                } else if (targetBlockInfo.blockData.blockSize == 0 && targetBlockRightInfo.blockData.blockSize == 3) {
                                                    //1x1 & 2x2
                                                    if (canStepDown(targetBlockInfo) && canStepDown(targetBlockRightInfo)) {
                                                        moveBlockBy(targetBlockInfo, 1, 0);
                                                        moveBlockBy(targetBlockRightInfo, 1, 0);
                                                        canMove = true;
                                                    } else if (canStepDown(targetBlockInfo) && canStepRight(targetBlockRightInfo)) {
                                                        moveBlockBy(targetBlockInfo, 1, 0);
                                                        moveBlockBy(targetBlockRightInfo, 0, 1);
                                                        canMove = true;
                                                    } else if (canStepLeft(targetBlockInfo) && canStepRight(targetBlockRightInfo)) {
                                                        moveBlockBy(targetBlockInfo, 0, -1);
                                                        moveBlockBy(targetBlockRightInfo, 0, 1);
                                                        canMove = true;
                                                    } else if (canStepLeft(targetBlockInfo) && canStepDown(targetBlockRightInfo)) {
                                                        moveBlockBy(targetBlockInfo, 0, -1);
                                                        moveBlockBy(targetBlockRightInfo, 1, 0);
                                                        canMove = true;
                                                    } else {
                                                        if (selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol) {
                                                            if (canStepDown(targetBlockInfo)) {
                                                                if (!checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1)) {
                                                                    moveBlockBy(targetBlockInfo, 1, 0);
                                                                    moveBlockBy(targetBlockRightInfo, 1, 0);
                                                                    canMove = true;
                                                                } else if (canStepRight(targetBlockRightInfo)) {
                                                                    moveBlockBy(targetBlockInfo, 1, 0);
                                                                    moveBlockBy(targetBlockRightInfo, 0, 1);
                                                                    canMove = true;
                                                                }
                                                            } else if (canStepLeft(targetBlockInfo)) {
                                                                if (!checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1)) {
                                                                    moveBlockBy(targetBlockInfo, 0, -1);
                                                                    moveBlockBy(targetBlockRightInfo, 1, 0);
                                                                    canMove = true;
                                                                } else if (canStepRight(targetBlockRightInfo)) {
                                                                    moveBlockBy(targetBlockInfo, 0, -1);
                                                                    moveBlockBy(targetBlockRightInfo, 0, 1);
                                                                    canMove = true;
                                                                }
                                                            }
                                                        } else if (selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 1) {
                                                            if (canStepDown(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockInfo, 1, 0);
                                                                moveBlockBy(targetBlockRightInfo, 1, 0);
                                                                canMove = true;
                                                            } else if (canStepRight(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockInfo, 1, 0);
                                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                                                canMove = true;
                                                            }
                                                        }
                                                    }
                                                } else if (targetBlockInfo.blockData.blockSize == 1 && targetBlockRightInfo.blockData.blockSize == 1) {
                                                    //1x2 & 1x2
                                                    if (canStepDown(targetBlockInfo) && canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol) {
                                                        moveBlockBy(targetBlockInfo, 1, 0);
                                                        moveBlockBy(targetBlockRightInfo, 1, 0);
                                                        canMove = true;
                                                    } else if (canStepLeft(targetBlockInfo) && canStepRight(targetBlockRightInfo)) {
                                                        moveBlockBy(targetBlockInfo, 0, -1);
                                                        moveBlockBy(targetBlockRightInfo, 0, 1);
                                                        canMove = true;
                                                    }
                                                } else if (targetBlockInfo.blockData.blockSize == 1 && targetBlockRightInfo.blockData.blockSize == 3) {
                                                    //1x2 & 2x2
                                                    if (canStepDown(targetBlockInfo) && canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1)) {
                                                        moveBlockBy(targetBlockInfo, 1, 0);
                                                        moveBlockBy(targetBlockRightInfo, 1, 0);
                                                        canMove = true;
                                                    }
                                                }
                                            } else if (targetBlockInfo.blockStartsHere && !targetBlockRightInfo.blockStartsHere) {
                                                if (targetBlockInfo.blockData.blockSize == 0) {
                                                    //目标位置1x1
                                                    if (targetBlockRightInfo.blockData.blockSize == 1) {
                                                        //目标右侧1x2
                                                        if (canStepTop(targetBlockInfo) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol && canStepTop(targetBlockInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol + 1 && canStepTop(targetBlockInfo) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol - 1 && canStepTop(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, -1, 0);
                                                            moveBlockBy(targetBlockRightInfo, -1, 0);
                                                            canMove = true;
                                                        } else if (canStepLeft(targetBlockInfo) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) && canStepLeft(targetBlockInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) && canStepLeft(targetBlockInfo)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                                            canMove = true;
                                                        } else if (canStepTop(targetBlockInfo) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) && canStepTop(targetBlockInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) && canStepTop(targetBlockInfo)) {
                                                            moveBlockBy(targetBlockInfo, -1, 0);
                                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                                            canMove = true;
                                                        } else if (canStepLeft(targetBlockInfo) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol && canStepLeft(targetBlockInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol + 1 && canStepLeft(targetBlockInfo)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            moveBlockBy(targetBlockRightInfo, -1, 0);
                                                            canMove = true;
                                                        }
                                                    } else if (targetBlockRightInfo.blockData.blockSize == 3) {
                                                        //目标右侧2x2
                                                        if (canStepTop(targetBlockInfo) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol && canStepTop(targetBlockInfo) && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol - 1 && canStepTop(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, -1, 0);
                                                            moveBlockBy(targetBlockRightInfo, -1, 0);
                                                            canMove = true;
                                                        } else if (canStepLeft(targetBlockInfo) && canStepRight(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                                            canMove = true;
                                                        } else if (canStepTop(targetBlockInfo) && canStepRight(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, -1, 0);
                                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                                            canMove = true;
                                                        } else if (canStepLeft(targetBlockInfo) && canStepTop(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            moveBlockBy(targetBlockRightInfo, -1, 0);
                                                            canMove = true;
                                                        }
                                                    }
                                                } else if (targetBlockInfo.blockData.blockSize == 1) {
                                                    //目标位置1x2
                                                    if (targetBlockRightInfo.blockData.blockSize == 1) {
                                                        //目标右侧1x2
                                                        if (canStepLeft(targetBlockInfo) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                                            canMove = true;
                                                        }
                                                    } else if (targetBlockRightInfo.blockData.blockSize == 3) {
                                                        //目标右侧2x2
                                                        if (canStepLeft(targetBlockInfo) && canStepRight(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                                            canMove = true;
                                                        }
                                                    }
                                                }
                                            } else if (!targetBlockInfo.blockStartsHere && targetBlockRightInfo.blockStartsHere) {
                                                if (targetBlockInfo.blockData.blockSize == 1) {
                                                    //目标位置1x2
                                                    if (targetBlockRightInfo.blockData.blockSize == 0) {
                                                        //目标右侧1x1
                                                        if (canStepTop(targetBlockInfo) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol - 1 && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 1 && canStepTop(targetBlockInfo)) {
                                                            moveBlockBy(targetBlockInfo, -1, 0);
                                                            moveBlockBy(targetBlockRightInfo, -1, 0);
                                                            canMove = true;
                                                        } else if (canStepTop(targetBlockInfo) && canStepRight(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, -1, 0);
                                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                                            canMove = true;
                                                        } else if (canStepLeft(targetBlockInfo) && canStepRight(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                                            canMove = true;
                                                        } else if (canStepLeft(targetBlockInfo) && canStepTop(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            moveBlockBy(targetBlockRightInfo, -1, 0);
                                                            canMove = true;
                                                        }
                                                    } else if (targetBlockRightInfo.blockData.blockSize == 1) {
                                                        //目标右侧1x2
                                                        if (canStepLeft(targetBlockInfo) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) && canStepLeft(targetBlockInfo) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) && canStepLeft(targetBlockInfo)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                                            canMove = true;
                                                        }
                                                    } else if (targetBlockRightInfo.blockData.blockSize == 2) {
                                                        //目标右侧2x1
                                                        if (canStepTop(targetBlockInfo) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol - 1 && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 1 && canStepTop(targetBlockInfo)) {
                                                            moveBlockBy(targetBlockInfo, -1, 0);
                                                            moveBlockBy(targetBlockRightInfo, -1, 0);
                                                            canMove = true;
                                                        } else if (canStepLeft(targetBlockInfo) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol) && canStepTop(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            moveBlockBy(targetBlockRightInfo, -1, 0);
                                                            canMove = true;
                                                        }
                                                    } else if (targetBlockRightInfo.blockData.blockSize == 3) {//目标右侧2x2
                                                        //不需要处理
                                                    }
                                                } else if (targetBlockInfo.blockData.blockSize == 2) {
                                                    //目标位置2x1
                                                    if (targetBlockRightInfo.blockData.blockSize == 0) {
                                                        //目标右侧1x1
                                                        if (relInfo.relRow == 'down' && canStepDown(targetBlockInfo) && canStepDown(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, 1, 0);
                                                            moveBlockBy(targetBlockRightInfo, 1, 0);
                                                            canMove = true;
                                                        } else if (relInfo.relRow == 'top' && canStepTop(targetBlockInfo) && canStepTop(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, -1, 0);
                                                            moveBlockBy(targetBlockRightInfo, -1, 0);
                                                            canMove = true;
                                                        } else {
                                                            if (selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2)) {
                                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                                moveBlockBy(targetBlockRightInfo, -1, 0);
                                                                canMove = true;
                                                            } else if (selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2)) {
                                                                moveBlockBy(targetBlockInfo, 1, 0);
                                                                moveBlockBy(targetBlockRightInfo, 1, 0);
                                                                canMove = true;
                                                            } else if (selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol && canStepLeft(targetBlockInfo)) {
                                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                                moveBlockBy(targetBlockRightInfo, -1, 0);
                                                                canMove = true;
                                                            } else if (selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol && canStepLeft(targetBlockInfo)) {
                                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                                moveBlockBy(targetBlockRightInfo, 1, 0);
                                                                canMove = true;
                                                            }
                                                        }
                                                    } else if (targetBlockRightInfo.blockData.blockSize == 1) {
                                                        //目标右侧1x2
                                                        if (canStepDown(targetBlockInfo) && canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && canStepDown(targetBlockInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol + 1 && canStepDown(targetBlockInfo) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 1 && canStepDown(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, 1, 0);
                                                            moveBlockBy(targetBlockRightInfo, 1, 0);
                                                            canMove = true;
                                                        } else if (canStepDown(targetBlockInfo) && canStepRight(targetBlockRightInfo) || canStepDown(targetBlockInfo) && selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) || canStepDown(targetBlockInfo) && selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                                            moveBlockBy(targetBlockInfo, 1, 0);
                                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                                            canMove = true;
                                                        }
                                                    } else if (targetBlockRightInfo.blockData.blockSize == 2) {
                                                        //目标右侧2x1
                                                        if (relInfo.relRow == 'top' && canStepTop(targetBlockInfo) && canStepTop(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, -1, 0);
                                                            moveBlockBy(targetBlockRightInfo, -1, 0);
                                                            canMove = true;
                                                        } else if (relInfo.relRow == 'down' && canStepDown(targetBlockInfo) && canStepDown(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, 1, 0);
                                                            moveBlockBy(targetBlockRightInfo, 1, 0);
                                                            canMove = true;
                                                        } else {
                                                            if (selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1)) {
                                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                                moveBlockBy(targetBlockRightInfo, -1, 0);
                                                                canMove = true;
                                                            } else if (selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1)) {
                                                                moveBlockBy(targetBlockInfo, 1, 0);
                                                                moveBlockBy(targetBlockRightInfo, 1, 0);
                                                                canMove = true;
                                                            }
                                                        }
                                                    } else if (targetBlockRightInfo.blockData.blockSize == 3) {
                                                        //目标右侧2x2
                                                        if (canStepDown(targetBlockInfo) && canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1) && canStepDown(targetBlockInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol + 1 && canStepDown(targetBlockInfo) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 1 && canStepDown(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, 1, 0);
                                                            moveBlockBy(targetBlockRightInfo, 1, 0);
                                                            canMove = true;
                                                        } else if (canStepDown(targetBlockInfo) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 1 && canStepRight(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, 1, 0);
                                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                                            canMove = true;
                                                        } else if (canStepLeft(targetBlockInfo) && canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1) && canStepLeft(targetBlockInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol + 1 && canStepLeft(targetBlockInfo)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            moveBlockBy(targetBlockRightInfo, 1, 0);
                                                            canMove = true;
                                                        }
                                                    }
                                                } else if (targetBlockInfo.blockData.blockSize == 3) {
                                                    //目标位置2x2
                                                    if (targetBlockInfo.blockData.blockPosRow == targetRow) {
                                                        //基准点在左侧
                                                        if (targetBlockRightInfo.blockData.blockSize == 0) {
                                                            //目标右侧1x1
                                                            if (canStepDown(targetBlockInfo) && canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) && canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol - 1 && canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 1 && canStepDown(targetBlockInfo)) {
                                                                moveBlockBy(targetBlockInfo, 1, 0);
                                                                moveBlockBy(targetBlockRightInfo, 1, 0);
                                                                canMove = true;
                                                            } else if (canStepDown(targetBlockInfo) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol - 1 && canStepRight(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockInfo, 1, 0);
                                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                                                canMove = true;
                                                            } else if (canStepLeft(targetBlockInfo) && canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 1 && canStepLeft(targetBlockInfo)) {
                                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                                moveBlockBy(targetBlockRightInfo, 1, 0);
                                                                canMove = true;
                                                            } else if (canStepLeft(targetBlockInfo) && canStepRight(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                                                canMove = true;
                                                            }
                                                        } else if (targetBlockRightInfo.blockData.blockSize == 1) {
                                                            //目标右侧1x2
                                                            if (canStepDown(targetBlockInfo) && canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol - 1 && canStepDown(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockInfo, 1, 0);
                                                                moveBlockBy(targetBlockRightInfo, 1, 0);
                                                                canMove = true;
                                                            } else if (canStepLeft(targetBlockInfo) && canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && canStepLeft(targetBlockInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 3 && !checkPosOccupied(selBlockPosRow, selBlockPosCol) && canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 3 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol) && canStepDown(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                                moveBlockBy(targetBlockRightInfo, 1, 0);
                                                                canMove = true;
                                                            } else if (canStepDown(targetBlockInfo) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosRow == targetCol - 1 && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) && canStepDown(targetBlockInfo) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1) && canStepDown(targetBlockInfo)) {
                                                                moveBlockBy(targetBlockInfo, 1, 0);
                                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                                                canMove = true;
                                                            } else if (canStepLeft(targetBlockInfo) && canStepRight(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                                                canMove = true;
                                                            }
                                                        } else if (targetBlockRightInfo.blockData.blockSize == 2) {
                                                            //目标右侧2x1
                                                            if (canStepDown(targetBlockInfo) && canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) && canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol - 1 && canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 1 && canStepDown(targetBlockInfo)) {
                                                                moveBlockBy(targetBlockInfo, 1, 0);
                                                                moveBlockBy(targetBlockRightInfo, 1, 0);
                                                                canMove = true;
                                                            } else if (canStepDown(targetBlockInfo) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol - 1 && canStepRight(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockInfo, 1, 0);
                                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                                                canMove = true;
                                                            }
                                                        } else if (targetBlockRightInfo.blockData.blockSize == 3) {
                                                            //目标右侧2x2
                                                            if (canStepDown(targetBlockInfo) && canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol - 1 && canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol + 1 && canStepDown(targetBlockInfo)) {
                                                                moveBlockBy(targetBlockInfo, 1, 0);
                                                                moveBlockBy(targetBlockRightInfo, 1, 0);
                                                                canMove = true;
                                                            } else if (canStepDown(targetBlockInfo) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol - 1 && canStepRight(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockInfo, 1, 0);
                                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                                                canMove = true;
                                                            } else if (canStepLeft(targetBlockInfo) && canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1) && canStepLeft(targetBlockInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol + 1 && canStepLeft(targetBlockInfo)) {
                                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                                moveBlockBy(targetBlockRightInfo, 1, 0);
                                                                canMove = true;
                                                            }
                                                        }
                                                    } else {
                                                        //基准点在左上方
                                                        if (targetBlockRightInfo.blockData.blockSize == 0) {
                                                            //目标右侧1x1
                                                            if (canStepTop(targetBlockInfo) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol - 1 && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 1 && canStepTop(targetBlockInfo)) {
                                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                                moveBlockBy(targetBlockRightInfo, -1, 0);
                                                                canMove = true;
                                                            } else if (canStepTop(targetBlockInfo) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol - 1 && canStepRight(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                                                canMove = true;
                                                            } else if (canStepLeft(targetBlockInfo) && canStepTop(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                                moveBlockBy(targetBlockRightInfo, -1, 0);
                                                                canMove = true;
                                                            } else if (canStepLeft(targetBlockInfo) && canStepRight(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                                                canMove = true;
                                                            }
                                                        } else if (targetBlockRightInfo.blockData.blockSize == 1) {//目标右侧1x2
                                                            //不需要处理
                                                        } else if (targetBlockRightInfo.blockData.blockSize == 2) {
                                                            //目标右侧2x1
                                                            if (canStepTop(targetBlockInfo) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol - 1 && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 1 && canStepTop(targetBlockInfo)) {
                                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                                moveBlockBy(targetBlockRightInfo, -1, 0);
                                                                canMove = true;
                                                            } else if (canStepTop(targetBlockInfo) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol - 1 && canStepRight(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                                                canMove = true;
                                                            } else if (canStepLeft(targetBlockInfo) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 1 && canStepLeft(targetBlockInfo)) {
                                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                                moveBlockBy(targetBlockRightInfo, -1, 0);
                                                                canMove = true;
                                                            }
                                                        } else if (targetBlockRightInfo.blockData.blockSize == 3) {//目标右侧2x2
                                                            //不需要处理
                                                        }
                                                    }
                                                }
                                            } else if (!targetBlockInfo.blockStartsHere && !targetBlockRightInfo.blockStartsHere) {
                                                //1x2 & 1x2
                                                if (targetBlockInfo.blockData.blockSize == 1 && targetBlockRightInfo.blockData.blockSize == 1) {
                                                    if (canStepTop(targetBlockInfo) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol - 1 && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol + 1 && canStepTop(targetBlockInfo)) {
                                                        moveBlockBy(targetBlockInfo, -1, 0);
                                                        moveBlockBy(targetBlockRightInfo, -1, 0);
                                                        canMove = true;
                                                    } else if (canStepTop(targetBlockInfo) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol - 1 && canStepRight(targetBlockRightInfo)) {
                                                        moveBlockBy(targetBlockInfo, -1, 0);
                                                        moveBlockBy(targetBlockRightInfo, 0, 1);
                                                        canMove = true;
                                                    } else if (canStepLeft(targetBlockInfo) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && cslBlockPosCol == targetCol + 1 && canStepLeft(targetBlockInfo)) {
                                                        moveBlockBy(targetBlockInfo, 0, -1);
                                                        moveBlockBy(targetBlockRightInfo, -1, 0);
                                                        canMove = true;
                                                    } else if (canStepLeft(targetBlockInfo) && canStepRight(targetBlockRightInfo)) {
                                                        moveBlockBy(targetBlockInfo, 0, -1);
                                                        moveBlockBy(targetBlockRightInfo, 0, 1);
                                                        canMove = true;
                                                    }
                                                }
                                                //1x2 & 2x2
                                                else if (targetBlockInfo.blockData.blockSize == 1 && targetBlockRightInfo.blockData.blockSize == 3) {
                                                        if (canStepTop(targetBlockInfo) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol + 1 && canStepTop(targetBlockInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol - 1 && canStepTop(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, -1, 0);
                                                            moveBlockBy(targetBlockRightInfo, -1, 0);
                                                            canMove = true;
                                                        } else if (canStepTop(targetBlockInfo) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol && canStepRight(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, -1, 0);
                                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                                            canMove = true;
                                                        } else if (canStepLeft(targetBlockInfo) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol + 1 && canStepLeft(targetBlockInfo)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            moveBlockBy(targetBlockRightInfo, -1, 0);
                                                            canMove = true;
                                                        } else if (canStepLeft(targetBlockInfo) && canStepRight(targetBlockRightInfo)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            moveBlockBy(targetBlockRightInfo, 0, 1);
                                                            canMove = true;
                                                        }
                                                    }
                                                    //2x2 & 1x2
                                                    else if (targetBlockInfo.blockData.blockSize == 3 && targetBlockRightInfo.blockData.blockSize == 1) {
                                                            if (canStepTop(targetBlockInfo) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol - 1 && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol + 1 && canStepTop(targetBlockInfo)) {
                                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                                moveBlockBy(targetBlockRightInfo, -1, 0);
                                                                canMove = true;
                                                            } else if (canStepTop(targetBlockInfo) && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol - 1 && canStepRight(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                                                canMove = true;
                                                            } else if (canStepLeft(targetBlockInfo) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol && canStepLeft(targetBlockInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol + 1 && canStepLeft(targetBlockInfo)) {
                                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                                moveBlockBy(targetBlockRightInfo, -1, 0);
                                                                canMove = true;
                                                            } else if (canStepLeft(targetBlockInfo) && canStepRight(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                                                canMove = true;
                                                            }
                                                        } else if (targetBlockInfo.blockData.blockSize == 3 && targetBlockRightInfo.blockData.blockSize == 3) {
                                                            if (canStepTop(targetBlockInfo) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol - 1 && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol + 1 && canStepTop(targetBlockInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1) && canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) && canStepTop(targetBlockInfo)) {
                                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                                moveBlockBy(targetBlockRightInfo, -1, 0);
                                                                canMove = true;
                                                            }
                                                        }
                                            }
                                        }
                                        //目标位置不为空，右侧为空
                                        else if (targetBlockInfo && !targetBlockRightInfo) {
                                                var relInfo = getPosRelative(targetBlockInfo, blockPosX, blockPosY);
                                                if (targetBlockInfo.blockStartsHere) {
                                                    if (targetBlockInfo.blockData.blockSize == 0) {
                                                        //1x1
                                                        if (relInfo.relCol == 'left' && canStepLeft(targetBlockInfo)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            canMove = true;
                                                        } else if (relInfo.relRow == 'top' && canStepTop(targetBlockInfo)) {
                                                            moveBlockBy(targetBlockInfo, -1, 0);
                                                            canMove = true;
                                                        } else if (relInfo.relRow == 'down' && canStepDown(targetBlockInfo)) {
                                                            moveBlockBy(targetBlockInfo, 1, 0);
                                                            canMove = true;
                                                        } else {
                                                            moveBlockTo(targetBlockInfo, selBlockPosRow, selBlockPosCol);
                                                            canMove = true;
                                                        }
                                                    } else if (targetBlockInfo.blockData.blockSize == 1) {
                                                        //1x2
                                                        if (relInfo.relCol == 'left' && canStepLeft(targetBlockInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            canMove = true;
                                                        } else if (relInfo.relRow == 'down' && canStepDown(targetBlockInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol - 1) {
                                                            moveBlockBy(targetBlockInfo, 1, 0);
                                                            canMove = true;
                                                        }
                                                    }
                                                } else {
                                                    if (targetBlockInfo.blockData.blockSize == 1) {
                                                        //1x2
                                                        if (relInfo.relCol == 'left' && canStepLeft(targetBlockInfo) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            canMove = true;
                                                        } else if (relInfo.relRow == 'top' && canStepTop(targetBlockInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol - 1) {
                                                            moveBlockBy(targetBlockInfo, -1, 0);
                                                            canMove = true;
                                                        }
                                                    } else if (targetBlockInfo.blockData.blockSize == 2) {
                                                        //2x1
                                                        if (canStepLeft(targetBlockInfo)) {
                                                            moveBlockBy(targetBlockInfo, 0, -1);
                                                            canMove = true;
                                                        } else if (relInfo.relRow == 'top' && canStepTop(targetBlockInfo)) {
                                                            moveBlockBy(targetBlockInfo, -1, 0);
                                                            canMove = true;
                                                        } else if (relInfo.relRow == 'down' && canStepDown(targetBlockInfo)) {
                                                            moveBlockBy(targetBlockInfo, 1, 0);
                                                            canMove = true;
                                                        } else {
                                                            if (selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 1) {
                                                                moveBlockBy(targetBlockInfo, 1, 0);
                                                                canMove = true;
                                                            } else if (selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol - 1) {
                                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                                canMove = true;
                                                            }
                                                        }
                                                    } else if (targetBlockInfo.blockData.blockSize == 3) {
                                                        //2x2
                                                        if (targetBlockInfo.blockData.blockPosRow == targetRow) {
                                                            if (canStepDown(targetBlockInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol - 1) {
                                                                moveBlockBy(targetBlockInfo, 1, 0);
                                                                canMove = true;
                                                            } else if (canStepLeft(targetBlockInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 3 && !checkPosOccupied(selBlockPosRow, selBlockPosCol) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 3 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol)) {
                                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                                canMove = true;
                                                            }
                                                        } else if (targetBlockInfo.blockData.blockPosRow == targetRow - 1) {
                                                            if (canStepTop(targetBlockInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol - 1) {
                                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                                canMove = true;
                                                            } else if (canStepLeft(targetBlockInfo) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol - 3 && !checkPosOccupied(selBlockPosRow, selBlockPosCol) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 3 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol)) {
                                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                                canMove = true;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                            //目标位置为空，右侧不为空
                                            else if (!targetBlockInfo && targetBlockRightInfo) {
                                                    //TODO
                                                    var relRightInfo = getPosRelative(targetBlockRightInfo, blockPosX, blockPosY);
                                                    if (targetBlockRightInfo.blockStartsHere) {
                                                        if (targetBlockRightInfo.blockData.blockSize == 0) {
                                                            //1x1
                                                            if (relRightInfo.relCol == 'right' && canStepRight(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                                            } else if (relRightInfo.relRow == 'top' && canStepTop(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockRightInfo, -1, 0);
                                                            } else if (relRightInfo.relRow == 'down' && canStepDown(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockRightInfo, 1, 0);
                                                            } else {
                                                                moveBlockTo(targetBlockRightInfo, selBlockPosRow, selBlockPosCol + 1);
                                                            }
                                                            canMove = true;
                                                        } else if (targetBlockRightInfo.blockData.blockSize == 1) {
                                                            //1x2
                                                            if (relRightInfo.relCol == 'right' && canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                                                canMove = true;
                                                            } else if (canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && (selBlockPosCol == targetCol || selBlockPosCol == targetCol - 1)) {
                                                                moveBlockBy(targetBlockRightInfo, 1, 0);
                                                                canMove = true;
                                                            }
                                                        } else if (targetBlockRightInfo.blockData.blockSize == 2) {
                                                            //2x1
                                                            if (canStepRight(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                                                canMove = true;
                                                            } else if (relRightInfo.relRow == 'top' && canStepTop(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockRightInfo, -1, 0);
                                                                canMove = true;
                                                            } else if (relRightInfo.relRow == 'down' && canStepDown(targetBlockRightInfo)) {
                                                                moveBlockBy(targetBlockRightInfo, 1, 0);
                                                                canMove = true;
                                                            } else if (selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 1) {
                                                                moveBlockBy(targetBlockRightInfo, -1, 0);
                                                                canMove = true;
                                                            } else if (selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 1) {
                                                                moveBlockBy(targetBlockRightInfo, 1, 0);
                                                                canMove = true;
                                                            }
                                                        } else if (targetBlockRightInfo.blockData.blockSize == 3) {
                                                            //2x2
                                                            if (canStepDown(targetBlockRightInfo) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1) || selBlockPosRow == targetRow + 2 && selBlockPosCol == targetCol + 1) {
                                                                moveBlockBy(targetBlockRightInfo, 1, 0);
                                                                canMove = true;
                                                            } else if (canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 3 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 3 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                                                canMove = true;
                                                            }
                                                        }
                                                    } else {
                                                        if (targetBlockRightInfo.blockData.blockSize == 1) {
                                                            //1x2
                                                            if (canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                                                canMove = true;
                                                            } else if (canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && (selBlockPosCol == targetCol || selBlockPosCol == targetCol + 1)) {
                                                                moveBlockBy(targetBlockRightInfo, -1, 0);
                                                                canMove = true;
                                                            }
                                                        } else if (targetBlockRightInfo.blockData.blockSize == 3) {
                                                            //2x2
                                                            if (canStepTop(targetBlockRightInfo) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1) || selBlockPosRow == targetRow - 2 && selBlockPosCol == targetCol + 1) {
                                                                moveBlockBy(targetBlockRightInfo, -1, 0);
                                                                canMove = true;
                                                            } else if (canStepRight(targetBlockRightInfo) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 3 && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 1) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 3 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                                                canMove = true;
                                                            }
                                                        }
                                                    }
                                                }
                                }
                    }
                    //当选中的块是2x2时
                    else if (selblockSize == 3) {

                            var targetBlockInfo = getBlockInfoByPos(targetRow, targetCol);
                            var targetBlockRightInfo = getBlockInfoByPos(targetRow, targetCol + 1);
                            var targetBlockBottomInfo = getBlockInfoByPos(targetRow + 1, targetCol);
                            var targetBlockBottomRightInfo = getBlockInfoByPos(targetRow + 1, targetCol + 1);

                            //向左移动一格
                            if (targetRow == selBlockPosRow && targetCol == selBlockPosCol - 1) {
                                if (!targetBlockInfo && !targetBlockBottomInfo) {
                                    canMove = true;
                                } else if (targetBlockInfo.blockData == targetBlockBottomInfo.blockData) {
                                    if (targetBlockInfo.blockData.blockSize == 1) {
                                        //1x2
                                        if (canStepLeft(targetBlockInfo)) {
                                            moveBlockBy(targetBlockInfo, 0, -1);
                                        } else {
                                            moveBlockBy(targetBlockInfo, 0, 2);
                                        }
                                        canMove = true;
                                    } else if (targetBlockInfo.blockData.blockSize == 3) {
                                        //2x2
                                        if (canStepLeft(targetBlockInfo)) {
                                            moveBlockBy(targetBlockInfo, 0, -1);
                                            canMove = true;
                                        }
                                    }
                                } else if (targetBlockInfo && !targetBlockBottomInfo) {
                                    if (targetBlockInfo.blockStartsHere) {
                                        //基准点在此
                                        if (targetBlockInfo.blockData.blockSize == 0) {
                                            //1x1
                                            if (canStepLeft(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                            } else if (canStepTop(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, -1, 0);
                                            } else {
                                                moveBlockBy(targetBlockInfo, 0, 2);
                                            }
                                            canMove = true;
                                        }
                                    } else {
                                        if (targetBlockInfo.blockData.blockSize == 1) {
                                            //1x2
                                            if (canStepLeft(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                canMove = true;
                                            } else if (!checkPosOccupied(selBlockPosRow - 2, selBlockPosCol)) {
                                                moveBlockBy(targetBlockInfo, 0, 2);
                                                canMove = true;
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 2) {
                                            //2x1
                                            if (canStepLeft(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                canMove = true;
                                            } else if (canStepTop(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                canMove = true;
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 3) {
                                            //2x2
                                            if (canStepLeft(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                canMove = true;
                                            }
                                        }
                                    }
                                } else if (!targetBlockInfo && targetBlockBottomInfo) {
                                    if (targetBlockBottomInfo.blockStartsHere) {
                                        //基准点在此
                                        if (targetBlockBottomInfo.blockData.blockSize == 0) {
                                            //1x1
                                            if (canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                            } else if (canStepDown(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockBottomInfo, 1, 0);
                                            } else {
                                                moveBlockBy(targetBlockBottomInfo, 0, 2);
                                            }
                                            canMove = true;
                                        } else if (targetBlockBottomInfo.blockData.blockSize == 1) {
                                            //1x2
                                            if (canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            } else if (!checkPosOccupied(selBlockPosRow + 1, selBlockPosCol)) {
                                                moveBlockBy(targetBlockBottomInfo, 0, 2);
                                                canMove = true;
                                            }
                                        }
                                    } else {
                                        if (targetBlockBottomInfo.blockData.blockSize == 2) {
                                            //2x1
                                            if (canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            } else if (canStepDown(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockBottomInfo, 1, 0);
                                                canMove = true;
                                            }
                                        } else if (targetBlockBottomInfo.blockData.blockSize == 3) {
                                            //2x2
                                            if (canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            }
                                        }
                                    }
                                } else if (targetBlockInfo && targetBlockBottomInfo) {
                                    if (targetBlockInfo.blockStartsHere && targetBlockBottomInfo.blockStartsHere) {
                                        if (targetBlockInfo.blockData.blockSize == 0 && targetBlockBottomInfo.blockData.blockSize == 0) {
                                            //1x1 & 1x1
                                            if (canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                            } else if (canStepLeft(targetBlockInfo) && canStepDown(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 1, 0);
                                            } else if (canStepTop(targetBlockInfo) && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                            } else {
                                                moveBlockBy(targetBlockInfo, 0, 2);
                                                moveBlockBy(targetBlockBottomInfo, 0, 2);
                                            }
                                            canMove = true;
                                        } else if (targetBlockInfo.blockData.blockSize == 0 && targetBlockBottomInfo.blockData.blockSize == 1) {
                                            //1x1 & 1x2
                                            if (canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            } else if (!checkPosOccupied(selBlockPosRow + 1, selBlockPosCol)) {
                                                moveBlockBy(targetBlockInfo, 0, 2);
                                                moveBlockBy(targetBlockBottomInfo, 0, 2);
                                                canMove = true;
                                            } else if (canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, 2);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            }
                                        }
                                    } else if (targetBlockInfo.blockStartsHere && !targetBlockBottomInfo.blockStartsHere) {
                                        if (targetBlockInfo.blockData.blockSize == 0 && targetBlockBottomInfo.blockData.blockSize == 2) {
                                            //1x1 & 2x1
                                            if (canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            } else if (canStepLeft(targetBlockInfo) && canStepDown(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 1, 0);
                                                canMove = true;
                                            } else if (canStepTop(targetBlockInfo) && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            } else if (canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, 2);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                            } else if (canStepDown(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, 2);
                                                moveBlockBy(targetBlockBottomInfo, 1, 0);
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 0 && targetBlockBottomInfo.blockData.blockSize == 3) {
                                            //1x1 & 2x2
                                            if (canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            } else if (canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, 2);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            }
                                        }
                                    } else if (!targetBlockInfo.blockStartsHere && targetBlockBottomInfo.blockStartsHere) {
                                        if (targetBlockInfo.blockData.blockSize == 1 && targetBlockBottomInfo.blockData.blockSize == 0) {
                                            //1x2 && 1x1
                                            if (canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            } else if (!checkPosOccupied(selBlockPosRow - 2, selBlockPosCol)) {
                                                moveBlockBy(targetBlockInfo, 0, 2);
                                                moveBlockBy(targetBlockBottomInfo, 0, 2);
                                                canMove = true;
                                            } else if (canStepLeft(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, 2);
                                                canMove = true;
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 2 && targetBlockBottomInfo.blockData.blockSize == 0) {
                                            //2x1 & 1x1
                                            if (canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            } else if (canStepLeft(targetBlockInfo) && canStepDown(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 1, 0);
                                                canMove = true;
                                            } else if (canStepTop(targetBlockInfo) && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            } else if (canStepLeft(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, 2);
                                                canMove = true;
                                            } else if (canStepTop(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                moveBlockBy(targetBlockBottomInfo, 0, 2);
                                                canMove = true;
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 2 && targetBlockBottomInfo.blockData.blockSize == 1) {
                                            //2x1 & 1x2
                                            if (canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            } else if (canStepLeft(targetBlockInfo) && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, 2);
                                                canMove = true;
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 3 && targetBlockBottomInfo.blockData.blockSize == 0) {
                                            //2x2 & 1x1
                                            if (canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            } else if (canStepLeft(targetBlockInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, 2);
                                                canMove = true;
                                            }
                                        }
                                    } else if (!targetBlockInfo.blockStartsHere && !targetBlockBottomInfo.blockStartsHere) {
                                        if (targetBlockInfo.blockData.blockSize == 1 && targetBlockBottomInfo.blockData.blockSize == 2) {
                                            //1x2 & 2x1
                                            if (canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            } else if (canStepLeft(targetBlockBottomInfo) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol)) {
                                                moveBlockBy(targetBlockInfo, 0, 2);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 2 && targetBlockBottomInfo.blockData.blockSize == 2) {
                                            //2x1 & 2x1
                                            if (canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            } else if (canStepLeft(targetBlockInfo) && canStepDown(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 1, 0);
                                                canMove = true;
                                            } else if (canStepTop(targetBlockInfo) && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, -1, 0);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            }
                                        } else if (targetBlockInfo.blockData.blockSize == 3 && targetBlockBottomInfo.blockData.blockSize == 2 || targetBlockInfo.blockData.blockSize == 2 && targetBlockBottomInfo.blockData.blockSize == 3) {
                                            //(2x2 & 2x1) || (2x1 & 2x2)
                                            if (canStepLeft(targetBlockInfo) && canStepLeft(targetBlockBottomInfo)) {
                                                moveBlockBy(targetBlockInfo, 0, -1);
                                                moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                canMove = true;
                                            }
                                        }
                                    }
                                }
                            }
                            //向右移动一格
                            else if (targetRow == selBlockPosRow && targetCol == selBlockPosCol + 1) {
                                    if (!targetBlockRightInfo && !targetBlockBottomRightInfo) {
                                        canMove = true;
                                    } else if (targetBlockRightInfo.blockData == targetBlockBottomRightInfo.blockData) {
                                        if (targetBlockRightInfo.blockData.blockSize == 1) {
                                            //1x2
                                            if (canStepRight(targetBlockRightInfo)) {
                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                            } else {
                                                moveBlockBy(targetBlockRightInfo, 0, -2);
                                            }
                                            canMove = true;
                                        } else if (targetBlockRightInfo.blockData.blockSize == 3) {
                                            //2x2
                                            if (canStepRight(targetBlockRightInfo)) {
                                                moveBlockBy(targetBlockRightInfo, 0, 1);
                                            }
                                        }
                                    } else if (targetBlockRightInfo && !targetBlockBottomRightInfo) {
                                        if (targetBlockRightInfo.blockStartsHere) {
                                            if (targetBlockRightInfo.blockData.blockSize == 0) {
                                                //1x1
                                                if (canStepRight(targetBlockRightInfo)) {
                                                    moveBlockBy(targetBlockRightInfo, 0, 1);
                                                } else if (canStepTop(targetBlockRightInfo)) {
                                                    moveBlockBy(targetBlockRightInfo, -1, 0);
                                                } else {
                                                    moveBlockBy(targetBlockRightInfo, 0, -2);
                                                }
                                                canMove = true;
                                            } else if (targetBlockRightInfo.blockData.blockSize == 2) {
                                                //2x1
                                                if (canStepRight(targetBlockRightInfo)) {
                                                    moveBlockBy(targetBlockRightInfo, 0, 1);
                                                    canMove = true;
                                                } else if (canStepTop(targetBlockRightInfo)) {
                                                    moveBlockBy(targetBlockRightInfo, -1, 0);
                                                    canMove = true;
                                                }
                                            }
                                        } else {
                                            if (targetBlockRightInfo.blockData.blockSize == 1) {
                                                //1x2
                                                if (canStepRight(targetBlockRightInfo)) {
                                                    moveBlockBy(targetBlockRightInfo, 0, 1);
                                                    canMove = true;
                                                } else if (!checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                                    moveBlockBy(targetBlockRightInfo, 0, -2);
                                                    canMove = true;
                                                }
                                            } else if (targetBlockRightInfo.blockData.blockSize == 3) {
                                                //2x2
                                                if (canStepRight(targetBlockRightInfo)) {
                                                    moveBlockBy(targetBlockRightInfo, 0, 1);
                                                    canMove = true;
                                                }
                                            }
                                        }
                                    } else if (!targetBlockRightInfo && targetBlockBottomRightInfo) {
                                        if (targetBlockBottomRightInfo.blockStartsHere) {
                                            if (targetBlockBottomRightInfo.blockData.blockSize == 0) {
                                                //1x1
                                                if (canStepRight(targetBlockBottomRightInfo)) {
                                                    moveBlockBy(targetBlockBottomRightInfo, 0, 1);
                                                } else if (canStepDown(targetBlockBottomRightInfo)) {
                                                    moveBlockBy(targetBlockBottomRightInfo, 1, 0);
                                                } else {
                                                    moveBlockBy(targetBlockBottomRightInfo, 0, -2);
                                                }
                                                canMove = true;
                                            } else if (targetBlockBottomRightInfo.blockData.blockSize == 1) {
                                                //1x2
                                                if (canStepRight(targetBlockBottomRightInfo)) {
                                                    moveBlockBy(targetBlockBottomRightInfo, 0, 1);
                                                    canMove = true;
                                                } else if (!checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1)) {
                                                    moveBlockBy(targetBlockBottomRightInfo, 0, -2);
                                                    canMove = true;
                                                }
                                            } else if (targetBlockBottomRightInfo.blockData.blockSize == 2) {
                                                //2x1
                                                if (canStepRight(targetBlockBottomRightInfo)) {
                                                    moveBlockBy(targetBlockBottomRightInfo, 0, 1);
                                                    canMove = true;
                                                } else if (canStepDown(targetBlockBottomRightInfo)) {
                                                    moveBlockBy(targetBlockBottomRightInfo, 1, 0);
                                                    canMove = true;
                                                }
                                            } else if (targetBlockBottomRightInfo.blockData.blockSize == 3) {
                                                //2x2
                                                if (canStepRight(targetBlockBottomRightInfo)) {
                                                    moveBlockBy(targetBlockBottomRightInfo, 0, 1);
                                                    canMove = true;
                                                }
                                            }
                                        } else {
                                            //目前没有这种情况
                                        }
                                    } else if (targetBlockRightInfo && targetBlockBottomRightInfo) {
                                        var tbr = targetBlockRightInfo;
                                        var tbbr = targetBlockBottomRightInfo;
                                        var tbrs = tbr.blockData.blockSize;
                                        var tbbrs = tbbr.blockData.blockSize;
                                        if (tbr.blockStartsHere && tbbr.blockStartsHere) {
                                            if (tbrs == 0 && tbbrs == 0) {
                                                //1x1 & 1x1
                                                if (canStepRight(tbr) && canStepRight(tbbr)) {
                                                    moveBlockBy(tbr, 0, 1);
                                                    moveBlockBy(tbbr, 0, 1);
                                                } else if (canStepRight(tbr) && canStepDown(tbbr)) {
                                                    moveBlockBy(tbr, 0, 1);
                                                    moveBlockBy(tbbr, 1, 0);
                                                } else if (canStepTop(tbr) && canStepRight(tbbr)) {
                                                    moveBlockBy(tbr, -1, 0);
                                                    moveBlockBy(tbbr, 0, 1);
                                                } else {
                                                    moveBlockBy(tbr, 0, -2);
                                                    moveBlockBy(tbbr, 0, -2);
                                                }
                                                canMove = true;
                                            } else if (tbrs == 0 && tbbrs == 1) {
                                                //1x1 & 1x2
                                                if (canStepRight(tbr) && canStepRight(tbbr)) {
                                                    moveBlockBy(tbr, 0, 1);
                                                    moveBlockBy(tbbr, 0, 1);
                                                    canMove = true;
                                                } else if (!checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1)) {
                                                    moveBlockBy(tbr, 0, -2);
                                                    moveBlockBy(tbbr, 0, -2);
                                                    canMove = true;
                                                }
                                            } else if (tbrs == 0 && tbbrs == 2) {
                                                //1x1 & 2x1
                                                if (canStepRight(tbr) && canStepRight(tbbr)) {
                                                    moveBlockBy(tbr, 0, 1);
                                                    moveBlockBy(tbbr, 0, 1);
                                                    canMove = true;
                                                } else if (canStepRight(tbr) && canStepDown(tbbr)) {
                                                    moveBlockBy(tbr, 0, 1);
                                                    moveBlockBy(tbbr, 1, 0);
                                                    canMove = true;
                                                } else if (canStepTop(tbr) && canStepRight(tbbr)) {
                                                    moveBlockBy(tbr, -1, 0);
                                                    moveBlockBy(tbbr, 0, 1);
                                                    canMove = true;
                                                } else if (canStepRight(tbbr)) {
                                                    moveBlockBy(tbr, 0, -2);
                                                    moveBlockBy(tbbr, 0, 1);
                                                    canMove = true;
                                                } else if (canStepDown(tbbr)) {
                                                    moveBlockBy(tbr, 0, -2);
                                                    moveBlockBy(tbbr, 1, 0);
                                                    canMove = true;
                                                }
                                            } else if (tbrs == 0 && tbbrs == 3) {
                                                //1x1 & 2x2
                                                if (canStepRight(tbr) && canStepRight(tbbr)) {
                                                    moveBlockBy(tbr, 0, 1);
                                                    moveBlockBy(tbbr, 0, 1);
                                                    canMove = true;
                                                } else if (canStepRight(tbbr)) {
                                                    moveBlockBy(tbr, 0, -2);
                                                    moveBlockBy(tbbr, 0, 1);
                                                    canMove = true;
                                                }
                                            } else if (tbrs == 2 && tbbrs == 0) {
                                                //2x1 && 1x1
                                                if (canStepRight(tbr) && canStepRight(tbbr)) {
                                                    moveBlockBy(tbr, 0, 1);
                                                    moveBlockBy(tbbr, 0, 1);
                                                    canMove = true;
                                                } else if (canStepRight(tbr) && canStepDown(tbbr)) {
                                                    moveBlockBy(tbr, 0, 1);
                                                    moveBlockBy(tbbr, 1, 0);
                                                    canMove = true;
                                                } else if (canStepTop(tbr) && canStepRight(tbbr)) {
                                                    moveBlockBy(tbr, -1, 0);
                                                    moveBlockBy(tbbr, 0, 1);
                                                    canMove = true;
                                                } else if (canStepRight(tbr)) {
                                                    moveBlockBy(tbr, 0, 1);
                                                    moveBlockBy(tbbr, 0, -2);
                                                    canMove = true;
                                                } else if (canStepTop(tbr)) {
                                                    moveBlockBy(tbr, -1, 0);
                                                    moveBlockBy(tbbr, 0, -2);
                                                    canMove = true;
                                                }
                                            } else if (tbrs == 2 && tbbrs == 1) {
                                                //2x1 & 1x2
                                                if (canStepRight(tbr) && canStepRight(tbbr)) {
                                                    moveBlockBy(tbr, 0, 1);
                                                    moveBlockBy(tbbr, 0, 1);
                                                    canMove = true;
                                                } else if (canStepRight(tbr) && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1)) {
                                                    moveBlockBy(tbr, 0, 1);
                                                    moveBlockBy(tbbr, 0, -2);
                                                    canMove = true;
                                                }
                                            } else if (tbrs == 2 && tbbrs == 2) {
                                                //2x1 & 2x1
                                                if (canStepRight(tbr) && canStepRight(tbbr)) {
                                                    moveBlockBy(tbr, 0, 1);
                                                    moveBlockBy(tbbr, 0, 1);
                                                    canMove = true;
                                                } else if (canStepRight(tbr) && canStepDown(tbbr)) {
                                                    moveBlockBy(tbr, 0, 1);
                                                    moveBlockBy(tbbr, 1, 0);
                                                    canMove = true;
                                                } else if (canStepTop(tbr) && canStepRight(tbbr)) {
                                                    moveBlockBy(tbr, -1, 0);
                                                    moveBlockBy(tbbr, 0, 1);
                                                    canMove = true;
                                                }
                                            } else if (tbrs == 2 && tbrrs == 3) {
                                                //2x1 & 2x2
                                                if (canStepRight(tbr) && canStepRight(tbbr)) {
                                                    moveBlockBy(tbr, 0, 1);
                                                    moveBlockBy(tbbr, 0, 1);
                                                    canMove = true;
                                                }
                                            }
                                        } else if (tbr.blockStartsHere && !tbbr.blockStartsHere) {
                                            //没有此种情况
                                        } else if (!tbr.blockStartsHere && tbbr.blockStartsHere) {
                                            if (tbrs == 1 && tbbrs == 0) {
                                                //1x2 && 1x1
                                                if (canStepRight(tbr) && canStepRight(tbbr)) {
                                                    moveBlockBy(tbr, 0, 1);
                                                    moveBlockBy(tbbr, 0, 1);
                                                    canMove = true;
                                                } else if (!checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                                    moveBlockBy(tbr, 0, -2);
                                                    moveBlockBy(tbbr, 0, -2);
                                                    canMove = true;
                                                }
                                            } else if (tbrs == 1 && tbbrs == 2) {
                                                //1x2 && 2x1
                                                if (canStepRight(tbr) && canStepRight(tbbr)) {
                                                    moveBlockBy(tbr, 0, 1);
                                                    moveBlockBy(tbbr, 0, 1);
                                                    canMove = true;
                                                } else if (canStepRight(tbbr) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                                    moveBlockBy(tbr, 0, -2);
                                                    moveBlockBy(tbbr, 0, 1);
                                                    canMove = true;
                                                }
                                            }
                                        } else if (!tbr.blockStartsHere && !tbbr.blockStartsHere) {
                                            //没有此种情况
                                        }
                                    }
                                }
                                //向上移动一格
                                else if (targetRow == selBlockPosRow - 1 && targetCol == selBlockPosCol) {
                                        if (!targetBlockInfo && !targetBlockRightInfo) {
                                            canMove = true;
                                        } else if (targetBlockInfo.blockData == targetBlockRightInfo.blockData) {
                                            if (targetBlockInfo.blockData.blockSize == 2) {
                                                //2x1
                                                moveBlockBy(targetBlockInfo, 2, 0);
                                                canMove = true;
                                            }
                                        } else if (targetBlockInfo && !targetBlockRightInfo) {
                                            if (targetBlockInfo.blockStartsHere) {
                                                if (targetBlockInfo.blockData.blockSize == 0) {
                                                    //1x1
                                                    if (canStepLeft(targetBlockInfo)) {
                                                        moveBlockBy(targetBlockInfo, 0, -1);
                                                    } else {
                                                        moveBlockBy(targetBlockInfo, 2, 0);
                                                    }
                                                    canMove == true;
                                                }
                                            } else {
                                                if (targetBlockInfo.blockData.blockSize == 2) {
                                                    //2x1
                                                    if (canStepLeft(targetBlockInfo)) {
                                                        moveBlockBy(targetBlockInfo, 0, -1);
                                                    } else if (!checkPosOccupied(selBlockPosRow, selBlockPosCol - 2)) {
                                                        moveBlockBy(targetBlockInfo, 2, 0);
                                                    }
                                                }
                                            }
                                        } else if (!targetBlockInfo && targetBlockRightInfo) {
                                            if (targetBlockRightInfo.blockData.blockSize == 0) {
                                                //1x1
                                                if (canStepRight(targetBlockRightInfo)) {
                                                    moveBlockBy(targetBlockRightInfo, 0, 1);
                                                } else {
                                                    moveBlockBy(targetBlockRightInfo, 2, 0);
                                                }
                                                canMove == true;
                                            } else if (targetBlockRightInfo.blockData.blockSize == 2) {
                                                //2x1
                                                if (canStepRight(targetBlockRightInfo)) {
                                                    moveBlockBy(targetBlockRightInfo, 0, 1);
                                                    canMove = true;
                                                } else if (!checkPosOccupied(selBlockPosRow, selBlockPosCol + 1)) {
                                                    moveBlockBy(targetBlockRightInfo, 2, 0);
                                                    canMove = true;
                                                }
                                            }
                                        } else if (targetBlockInfo && targetBlockRightInfo) {
                                            var tbi = targetBlockInfo;
                                            var tbri = targetBlockRightInfo;
                                            var tbs = tbi.blockData.blockSize;
                                            var tbrs = tbri.blockData.blockSize;
                                            if (tbs == 0 && tbrs == 0) {
                                                //1x1 & 1x1
                                                if (canStepLeft(tbi) && canStepRight(tbri)) {
                                                    moveBlockBy(tbi, 0, -1);
                                                    moveBlockBy(tbri, 0, 1);
                                                    canMove = true;
                                                } else {
                                                    moveBlockBy(tbi, 2, 0);
                                                    moveBlockBy(tbri, 2, 0);
                                                    canMove = true;
                                                }
                                            } else if (tbs == 0 && tbrs == 2) {
                                                //1x1 & 2x1
                                                if (canStepLeft(tbi) && canStepRight(tbri)) {
                                                    moveBlockBy(tbi, 0, -1);
                                                    moveBlockBy(tbri, 0, 1);
                                                    canMove = true;
                                                } else if (!checkPosOccupied(selBlockPosRow, selBlockPosCol + 1)) {
                                                    moveBlockBy(tbi, 2, 0);
                                                    moveBlockBy(tbri, 2, 0);
                                                    canMove = true;
                                                } else if (canStepRight(tbri)) {
                                                    moveBlockBy(tbi, 2, 0);
                                                    moveBlockBy(tbri, 0, 1);
                                                    canMove = true;
                                                }
                                            } else if (tbs == 2 && tbrs == 0) {
                                                //2x1 & 1x1
                                                if (canStepLeft(tbi) && canStepRight(tbri)) {
                                                    moveBlockBy(tbi, 0, -1);
                                                    moveBlockBy(tbri, 0, 1);
                                                    canMove = true;
                                                } else if (!checkPosOccupied(selBlockPosRow, selBlockPosCol - 2)) {
                                                    moveBlockBy(tbi, 2, 0);
                                                    moveBlockBy(tbri, 2, 0);
                                                    canMove = true;
                                                } else if (canStepLeft(tbi)) {
                                                    moveBlockBy(tbi, 0, -1);
                                                    moveBlockBy(tbri, 2, 0);
                                                    canMove = true;
                                                }
                                            } else if (tbs == 2 && tbrs == 2) {
                                                //2x1 & 2x1
                                                if (canStepLeft(tbi) && !checkPosOccupied(selBlockPosRow, selBlockPosCol + 1)) {
                                                    moveBlockBy(tbi, 0, -1);
                                                    moveBlockBy(tbri, 2, 0);
                                                    canMove = true;
                                                } else if (canStepRight(tbri) && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 2)) {
                                                    moveBlockBy(tbi, 2, 0);
                                                    moveBlockBy(tbri, 0, 1);
                                                    canMove = true;
                                                } else if (!checkPosOccupied(selBlockPosRow, selBlockPosCol + 1) && !checkPosOccupied(selBlockPosRow, selBlockPosCol - 2)) {
                                                    moveBlockBy(tbi, 2, 0);
                                                    moveBlockBy(tbri, 2, 0);
                                                    canMove = true;
                                                }
                                            }
                                        }
                                    }
                                    //向下移动一格
                                    else if (targetRow == selBlockPosRow + 1 && targetCol == selBlockPosCol) {
                                            if (!targetBlockBottomInfo && !targetBlockBottomRightInfo) {
                                                canMove = true;
                                            } else if (targetBlockBottomInfo.blockData == targetBlockBottomRightInfo.blockData) {
                                                if (targetBlockBottomInfo.blockData.blockSize == 2) {
                                                    moveBlockBy(targetBlockBottomInfo, -2, 0);
                                                    canMove = true;
                                                }
                                            } else if (targetBlockBottomInfo && !targetBlockBottomRightInfo) {
                                                if (targetBlockBottomInfo.blockData.blockSize == 0) {
                                                    //1x1
                                                    if (canStepLeft(targetBlockBottomInfo)) {
                                                        moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                    } else {
                                                        moveBlockBy(targetBlockBottomInfo, -2, 0);
                                                    }
                                                    canMove = true;
                                                } else if (targetBlockBottomInfo.blockData.blockSize == 2) {
                                                    //2x1
                                                    if (canStepLeft(targetBlockBottomInfo)) {
                                                        moveBlockBy(targetBlockBottomInfo, 0, -1);
                                                        canMove = true;
                                                    } else if (!checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2)) {
                                                        moveBlockBy(targetBlockBottomInfo, -2, 0);
                                                        canMove = true;
                                                    }
                                                }
                                            } else if (!targetBlockBottomInfo && targetBlockBottomRightInfo) {
                                                var tbbi = targetBlockBottomRightInfo;
                                                var tbbs = tbbi.blockData.blockSize;
                                                if (tbbs == 0) {
                                                    //1x1
                                                    if (canStepRight(tbbi)) {
                                                        moveBlockBy(tbbi, 0, 1);
                                                    } else {
                                                        moveBlockBy(tbbi, -2, 0);
                                                    }
                                                    canMove = true;
                                                } else if (tbbs == 2) {
                                                    //2x1
                                                    if (canStepRight(tbbi)) {
                                                        moveBlockBy(tbbi, 0, 1);
                                                        canMove = true;
                                                    } else if (!checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1)) {
                                                        moveBlockBy(tbbi, -2, 0);
                                                        canMove = true;
                                                    }
                                                }
                                            } else if (targetBlockBottomInfo && targetBlockBottomRightInfo) {
                                                var tbbi = targetBlockBottomInfo;
                                                var tbbs = tbbi.blockData.blockSize;
                                                var tbbri = targetBlockBottomRightInfo;
                                                var tbbrs = tbbri.blockData.blockSize;
                                                if (tbbs == 0 && tbbrs == 0) {
                                                    //1x1 & 1x1
                                                    if (canStepLeft(tbbi) && canStepRight(tbbri)) {
                                                        moveBlockBy(tbbi, 0, -1);
                                                        moveBlockBy(tbbri, 0, 1);
                                                    } else {
                                                        moveBlockBy(tbbi, -2, 0);
                                                        moveBlockBy(tbbri, -2, 0);
                                                    }
                                                    canMove = true;
                                                } else if (tbbs == 0 && tbbrs == 2) {
                                                    //1x1 & 2x1
                                                    if (canStepLeft(tbbi) && canStepRight(tbbri)) {
                                                        moveBlockBy(tbbi, 0, -1);
                                                        moveBlockBy(tbbri, 0, 1);
                                                        canMove = true;
                                                    } else if (!checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1)) {
                                                        moveBlockBy(tbbri, -2, 0);
                                                        if (canStepLeft(tbbi)) {
                                                            moveBlockBy(tbbi, 0, -1);
                                                        } else {
                                                            moveBlockBy(tbbi, -2, 0);
                                                        }
                                                        canMove == true;
                                                    } else if (canStepRight(tbbri)) {
                                                        moveBlockBy(tbbi, -2, 0);
                                                        moveBlockBy(tbbri, 0, 1);
                                                    }
                                                } else if (tbbs == 2 && tbbrs == 0) {
                                                    //2x1 && 1x1
                                                    if (canStepLeft(tbbi) && canStepRight(tbbri)) {
                                                        moveBlockBy(tbbi, 0, -1);
                                                        moveBlockBy(tbbri, 0, 1);
                                                        canMove = true;
                                                    } else if (!checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2)) {
                                                        moveBlockBy(tbbi, -2, 0);
                                                        if (canStepRight(tbbri)) {
                                                            moveBlockBy(tbbri, 0, 1);
                                                        } else {
                                                            moveBlockBy(tbbri, -2, 0);
                                                        }
                                                        canMove == true;
                                                    } else if (canStepLeft(tbbi)) {
                                                        moveBlockBy(tbbi, 0, -1);
                                                        moveBlockBy(tbbri, -2, 0);
                                                        canMove = true;
                                                    }
                                                } else if (tbbs == 2 && tbbrs == 2) {
                                                    //2x1 & 2x1
                                                    if (!checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1)) {
                                                        moveBlockBy(tbbi, -2, 0);
                                                        moveBlockBy(tbbri, -2, 0);
                                                        canMove = true;
                                                    } else if (!checkPosOccupied(selBlockPosRow - 1, selBlockPosCol - 2) && canStepRight(tbbri)) {
                                                        moveBlockBy(tbbi, -2, 0);
                                                        moveBlockBy(tbbri, 0, 1);
                                                        canMove = true;
                                                    } else if (canStepLeft(tbbi) && !checkPosOccupied(selBlockPosRow - 1, selBlockPosCol + 1)) {
                                                        moveBlockBy(tbbi, 0, -1);
                                                        moveBlockBy(tbbri, -2, 0);
                                                        canMove = true;
                                                    }
                                                }
                                            }
                                        }
                                        //向左上方移动一格
                                        else if (targetRow == selBlockPosRow - 1 && targetCol == selBlockPosCol - 1) {
                                                var tbi = targetBlockInfo;
                                                var tbri = targetBlockRightInfo;
                                                var tbbi = targetBlockBottomInfo;
                                                if (!tbi && !tbri && !tbbi) {
                                                    canMove = true;
                                                } else if (tbi && !tbri && !tbbi) {
                                                    if (tbi.blockData.blockSize == 0) {
                                                        if (canStepLeft(tbi)) {
                                                            moveBlockBy(tbi, 0, -1);
                                                        } else {
                                                            moveBlockBy(tbi, 1, 2);
                                                        }
                                                        canMove = true;
                                                    } else if (tbi.blockData.blockSize == 2) {
                                                        if (canStepLeft(tbi)) {
                                                            moveBlockBy(tbi, 0, -1);
                                                            canMove = true;
                                                        }
                                                    }
                                                } else if (!tbi && tbri && !tbbi) {
                                                    if (tbri.blockData.blockSize == 0) {
                                                        moveBlockBy(tbri, 2, 0);
                                                        canMove = true;
                                                    } else if (tbri.blockData.blockSize == 2) {
                                                        //2x1
                                                        if (canStepRight(tbri)) {
                                                            moveBlockBy(tbri, 0, 1);
                                                        } else {
                                                            moveBlockBy(tbri, 2, 0);
                                                        }
                                                        canMove = true;
                                                    }
                                                } else if (!tbi && !tbri && tbbi) {
                                                    if (tbbi.blockData.blockSize == 0) {
                                                        if (canStepLeft(tbbi)) {
                                                            moveBlockBy(tbbi, 0, -1);
                                                        } else {
                                                            moveBlockBy(tbbi, 0, 2);
                                                        }
                                                        canMove = true;
                                                    } else if (tbbi.blockData.blockSize == 2) {
                                                        if (canStepLeft(tbbi)) {
                                                            moveBlockBy(tbbi, 0, -1);
                                                            canMove = true;
                                                        }
                                                    }
                                                } else if (tbi.blockData == tbri.blockData) {
                                                    if (!tbbi) {
                                                        if (tbi.blockData.blockSize == 2) {
                                                            if (canStepLeft(tbi) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 4)) {
                                                                moveBlockBy(tbi, 0, -2);
                                                                canMove = true;
                                                            } else if (canStepRight(tbi) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol + 1)) {
                                                                moveBlockBy(tbi, 0, 2);
                                                                canMove = true;
                                                            } else {
                                                                moveBlockBy(tbi, 2, 1);
                                                            }
                                                        }
                                                    } else {
                                                        if (tbbi.blockData.blockSize == 0) {
                                                            if (tbi.blockData.blockSize == 2) {
                                                                if (canStepLeft(tbbi)) {
                                                                    if (canStepLeft(tbi) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 4)) {
                                                                        moveBlockBy(tbi, 0, -2);
                                                                        moveBlockBy(tbbi, 0, -1);
                                                                        canMove = true;
                                                                    } else if (canStepRight(tbi) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol + 1)) {
                                                                        moveBlockBy(tbi, 0, 2);
                                                                        moveBlockBy(tbbi, 0, -1);
                                                                        canMove = true;
                                                                    } else {
                                                                        moveBlockBy(tbi, 2, 1);
                                                                        moveBlockBy(tbbi, 0, -1);
                                                                        canMove = true;
                                                                    }
                                                                } else {
                                                                    if (canStepLeft(tbi) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 4)) {
                                                                        moveBlockBy(tbi, 0, -2);
                                                                        moveBlockBy(tbbi, 0, 2);
                                                                        canMove = true;
                                                                    } else if (canStepRight(tbi) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol + 1)) {
                                                                        moveBlockBy(tbi, 0, 2);
                                                                        moveBlockBy(tbbi, 0, 2);
                                                                        canMove = true;
                                                                    } else {
                                                                        moveBlockBy(tbi, 2, 1);
                                                                        moveBlockBy(tbbi, 0, 2);
                                                                        canMove = true;
                                                                    }
                                                                }
                                                            }
                                                        } else if (tbbi.blockData.blockSize == 2) {
                                                            if (canStepLeft(tbbi)) {
                                                                if (canStepLeft(tbi)) {
                                                                    moveBlockBy(tbi, 0, -2);
                                                                    moveBlockBy(tbbi, 0, -1);
                                                                    canMove = true;
                                                                } else if (canStepRight(tbi)) {
                                                                    moveBlockBy(tbi, 0, 2);
                                                                    moveBlockBy(tbbi, 0, -1);
                                                                    canMove = true;
                                                                } else {
                                                                    moveBlockBy(tbi, 2, 1);
                                                                    moveBlockBy(tbbi, 0, -1);
                                                                    canMove = true;
                                                                }
                                                            }
                                                        }
                                                    }
                                                } else if (tbi.blockData == tbbi.blockData) {
                                                    if (!tbri) {
                                                        if (tbi.blockStartsHere) {
                                                            if (tbi.blockData.blockSize == 1) {
                                                                //1x2
                                                                if (canStepLeft(tbi)) {
                                                                    moveBlockBy(tbi, 0, -1);
                                                                    canMove = true;
                                                                } else {
                                                                    moveBlockBy(tbi, 1, 2);
                                                                    canMove = true;
                                                                }
                                                            }
                                                        } else {
                                                            if (tbi.blockData.blockSize == 3) {
                                                                //2x2
                                                                if (canStepLeft(tbi)) {
                                                                    moveBlockBy(tbi, 0, -1);
                                                                    canMove = true;
                                                                }
                                                            }
                                                        }
                                                    } else {
                                                        if (tbri.blockData.blockSize == 0) {
                                                            if (tbi.blockStartsHere) {
                                                                if (tbi.blockData.blockSize == 1) {
                                                                    //1x2
                                                                    if (canStepLeft(tbi)) {
                                                                        moveBlockBy(tbi, 0, -1);
                                                                        moveBlockBy(tbri, 2, 0);
                                                                        canMove = true;
                                                                    } else {
                                                                        moveBlockBy(tbi, 1, 2);
                                                                        moveBlockBy(tbri, 2, 0);
                                                                        canMove = true;
                                                                    }
                                                                }
                                                            } else {
                                                                if (tbi.blockData.blockSize == 3) {
                                                                    //2x2
                                                                    if (canStepLeft(tbi)) {
                                                                        moveBlockBy(tbi, 0, -1);
                                                                        moveBlockBy(tbri, 2, 0);
                                                                        canMove = true;
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                } else if (tbi && tbri && !tbbi) {
                                                    if (tbi.blockData.blockSize == 0 && tbri.blockData.blockSize == 0) {
                                                        moveBlockBy(tbi, 2, 1);
                                                        moveBlockBy(tbri, 2, 1);
                                                        canMove = true;
                                                    }
                                                } else if (tbi && !tbri && tbbi) {
                                                    if (tbi.blockData.blockSize == 0 && tbbi.blockData.blockSize == 0) {
                                                        if (canStepLeft(tbi) && canStepLeft(tbbi)) {
                                                            moveBlockBy(tbi, 0, -1);
                                                            moveBlockBy(tbbi, 0, -1);
                                                            canMove = true;
                                                        } else {
                                                            moveBlockBy(tbi, 1, 2);
                                                            moveBlockBy(tbbi, 1, 2);
                                                            canMove = true;
                                                        }
                                                    } else if (tbi.blockData.blockSize == 0 && tbbi.blockData.blockSize == 2) {
                                                        //1x1 & 2x1
                                                        if (canStepLeft(tbi) && canStepLeft(tbbi)) {
                                                            moveBlockBy(tbi, 0, -1);
                                                            moveBlockBy(tbbi, 0, -1);
                                                            canMove = true;
                                                        } else if (canStepLeft(tbbi)) {
                                                            moveBlockBy(tbi, 1, 2);
                                                            moveBlockBy(tbbi, 0, -1);
                                                            canMove = true;
                                                        }
                                                    } else if (tbi.blockData.blockSize == 2 && tbbi.blockData.blockSize == 0) {
                                                        //2x1 & 1x1
                                                        if (canStepLeft(tbi) && canStepLeft(tbbi)) {
                                                            moveBlockBy(tbi, 0, -1);
                                                            moveBlockBy(tbbi, 0, -1);
                                                            canMove = true;
                                                        } else if (canStepLeft(tbi)) {
                                                            moveBlockBy(tbi, 0, -1);
                                                            moveBlockBy(tbbi, 0, 2);
                                                            canMove = true;
                                                        }
                                                    } else if (tbi.blockData.blockSize == 2 && tbbi.blockData.blockSize == 2) {
                                                        //2x1 & 2x1
                                                        if (canStepLeft(tbi) && canStepLeft(tbbi)) {
                                                            moveBlockBy(tbi, 0, -1);
                                                            moveBlockBy(tbbi, 0, -1);
                                                            canMove = true;
                                                        }
                                                    }
                                                } else if (!tbi && tbri && tbbi) {
                                                    if (tbri.blockData.blockSize == 0 && tbbi.blockData.blockSize == 0) {
                                                        if (canStepRight(tbri) && canStepLeft(tbbi)) {
                                                            moveBlockBy(tbri, 0, 1);
                                                            moveBlockBy(tbbi, 0, -1);
                                                        } else if (canStepLeft(tbbi)) {
                                                            moveBlockBy(tbbi, 0, -1);
                                                            moveBlockBy(tbri, 2, 0);
                                                        } else if (canStepRight(tbri)) {
                                                            moveBlockBy(tbbi, 0, 2);
                                                            moveBlockBy(tbri, 0, 1);
                                                        } else {
                                                            moveBlockBy(tbbi, 0, 2);
                                                            moveBlockBy(tbri, 2, 0);
                                                        }
                                                        canMove = true;
                                                    }
                                                } else if (tbi && tbri && tbbi) {
                                                    if (tbi.blockStartsHere) {
                                                        //1x1 & 1x1 & 1x1
                                                        if (tbi.blockData.blockSize == 0 && tbbi.blockData.blockSize == 0 && tbri.blockData.blockSize == 0) {
                                                            if (canStepLeft(tbi) && canStepLeft(tbbi)) {
                                                                moveBlockBy(tbi, 0, -1);
                                                                moveBlockBy(tbbi, 0, -1);
                                                                moveBlockBy(tbri, 2, 0);
                                                            } else if (canStepLeft(tbi)) {
                                                                moveBlockBy(tbi, 0, -1);
                                                                moveBlockBy(tbbi, 0, 2);
                                                                moveBlockBy(tbri, 2, 0);
                                                            } else if (canStepLeft(tbbi)) {
                                                                moveBlockBy(tbi, 1, 2);
                                                                moveBlockBy(tbbi, 0, -1);
                                                                moveBlockBy(tbri, 2, 0);
                                                            } else {
                                                                moveBlockBy(tbi, 1, 2);
                                                                moveBlockBy(tbbi, 1, 2);
                                                                moveBlockBy(tbri, 2, 0);
                                                            }
                                                            canMove = true;
                                                        }
                                                        //1x1 & 2x1 & 1x1
                                                        else if (tbi.blockData.blockSize == 0 && tbbi.blockData.blockSize == 2 && tbri.blockData.blockSize == 0) {
                                                                if (canStepLeft(tbi) && canStepLeft(tbbi)) {
                                                                    moveBlockBy(tbi, 0, -1);
                                                                    moveBlockBy(tbbi, 0, -1);
                                                                    moveBlockBy(tbri, 2, 0);
                                                                    canMove = true;
                                                                } else if (canStepLeft(tbbi)) {
                                                                    moveBlockBy(tbi, 1, 2);
                                                                    moveBlockBy(tbbi, 0, -1);
                                                                    moveBlockBy(tbri, 2, 0);
                                                                    canMove = true;
                                                                }
                                                            }
                                                    } else {
                                                        if (tbi.blockData.blockSize == 2 && tbbi.blockData.blockSize == 0 && tbri.blockData.blockSize == 0) {
                                                            if (canStepLeft(tbi) && canStepLeft(tbbi)) {
                                                                moveBlockBy(tbi, 0, -1);
                                                                moveBlockBy(tbbi, 0, -1);
                                                                moveBlockBy(tbri, 2, 0);
                                                                canMove = true;
                                                            } else if (canStepLeft(tbi)) {
                                                                moveBlockBy(tbi, 0, -1);
                                                                moveBlockBy(tbbi, 0, 2);
                                                                moveBlockBy(tbri, 2, 0);
                                                                canMove = true;
                                                            }
                                                        } else if (tbi.blockData.blockSize == 2 && tbbi.blockData.blockSize == 2 && tbri.blockData.blockSize == 0) {
                                                            if (canStepLeft(tbi) && canStepLeft(tbbi)) {
                                                                moveBlockBy(tbi, 0, -1);
                                                                moveBlockBy(tbbi, 0, -1);
                                                                moveBlockBy(tbri, 2, 0);
                                                                canMove = true;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                            //向右上方移动一格
                                            else if (targetRow == selBlockPosRow - 1 && targetCol == selBlockPosCol + 1) {
                                                    var tbi = targetBlockInfo;
                                                    var tbri = targetBlockRightInfo;
                                                    var tbbri = targetBlockBottomRightInfo;
                                                    if (!tbi && !tbri && !tbbri) {
                                                        canMove = true;
                                                    } else if (tbi && !tbri && !tbbri) {
                                                        if (tbi.blockData.blockSize == 0) {
                                                            //1x1
                                                            moveBlockBy(tbi, 2, 0);
                                                            canMove = true;
                                                        } else if (tbi.blockData.blockSize == 2) {
                                                            moveBlockBy(tbi, 2, 0);
                                                            canMove = true;
                                                        }
                                                    } else if (!tbi && tbri && !tbbri) {
                                                        if (tbri.blockData.blockSize == 0) {
                                                            //1x1
                                                            if (canStepRight(tbri)) {
                                                                moveBlockBy(tbri, 0, 1);
                                                                canMove = true;
                                                            } else {
                                                                moveBlockBy(tbri, 2, -1);
                                                                canMove = true;
                                                            }
                                                        } else if (tbri.blockData.blockSize == 2) {
                                                            //2x1
                                                            if (canStepRight(tbri)) {
                                                                moveBlockBy(tbri, 0, 1);
                                                                canMove = true;
                                                            }
                                                        }
                                                    } else if (!tbi && !tbri && tbbri) {
                                                        if (tbbri.blockData.blockSize == 0) {
                                                            if (canStepRight(tbbri)) {
                                                                moveBlockBy(tbbri, 0, 1);
                                                                canMove = true;
                                                            } else {
                                                                moveBlockBy(tbbri, 0, -2);
                                                                canMove = true;
                                                            }
                                                        } else if (tbbri.blockData.blockSize == 2) {
                                                            if (canStepRight(tbbri)) {
                                                                moveBlockBy(tbbri, 0, 1);
                                                                canMove = true;
                                                            }
                                                        }
                                                    } else if (tbi.blockData == tbri.blockData) {
                                                        if (!tbbri) {
                                                            if (canStepRight(tbi) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol + 3)) {
                                                                moveBlockBy(tbi, 0, 2);
                                                            } else if (canStepLeft(tbi) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 2)) {
                                                                moveBlockBy(tbi, 0, -2);
                                                            } else {
                                                                moveBlockBy(tbi, 2, -1);
                                                            }
                                                            canMove = true;
                                                        } else {
                                                            if (tbbri.blockData.blockSize == 0) {
                                                                if (canStepRight(tbbri)) {
                                                                    moveBlockBy(tbbri, 0, 1);
                                                                    if (canStepRight(tbi) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol + 3)) {
                                                                        moveBlockBy(tbi, 0, 2);
                                                                    } else if (canStepLeft(tbi) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 2)) {
                                                                        moveBlockBy(tbi, 0, -2);
                                                                    } else {
                                                                        moveBlockBy(tbi, 2, -1);
                                                                    }
                                                                    canMove = true;
                                                                } else {
                                                                    moveBlockBy(tbbri, 0, -2);
                                                                    if (canStepRight(tbi) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol + 3)) {
                                                                        moveBlockBy(tbi, 0, 2);
                                                                    } else if (canStepLeft(tbi) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 2)) {
                                                                        moveBlockBy(tbi, 0, -2);
                                                                    } else {
                                                                        moveBlockBy(tbi, 2, -1);
                                                                    }
                                                                    canMove = true;
                                                                }
                                                            } else if (tbbri.blockData.blockSize == 2) {
                                                                if (canStepRight(tbbri)) {
                                                                    if (canStepRight(tbbri) && canStepRight(tbi) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol + 3)) {
                                                                        moveBlockBy(tbi, 0, 2);
                                                                        moveBlockBy(tbbri, 0, 1);
                                                                        canMove = true;
                                                                    } else if (canStepLeft(tbi) && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 2)) {
                                                                        moveBlockBy(tbi, 0, -2);
                                                                        moveBlockBy(tbbri, 0, 1);
                                                                        canMove = true;
                                                                    } else {
                                                                        moveBlockBy(tbi, 2, -1);
                                                                        moveBlockBy(tbbri, 0, 1);
                                                                        canMove = true;
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    } else if (tbri.blockData == tbbri.blockData) {
                                                        if (!tbi) {
                                                            if (tbri.blockData.blockSize == 1) {
                                                                //1x1
                                                                if (canStepRight(tbri)) {
                                                                    moveBlockBy(tbri, 0, 1);
                                                                } else {
                                                                    moveBlockBy(tbri, 1, -2);
                                                                }
                                                                canMove = true;
                                                            } else if (tbri.blockData.blockSize == 3) {
                                                                //2x2
                                                                if (canStepRight(tbri)) {
                                                                    moveBlockBy(tbri, 0, 1);
                                                                    canMove = true;
                                                                }
                                                            }
                                                        } else {
                                                            if (tbi.blockData.blockSize == 0) {
                                                                if (tbri.blockData.blockSize == 1) {
                                                                    //1x1
                                                                    moveBlockBy(tbi, 2, 0);
                                                                    if (canStepRight(tbri)) {
                                                                        moveBlockBy(tbri, 0, 1);
                                                                    } else {
                                                                        moveBlockBy(tbri, 1, -2);
                                                                    }
                                                                    canMove = true;
                                                                } else if (tbri.blockData.blockSize == 3) {
                                                                    //2x2
                                                                    if (canStepRight(tbri)) {
                                                                        moveBlockBy(tbri, 0, 1);
                                                                        moveBlockBy(tbi, 2, 0);
                                                                        canMove = true;
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    } else if (tbi && tbri && !tbbri) {
                                                        if (tbi.blockStartsHere) {
                                                            if (tbi.blockData.blockSize == 0 && tbri.blockData.blockSize == 0) {
                                                                //1x1 & 1x1
                                                                if (canStepRight(tbri)) {
                                                                    moveBlockBy(tbi, 2, 0);
                                                                    moveBlockBy(tbri, 0, 1);
                                                                    canMove = true;
                                                                } else {
                                                                    moveBlockBy(tbi, 2, -1);
                                                                    moveBlockBy(tbri, 2, -1);
                                                                    canMove = true;
                                                                }
                                                            } else if (tbi.blockData.blockSize == 0 && tbri.blockData.blockSize == 2) {
                                                                //1x1 & 2x1
                                                                if (canStepRight(tbri)) {
                                                                    moveBlockBy(tbi, 2, 0);
                                                                    moveBlockBy(tbri, 0, 1);
                                                                    canMove = true;
                                                                }
                                                            }
                                                        } else {
                                                            if (tbi.blockData.blockSize == 2 && tbri.blockData.blockSize == 0) {
                                                                //2x1 & 1x1
                                                                if (canStepRight(tbri)) {
                                                                    moveBlockBy(tbi, 2, 0);
                                                                    moveBlockBy(tbri, 0, 1);
                                                                    canMove = true;
                                                                }
                                                            } else if (tbi.blockData.blockSize == 2 && tbri.blockData.blockSize == 2) {
                                                                //2x1 & 2x1
                                                                if (canStepRight(tbri)) {
                                                                    moveBlockBy(tbi, 2, 0);
                                                                    moveBlockBy(tbri, 0, 1);
                                                                    canMove = true;
                                                                }
                                                            }
                                                        }
                                                    } else if (tbi && !tbri && tbbri) {
                                                        if (tbi.blockData.blockSize == 0 && tbbri.blockData.blockSize == 0) {
                                                            //1x1 & 1x1
                                                            if (canStepRight(tbbri)) {
                                                                moveBlockBy(tbi, 2, 0);
                                                                moveBlockBy(tbbri, 0, 1);
                                                                canMove = true;
                                                            } else {
                                                                moveBlockBy(tbi, 2, 0);
                                                                moveBlockBy(tbbri, 0, -2);
                                                                canMove = true;
                                                            }
                                                        } else if (tbi.blockData.blockSize == 0 && tbbri.blockData.blockSize == 2) {
                                                            //1x1 & 2x1
                                                            if (canStepRight(tbbri)) {
                                                                moveBlockBy(tbi, 2, 0);
                                                                moveBlockBy(tbbri, 0, 1);
                                                                canMove = true;
                                                            }
                                                        }
                                                    } else if (!tbi && tbri && tbbri) {
                                                        if (tbri.blockData.blockSize == 0 && tbbri.blockData.blockSize == 0) {
                                                            //1x1 & 1x1
                                                            if (canStepRight(tbri) && canStepRight(tbbri)) {
                                                                moveBlockBy(tbri, 0, 1);
                                                                moveBlockBy(tbbri, 0, 1);
                                                                canMove = true;
                                                            } else {
                                                                moveBlockBy(tbri, 1, -2);
                                                                moveBlockBy(tbbri, 1, -2);
                                                                canMove = true;
                                                            }
                                                        } else if (tbri.blockData.blockSize == 0 && tbbri.blockData.blockSize == 2) {
                                                            //1x1 & 2x1
                                                            if (canStepRight(tbri) && canStepRight(tbbri)) {
                                                                moveBlockBy(tbri, 0, 1);
                                                                moveBlockBy(tbbri, 0, 1);
                                                                canMove = true;
                                                            } else if (canStepRight(tbbri)) {
                                                                moveBlockBy(tbri, 1, -2);
                                                                moveBlockBy(tbbri, 0, 1);
                                                                canMove = true;
                                                            }
                                                        } else if (tbri.blockData.blockSize == 2 && tbbri.blockData.blockSize == 0) {
                                                            //2x1 & 1x1
                                                            if (canStepRight(tbri) && canStepRight(tbbri)) {
                                                                moveBlockBy(tbri, 0, 1);
                                                                moveBlockBy(tbbri, 0, 1);
                                                                canMove = true;
                                                            } else if (canStepRight(tbri)) {
                                                                moveBlockBy(tbri, 0, 1);
                                                                moveBlockBy(tbbri, 0, -2);
                                                                canMove = true;
                                                            }
                                                        } else if (tbri.blockData.blockSize == 2 && tbbri.blockData.blockSize == 2) {
                                                            //2x1 & 2x1
                                                            if (canStepRight(tbri) && canStepRight(tbbri)) {
                                                                moveBlockBy(tbri, 0, 1);
                                                                moveBlockBy(tbbri, 0, 1);
                                                                canMove = true;
                                                            }
                                                        }
                                                    } else if (tbi && tbri && tbbri) {
                                                        if (tbi.blockStartsHere) {
                                                            if (tbi.blockData.blockSize == 0 && tbri.blockData.blockSize == 0 && tbbri.blockData.blockSize == 0) {
                                                                if (canStepRight(tbri) && canStepRight(tbbri)) {
                                                                    moveBlockBy(tbi, 2, 0);
                                                                    moveBlockBy(tbri, 0, 1);
                                                                    moveBlockBy(tbbri, 0, 1);
                                                                    canMove = true;
                                                                } else {
                                                                    moveBlockBy(tbi, 2, 0);
                                                                    moveBlockBy(tbri, 1, -2);
                                                                    moveBlockBy(tbbri, 1, -2);
                                                                    canMove = true;
                                                                }
                                                            } else if (tbi.blockData.blockSize == 0 && tbri.blockData.blockSize == 0 && tbbri.blockData.blockSize == 2) {
                                                                //1x1 & 1x1 & 2x1
                                                                if (canStepRight(tbri) && canStepRight(tbbri)) {
                                                                    moveBlockBy(tbi, 2, 0);
                                                                    moveBlockBy(tbri, 0, 1);
                                                                    moveBlockBy(tbbri, 0, 1);
                                                                    canMove = true;
                                                                } else if (canStepRight(tbbri)) {
                                                                    moveBlockBy(tbi, 2, 0);
                                                                    moveBlockBy(tbri, 1, -2);
                                                                    moveBlockBy(tbbri, 0, 1);
                                                                    canMove = true;
                                                                }
                                                            } else if (tbi.blockData.blockSize == 0 && tbri.blockData.blockSize == 2 && tbbri.blockData.blockSize == 0) {
                                                                //1x1 & 2x1 & 1x1
                                                                if (canStepRight(tbri) && canStepRight(tbbri)) {
                                                                    moveBlockBy(tbi, 2, 0);
                                                                    moveBlockBy(tbri, 0, 1);
                                                                    moveBlockBy(tbbri, 0, 1);
                                                                    canMove = true;
                                                                } else if (canStepRight(tbri)) {
                                                                    moveBlockBy(tbi, 2, 0);
                                                                    moveBlockBy(tbri, 0, 1);
                                                                    moveBlockBy(tbbri, 0, -2);
                                                                    canMove = true;
                                                                }
                                                            } else if (tbi.blockData.blockSize == 0 && tbri.blockData.blockSize == 2 && tbbri.blockData.blockSize == 2) {
                                                                //1x1 & 2x1 & 2x1
                                                                if (canStepRight(tbri) && canStepRight(tbbri)) {
                                                                    moveBlockBy(tbi, 2, 0);
                                                                    moveBlockBy(tbri, 0, 1);
                                                                    moveBlockBy(tbbri, 0, 1);
                                                                    canMove = true;
                                                                }
                                                            }
                                                        } else {
                                                            if (tbi.blockData.blockSize == 2) {
                                                                //2x1
                                                                if (tbri.blockData.blockSize == 0 && tbbri.blockData.blockSize == 0) {
                                                                    //1x1 & 1x1
                                                                    if (canStepRight(tbri) && canStepRight(tbbri)) {
                                                                        moveBlockBy(tbi, 2, 0);
                                                                        moveBlockBy(tbri, 0, 1);
                                                                        moveBlockBy(tbbri, 0, 1);
                                                                        canMove = true;
                                                                    } else if (canStepRight(tbbri)) {
                                                                        moveBlockBy(tbi, 2, 0);
                                                                        moveBlockBy(tbri, 1, -2);
                                                                        moveBlockBy(tbbri, 0, 1);
                                                                        canMove = true;
                                                                    } else if (canStepRight(tbri)) {
                                                                        moveBlockBy(tbi, 2, 0);
                                                                        moveBlockBy(tbri, 0, 1);
                                                                        moveBlockBy(tbbri, -2, 0);
                                                                        canMove = true;
                                                                    }
                                                                } else if (tbri.blockData.blockSize == 0 && tbbri.blockData.blockSize == 2) {
                                                                    //1x1 & 2x1
                                                                    if (canStepRight(tbri) && canStepRight(tbbri)) {
                                                                        moveBlockBy(tbi, 2, 0);
                                                                        moveBlockBy(tbri, 0, 1);
                                                                        moveBlockBy(tbbri, 0, 1);
                                                                        canMove = true;
                                                                    } else if (canStepRight(tbbri)) {
                                                                        moveBlockBy(tbi, 2, 0);
                                                                        moveBlockBy(tbri, 1, -2);
                                                                        moveBlockBy(tbbri, 0, 1);
                                                                        canMove = true;
                                                                    }
                                                                } else if (tbri.blockData.blockSize == 2 && tbbri.blockData.blockSize == 0) {
                                                                    //2x1 & 1x1
                                                                    if (canStepRight(tbri) && canStepRight(tbbri)) {
                                                                        moveBlockBy(tbi, 2, 0);
                                                                        moveBlockBy(tbri, 0, 1);
                                                                        moveBlockBy(tbbri, 0, 1);
                                                                        canMove = true;
                                                                    } else if (canStepRight(tbri)) {
                                                                        moveBlockBy(tbi, 2, 0);
                                                                        moveBlockBy(tbri, 0, 1);
                                                                        moveBlockBy(tbbri, 0, -2);
                                                                        canMove = true;
                                                                    }
                                                                } else if (tbri.blockData.blockSize == 2 && tbbri.blockData.blockSize == 2) {
                                                                    //2x1 & 2x1
                                                                    if (canStepRight(tbri) && canStepRight(tbbri)) {
                                                                        moveBlockBy(tbi, 2, 0);
                                                                        moveBlockBy(tbri, 0, 1);
                                                                        moveBlockBy(tbbri, 0, 1);
                                                                        canMove = true;
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                                //向左下方移动一格
                                                else if (targetRow == selBlockPosRow + 1 && targetCol == selBlockPosCol - 1) {
                                                        var tbi = targetBlockInfo;
                                                        var tbbi = targetBlockBottomInfo;
                                                        var tbbri = targetBlockBottomRightInfo;
                                                        if (!tbi && !tbbi && !tbbri) {
                                                            canMove = true;
                                                        } else if (tbi && !tbbi && !tbbri) {
                                                            //TODO
                                                        }
                                                    }
                                                    //向右下方移动一格
                                                    else if (targetRow == selBlockPosRow + 1 && targetCol == selBlockPosCol + 1) {
                                                            var tbri = targetBlockRightInfo;
                                                            var tbbi = targetBlockBottomInfo;
                                                            var tbbri = targetBlockBottomRightInfo;
                                                            if (!tbri && !tbbi && !tbbri) {
                                                                canMove = true;
                                                            } else if (tbri && !tbbi && !tbbri) {
                                                                //TODO
                                                            }
                                                        }
                                                        //其他移动方式
                                                        else {
                                                                var tbi = targetBlockInfo;
                                                                var tbri = targetBlockRightInfo;
                                                                var tbbi = targetBlockBottomInfo;
                                                                var tbbri = targetBlockBottomRightInfo;
                                                                if (!tbi && !tbri && !tbbi && !tbbri) {
                                                                    canMove = true;
                                                                } else if (tbi && !tbri && !tbbi && !tbbri) {
                                                                    if (tbi.blockStartsHere) {
                                                                        if (tbi.blockData.blockSize == 0) {
                                                                            //1x1
                                                                            if (canStepLeft(tbi)) {
                                                                                moveBlockBy(tbi, 0, -1);
                                                                            } else if (canStepTop(tbi)) {
                                                                                moveBlockBy(tbi, -1, 0);
                                                                            } else {
                                                                                moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            }
                                                                            canMove = true;
                                                                        }
                                                                    } else {
                                                                        if (tbi.blockData.blockSize == 2) {
                                                                            //2x1
                                                                            if (canStepLeft(tbi)) {
                                                                                moveBlockBy(tbi, 0, -1);
                                                                                canMove = true;
                                                                            }
                                                                        } else if (tbi.blockData.blockSize == 1) {
                                                                            //1x2
                                                                            if (canStepLeft(tbi) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 && !checkPosOccupied(targetRow - 2, targetCol - 2) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol - 2) {
                                                                                moveBlockBy(tbi, 0, -1);
                                                                                canMove = true;
                                                                            }
                                                                        }
                                                                    }
                                                                } else if (!tbi && tbri && !tbbi && !tbbri) {
                                                                    if (tbri.blockStartsHere) {
                                                                        if (tbri.blockData.blockSize == 0) {
                                                                            //1x1
                                                                            if (canStepRight(tbri)) {
                                                                                moveBlockBy(tbri, 0, 1);
                                                                                canMove = true;
                                                                            } else {
                                                                                moveBlockTo(tbri, selBlockPosRow, selBlockPosCol + 1);
                                                                                canMove = true;
                                                                            }
                                                                        } else if (tbri.blockData.blockSize == 2) {
                                                                            //2x1
                                                                            if (canStepRight(tbri) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 3 || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 3) {
                                                                                moveBlockBy(tbri, 0, 1);
                                                                                canMove = true;
                                                                            }
                                                                        }
                                                                    } else {
                                                                        if (tbri.blockData.blockSize == 1) {
                                                                            //1x2
                                                                            if (canStepRight(tbri) || selBlockPosRow == targetRow - 1 && selBlockPosCol == targetCol + 2 || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow - 2, selBlockPosCol - 1)) {
                                                                                moveBlockBy(tbri, 0, 1);
                                                                                canMove = true;
                                                                            }
                                                                        }
                                                                    }
                                                                } else if (!tbi && !tbri && tbbi && !tbbri) {
                                                                    if (tbbi.blockStartsHere) {
                                                                        if (tbbi.blockData.blockSize == 0) {
                                                                            //1x1
                                                                            if (canStepLeft(tbbi) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 2) {
                                                                                moveBlockBy(tbbi, 0, -1);
                                                                                canMove = true;
                                                                            } else {
                                                                                moveBlockTo(tbbi, selBlockPosRow + 1, selBlockPosCol);
                                                                                canMove = true;
                                                                            }
                                                                        } else if (tbbi.blockData.blockSize == 1) {
                                                                            //1x2
                                                                            if (canStepLeft(tbbi) || selBlockPosRow == targetRow && selBlockPosCol == targetCol - 2 && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol - 2) {
                                                                                moveBlockBy(tbbi, 0, -1);
                                                                                canMove = true;
                                                                            }
                                                                        }
                                                                    } else {
                                                                        if (tbbi.blockData.blockSize == 1) {
                                                                            //1x2
                                                                            if (canStepLeft(tbbi)) {
                                                                                moveBlockBy(tbbi, 0, -1);
                                                                                canMove = true;
                                                                            }
                                                                        }
                                                                    }
                                                                } else if (!tbi && !tbri && !tbbi && tbbri) {
                                                                    if (tbbri.blockData.blockSize == 0) {
                                                                        //1x1
                                                                        if (canStepRight(tbbri) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 2) {
                                                                            moveBlockBy(tbbri, 0, 1);
                                                                            canMove = true;
                                                                        } else {
                                                                            moveBlockTo(tbbri, selBlockPosRow + 1, selBlockPosCol + 1);
                                                                            canMove = true;
                                                                        }
                                                                    } else if (tbbri.blockData.blockSize == 1) {
                                                                        //1x2
                                                                        if (canStepRight(tbbri) || selBlockPosRow == targetRow && selBlockPosCol == targetCol + 2 && !checkPosOccupied(selBlockPosRow + 1, selBlockPosCol - 1) || selBlockPosRow == targetRow + 1 && selBlockPosCol == targetCol + 2) {
                                                                            moveBlockBy(tbbri, 0, 1);
                                                                            canMove = true;
                                                                        }
                                                                    }
                                                                } else if (tbi && tbri && !tbbi && !tbbri) {
                                                                    if (tbi.blockData == tbri.blockData) {
                                                                        if (tbi.blockData.blockSize == 2) {
                                                                            //2x1
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            canMove = true;
                                                                        }
                                                                    } else {
                                                                        if (tbi.blockData.blockSize == 0 && tbri.blockData.blockSize == 0) {
                                                                            //1x1 & 1x1
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            moveBlockTo(tbri, selBlockPosRow, selBlockPosCol + 1);
                                                                            canMove = true;
                                                                        }
                                                                    }
                                                                } else if (tbi && !tbri && tbbi && !tbbri) {
                                                                    if (tbi.blockData == tbbi.blockData) {
                                                                        if (tbi.blockData.blockSize == 1) {
                                                                            //1x2
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            canMove = true;
                                                                        }
                                                                    } else {
                                                                        if (tbi.blockData == 0 && tbbi.blockData.blockSize == 0) {
                                                                            //1x1 & 1x1
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            moveBlockTo(tbbi, selBlockPosRow + 1, selBlockPosCol);
                                                                            canMove = true;
                                                                        }
                                                                    }
                                                                } else if (tbi && !tbri && !tbbi && tbbri) {
                                                                    if (tbi.blockData.blockSize == 0 && tbbri.blockData.blockSize == 0) {
                                                                        moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                        moveBlockTo(tbbri, selBlockPosRow + 1, selBlockPosCol + 1);
                                                                        canMove = true;
                                                                    }
                                                                } else if (!tbi && tbri && tbbi && !tbbri) {
                                                                    if (tbri.blockData.blockSize == 0 && tbbi.blockData.blockSize == 0) {
                                                                        moveBlockTo(tbri, selBlockPosRow, selBlockPosCol + 1);
                                                                        moveBlockTo(tbbi, selBlockPosRow + 1, selBlockPosCol);
                                                                        canMove = true;
                                                                    }
                                                                } else if (!tbi && tbri && !tbbi && tbbri) {
                                                                    if (tbri.blockData == tbbri.blockData) {
                                                                        if (tbri.blockData.blockSize == 1) {
                                                                            moveBlockTo(tbri, selBlockPosRow, selBlockPosCol + 1);
                                                                        }
                                                                    } else {
                                                                        if (tbri.blockData.blockSize == 0 && tbbri.blockData.blockSize == 0) {
                                                                            moveBlockTo(tbri, selBlockPosRow, selBlockPosCol + 1);
                                                                            moveBlockTo(tbbri, selBlockPosRow + 1, selBlockPosCol + 1);
                                                                            canMove = true;
                                                                        }
                                                                    }
                                                                } else if (!tbi && !tbri && tbbi && tbbri) {
                                                                    if (tbbi.blockData == tbbri.blockData) {
                                                                        if (tbbi.blockData.blockSize == 2) {
                                                                            moveBlockTo(tbbi, selBlockPosRow + 1, selBlockPosCol);
                                                                            canMove = true;
                                                                        }
                                                                    } else {
                                                                        if (tbbi.blockData.blockSize == 0 && tbbri.blockData.blockSize == 0) {
                                                                            moveBlockTo(tbbi, selBlockPosRow + 1, selBlockPosCol);
                                                                            moveBlockTo(tbbri, selBlockPosRow + 1, selBlockPosCol + 1);
                                                                            canMove = true;
                                                                        }
                                                                    }
                                                                } else if (tbi && tbri && tbbi && !tbbri) {
                                                                    if (tbi.blockData == tbri.blockData) {
                                                                        if (tbi.blockData.blockSize == 2 && tbbi.blockData.blockSize == 0) {
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            moveBlockTo(tbbi, selBlockPosRow + 1, selBlockPosCol);
                                                                            canMove = true;
                                                                        }
                                                                    } else if (tbi.blockData == tbbi.blockData) {
                                                                        if (tbi.blockData.blockSize == 1 && tbri.blockData.blockSize == 0) {
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            moveBlockTo(tbri, selBlockPosRow, selBlockPosCol + 1);
                                                                            canMove = true;
                                                                        }
                                                                    } else {
                                                                        if (tbi.blockData.blockSize == 0 && tbri.blockData.blockSize == 0 && tbbi.blockData.blockSize == 0) {
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            moveBlockTo(tbbi, selBlockPosRow + 1, selBlockPosCol);
                                                                            moveBlockTo(tbri, selBlockPosRow, selBlockPosCol + 1);
                                                                            canMove = true;
                                                                        }
                                                                    }
                                                                } else if (tbi && tbri && !tbbi && tbbri) {
                                                                    if (tbi.blockData == tbri.blockData) {
                                                                        if (tbi.blockData.blockSize == 2 && tbbri.blockData.blockSize == 0) {
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            moveBlockTo(tbbri, selBlockPosRow + 1, selBlockPosCol + 1);
                                                                            canMove = true;
                                                                        }
                                                                    } else if (tbri.blockData == tbbri.blockData) {
                                                                        if (tbri.blockData.blockSize == 1 && tbi.blockData.blockSize == 0) {
                                                                            moveBlockTo(tbri, selBlockPosRow, selBlockPosCol + 1);
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            canMove = true;
                                                                        }
                                                                    } else {
                                                                        if (tbi.blockData.blockSize == 0 && tbri.blockData.blockSize == 0 && tbbri.blockData.blockSize == 0) {
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            moveBlockTo(tbbi, selBlockPosRow + 1, selBlockPosCol);
                                                                            moveBlockTo(tbbri, selBlockPosRow + 1, selBlockPosCol + 1);
                                                                            canMove = true;
                                                                        }
                                                                    }
                                                                } else if (tbi && !tbri && tbbi && tbbri) {
                                                                    if (tbbi.blockData == tbbri.blockData) {
                                                                        if (tbbi.blockData.blockSize == 2 && tbi.blockData.blockSize == 0) {
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            moveBlockTo(tbbi, selBlockPosRow + 1, selBlockPosCol);
                                                                            canMove = true;
                                                                        }
                                                                    } else if (tbi.blockData == tbbi.blockData) {
                                                                        if (tbi.blockData.blockSize == 1 && tbbri.blockData.blockSize == 0) {
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            moveBlockTo(tbbri, selBlockPosRow + 1, selBlockPosCol + 1);
                                                                            canMove = true;
                                                                        }
                                                                    } else {
                                                                        if (tbi.blockData.blockSize == 0 && tbbi.blockData.blockSize == 0 && tbbri.blockData.blockSize == 0) {
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            moveBlockTo(tbbi, selBlockPosRow + 1, selBlockPosCol);
                                                                            moveBlockTo(tbbri, selBlockPosRow + 1, selBlockPosCol + 1);
                                                                            canMove = true;
                                                                        }
                                                                    }
                                                                } else if (!tbi && tbri && tbbi && tbbri) {
                                                                    if (tbbi.blockData == tbbri.blockData) {
                                                                        if (tbbi.blockData.blockSize == 2 && tbri.blockData.blockSize == 0) {
                                                                            moveBlockTo(tbri, selBlockPosRow, selBlockPosCol + 1);
                                                                            moveBlockTo(tbbi, selBlockPosRow + 1, selBlockPosCol);
                                                                            canMove = true;
                                                                        }
                                                                    } else if (tbri.blockData == tbbri.blockData) {
                                                                        if (tbri.blockData.blockSize == 1 && tbbi.blockData.blockSize == 0) {
                                                                            moveBlockTo(tbri, selBlockPosRow, selBlockPosCol + 1);
                                                                            moveBlockTo(tbbi, selBlockPosRow + 1, selBlockPosCol);
                                                                            canMove = true;
                                                                        }
                                                                    } else {
                                                                        if (tbri.blockData.blockSize == 0 && tbbi.blockData.blockSize == 0 && tbbri.blockData.blockSize == 0) {
                                                                            moveBlockTo(tbri, selBlockPosRow, selBlockPosCol + 1);
                                                                            moveBlockTo(tbbi, selBlockPosRow + 1, selBlockPosCol);
                                                                            moveBlockTo(tbbri, selBlockPosRow + 1, selBlockPosCol + 1);
                                                                            canMove = true;
                                                                        }
                                                                    }
                                                                } else if (tbi && tbri && tbbi && tbbri) {
                                                                    if (tbi.blockStartsHere && tbi.blockData.blockSize == 3) {
                                                                        //4x4
                                                                        moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                        canMove = true;
                                                                    } else if (tbi.blockData == tbri.blockData && tbbi.blockData == tbbri.blockData) {
                                                                        if (tbi.blockData.blockSize == 2 && tbbi.blockData.blockSize == 2) {
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            moveBlockTo(tbbi, selBlockPosRow + 1, selBlockPosol);
                                                                            canMove = true;
                                                                        }
                                                                    } else if (tbi.blockData == tbbi.blockData && tbri.blockData == tbbri.blockData) {
                                                                        if (tbi.blockData.blockSize == 1 && tbri.blockData.blockSize == 1) {
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            moveBlockTo(tbri, selBlockPosRow + 1, selBlockPosCol);
                                                                            canMove = true;
                                                                        }
                                                                    } else if (tbi.blockData == tbri.blockData) {
                                                                        if (tbi.blockData.blockSize == 2 && tbbi.blockData.blockSize == 0 && tbbri.blockData.blockSize == 0) {
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            moveBlockTo(tbbi, selBlockPosRow + 1, selBlockPosCol);
                                                                            moveBlockTo(tbbri, selBlockPosRow + 1, selBlockPosCol + 1);
                                                                            canMove = true;
                                                                        }
                                                                    } else if (tbbi.blockData == tbbri.blockData) {
                                                                        if (tbi.blockData.blockSize == 0 && tbri.blockData.blockSize == 0 && tbbi.blockData.blockSize == 2) {
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            moveBlockTo(tbri, selBlockPosRow, selBlockPosCol + 1);
                                                                            moveBlockTo(tbbi, selBlockPosRow + 1, selBlockPosCol);
                                                                            canMove = true;
                                                                        }
                                                                    } else if (tbi.blockData == tbbi.blockData) {
                                                                        if (tbi.blockData.blockSize == 1 && tbri.blockData.blockSize == 0 && tbbri.blockData.blockSize == 0) {
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            moveBlockTo(tbri, selBlockPosRow, selBlockPosCol + 1);
                                                                            moveBlockTo(tbbri, selBlockPosRow + 1, selBlockPosCol + 1);
                                                                            canMove = true;
                                                                        }
                                                                    } else if (tbri.blockData == tbbri.blockData) {
                                                                        if (tbi.blockData.blockSize == 0 && tbbi.blockData.blockSize == 0 && tbri.blockData.blockSize == 1) {
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            moveBlockTo(tbbi, selBlockPosRow + 1, selBlockPosCol);
                                                                            moveBlockTo(tbri, selBlockPosRow, selBlockPosCol + 1);
                                                                            canMove = true;
                                                                        }
                                                                    } else {
                                                                        if (tbi.blockData.blockSize == 0 && tbbi.blockData.blockSize == 0 && tbri.blockData.blockSize == 0 && tbbri.blockData.blockSize == 0) {
                                                                            moveBlockTo(tbi, selBlockPosRow, selBlockPosCol);
                                                                            moveBlockTo(tbbi, selBlockPosRow + 1, selBlockPosCol);
                                                                            moveBlockTo(tbri, selBlockPosRow, selBlockPosCol + 1);
                                                                            moveBlockTo(tbbri, selBlockPosRow + 1, selBlockPosCol + 1);
                                                                            canMove = true;
                                                                        }
                                                                    }
                                                                }
                                                            }
                        }

            if (canMove) {
                blockData.blockPosCol = targetCol;
                blockData.blockPosRow = targetRow;
                setBlockCss();
                selectBlock(selBlockId);
            }
        }
    };

    //根据位置获取占据此位置的块的信息
    var getBlockInfoByPos = function (row, col) {
        var getBlockInfo = function (row, col) {
            var thisBlockId = getBlockIdByPos(row, col);
            if (thisBlockId) {
                var thisBlockIndex = getBlockIndexById(thisBlockId);
                var thisBlockData = tempData.layout[thisBlockIndex];
                return {
                    blockStartsHere: true,
                    blockId: thisBlockId,
                    blockData: thisBlockData
                };
            } else {
                return false;
            }
        };

        //如果目标位置为空
        if (!checkPosOccupied(row - 1, col - 1)) {
            return false;
        } else {
            //目标位置不为空
            var thisBlockInfo = getBlockInfo(row, col);
            if (thisBlockInfo) {
                return thisBlockInfo;
            } else {
                var thisBlockLeftInfo = getBlockInfo(row, col - 1);
                var thisBlockTopLeftInfo = getBlockInfo(row - 1, col - 1);
                var thisBlockTopInfo = getBlockInfo(row - 1, col);
                //基准点在目标位置左侧，块大小2x1或2x2
                if (thisBlockLeftInfo && (thisBlockLeftInfo.blockData.blockSize == 2 || thisBlockLeftInfo.blockData.blockSize == 3)) {
                    return {
                        blockStartsHere: false,
                        blockOffset: 'left',
                        blockId: thisBlockLeftInfo.blockId,
                        blockData: thisBlockLeftInfo.blockData
                    };
                }
                //基准点在目标位置左上方，块大小2x2
                else if (thisBlockTopLeftInfo && thisBlockTopLeftInfo.blockData.blockSize == 3) {
                        return {
                            blockStartsHere: false,
                            blockOffset: 'topleft',
                            blockId: thisBlockTopLeftInfo.blockId,
                            blockData: thisBlockTopLeftInfo.blockData
                        };
                    }
                    //基准点在目标位置左上方，块大小1x2或2x2
                    else if (thisBlockTopInfo && (thisBlockTopInfo.blockData.blockSize == 1 || thisBlockTopInfo.blockData.blockSize == 3)) {
                            return {
                                blockStartsHere: false,
                                blockOffset: 'top',
                                blockId: thisBlockTopInfo.blockId,
                                blockData: thisBlockTopInfo.blockData
                            };
                        }
                return false;
            }
        }
    };

    //将对应blockInfo的块移动到rowPos，colPos
    var moveBlockTo = function (blockInfo, rowPos, colPos) {
        blockInfo.blockData.blockPosRow = parseInt(rowPos);
        blockInfo.blockData.blockPosCol = parseInt(colPos);
        setBlockCssById(blockInfo.blockId);
    };

    //将对应blockInfo的块水平移动stepX,垂直移动stepY
    var moveBlockBy = function (blockInfo, stepRow, stepCol) {
        blockInfo.blockData.blockPosRow = parseInt(blockInfo.blockData.blockPosRow) + parseInt(stepRow);
        blockInfo.blockData.blockPosCol = parseInt(blockInfo.blockData.blockPosCol) + parseInt(stepCol);
        setBlockCssById(blockInfo.blockId);
    };

    //判断被占据的块可否向左移动一格
    var canStepLeft = function (blockInfo) {
        _posRow = blockInfo.blockData.blockPosRow;
        _posCol = blockInfo.blockData.blockPosCol;
        if (blockInfo.blockData.blockSize == 0 || blockInfo.blockData.blockSize == 2) {
            //1x1或2x1
            if (!checkPosOccupied(_posRow - 1, _posCol - 2)) {
                return true;
            } else {
                return false;
            }
        } else {
            //1x2或2x2
            if (!checkPosOccupied(_posRow - 1, _posCol - 2) && !checkPosOccupied(_posRow, _posCol - 2)) {
                return true;
            } else {
                return false;
            }
        }
    };

    //判断被占据的块可否向右移动一格
    var canStepRight = function (blockInfo) {
        _posRow = blockInfo.blockData.blockPosRow;
        _posCol = blockInfo.blockData.blockPosCol;
        if (blockInfo.blockData.blockSize == 0) {
            //1x1
            if (!checkPosOccupied(_posRow - 1, _posCol)) {
                return true;
            } else {
                return false;
            }
        } else if (blockInfo.blockData.blockSize == 2) {
            //2x1
            if (!checkPosOccupied(_posRow - 1, _posCol + 1)) {
                return true;
            } else {
                return false;
            }
        } else if (blockInfo.blockData.blockSize == 1) {
            //1x2
            if (!checkPosOccupied(_posRow - 1, _posCol) && !checkPosOccupied(_posRow, _posCol)) {
                return true;
            } else {
                return false;
            }
        } else {
            //2x2
            if (!checkPosOccupied(_posRow - 1, _posCol + 1) && !checkPosOccupied(_posRow, _posCol + 1)) {
                return true;
            } else {
                return false;
            }
        }
    };

    //判断被占据的块可否向上移动一格
    var canStepTop = function (blockInfo) {
        _posRow = blockInfo.blockData.blockPosRow;
        _posCol = blockInfo.blockData.blockPosCol;
        if (blockInfo.blockData.blockSize == 0 || blockInfo.blockData.blockSize == 1) {
            //1x1或1x2
            if (!checkPosOccupied(_posRow - 2, _posCol - 1)) {
                return true;
            } else {
                return false;
            }
        } else {
            //2x1或2x2
            if (!checkPosOccupied(_posRow - 2, _posCol - 1) && !checkPosOccupied(_posRow - 2, _posCol)) {
                return true;
            } else {
                return false;
            }
        }
    };

    //判断被占据的块可否向下移动一格
    var canStepDown = function (blockInfo) {
        _posRow = blockInfo.blockData.blockPosRow;
        _posCol = blockInfo.blockData.blockPosCol;
        if (blockInfo.blockData.blockSize == 0) {
            //1x1
            if (!checkPosOccupied(_posRow, _posCol - 1)) {
                return true;
            } else {
                return false;
            }
        } else if (blockInfo.blockData.blockSize == 1) {
            //1x2
            if (!checkPosOccupied(_posRow + 1, _posCol - 1)) {
                return true;
            } else {
                return false;
            }
        } else if (blockInfo.blockData.blockSize == 2) {
            //2x1
            if (!checkPosOccupied(_posRow, _posCol - 1) && !checkPosOccupied(_posRow, _posCol)) {
                return true;
            } else {
                return false;
            }
        } else {
            //2x2
            if (!checkPosOccupied(_posRow + 1, _posCol - 1) && !checkPosOccupied(_posRow + 1, _posCol)) {
                return true;
            } else {
                return false;
            }
        }
    };

    //getRelativePos
    var getPosRelative = function (blockInfo, selBlockX, selBlockY) {
        xRelative = 'left';
        yRelative = 'top';
        var el_targetBlock = $('#blockid_' + blockInfo.blockId);
        if (el_targetBlock.position().left > selBlockX) {
            xRelative = 'right';
        }
        if (el_targetBlock.position().top > selBlockY) {
            yRelative = 'down';
        }
        return {
            relRow: yRelative,
            relCol: xRelative
        };
    };

    //删除当前选中的块
    var deleteBlock = function () {
        var blockIndex = getBlockIndexById(selBlockId);
        $('#blockid_' + selBlockId).remove();

        //删除选择app弹窗中的已选状态
        var appId = tempData.layout[blockIndex].bxAppId;
        if (appId != '') {
            $('#appbtnid_' + appId).removeClass('used');
            $('#appbtnid_' + appId).removeClass('sel');
        }

        tempData.layout.splice(blockIndex, 1);
        if (el_editlayout_content.find('.bn-block').length != 0) {
            selBlockId = el_editlayout_content.find('.bn-block').eq(0).attr('id').split('_')[1];
            selectBlock(selBlockId);
        }
    };

    //计算块被占据的情况
    var caculateOccupiedState = function () {
        occupiedArray = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
        var layoutData = tempData.layout;
        for (var i = 0; i < layoutData.length; i++) {
            //判断块是否被占据
            var row = layoutData[i].blockPosRow - 1;
            var col = layoutData[i].blockPosCol - 1;
            var blockSize = layoutData[i].blockSize;
            occupiedArray[row][col] = 1;
            if (blockSize == 1) {
                if (row < 2) {
                    occupiedArray[row + 1][col] = 1;
                }
            } else if (blockSize == 2) {
                if (col < 4) {
                    occupiedArray[row][col + 1] = 1;
                }
            } else if (blockSize == 3) {
                if (row < 2) {
                    occupiedArray[row + 1][col] = 1;
                }
                if (col < 4) {
                    occupiedArray[row][col + 1] = 1;
                    if (row < 2) {
                        occupiedArray[row + 1][col + 1] = 1;
                    }
                }
            }
        }
    };
    //判断某个位置是否被块占据
    var checkPosOccupied = function (row, col) {
        if (row < 0 || row > 2 || col < 0 || col > 4) {
            return 1;
        } else {
            caculateOccupiedState();
            return occupiedArray[row][col];
        }
    };

    var setOccupied = function (row, col, blockSize) {
        occupiedArray[row][col] = 1;
        if (blockSize == 1) {
            occupiedArray[row + 1][col] = 1;
        } else if (blockSize == 2) {
            occupiedArray[row][col + 1] = 1;
        } else if (blockSize == 3) {
            occupiedArray[row + 1][col] = 1;
            occupiedArray[row][col + 1] = 1;
            occupiedArray[row + 1][col + 1] = 1;
        }
    };

    var checkOccupied = function (row, col, blockSize) {
        var isOcuppied = occupiedArray[row][col];
        if (blockSize == 1) {
            isOcuppied = isOcuppied || occupiedArray[row + 1][col];
        } else if (blockSize == 2) {
            isOcuppied = isOcuppied || occupiedArray[row][col + 1];
        } else if (blockSize == 3) {
            isOcuppied = isOcuppied || occupiedArray[row + 1][col] || occupiedArray[row][col + 1] || occupiedArray[row + 1][col + 1];
        }
        return isOcuppied;
    };

    var checkSaveable = function () {
        var layoutData = tempData.layout;
        //console.log(JSON.stringify(layoutData));
        var result = true;
        var tiptext = '';
        var hasEmptyApp = false;
        var hasOccupied = false;
        var hasEmptyBlock = false;
        var el_blocks = el_editlayout_content.find('.bn-block');
        occupiedArray = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
        for (var i = 0; i < layoutData.length; i++) {
            //判断是否空布局
            if (layoutData[i].bxAppId == '') {
                hasEmptyApp = true;
            };

            //判断是否有重叠
            var row = layoutData[i].blockPosRow - 1;
            var col = layoutData[i].blockPosCol - 1;
            if (!checkOccupied(row, col, layoutData[i].blockSize)) {
                setOccupied(row, col, layoutData[i].blockSize);
            } else {
                hasOccupied = true;
            }
        }
        //console.log(occupiedArray);
        for (var i = 0; i < occupiedArray.length; i++) {
            for (var j = 0; j < occupiedArray[i].length; j++) {
                if (occupiedArray[i][j] == 0) {
                    hasEmptyBlock = true;
                }
            }
        }

        //console.log(JSON.stringify(originData.layout));
        //console.log(JSON.stringify(tempData.layout));

        if (tempData.layout.length == 0) {
            tiptext = '布局为空，请先编辑布局';
            result = false;
        } else if (hasEmptyApp) {
            tiptext = '请先给空的块选则应用';
            result = false;
        } else if (_.isEqual(originData.layout, tempData.layout)) {
            tiptext = '布局未修改，无需保存';
            result = false;
        } else if (hasOccupied) {
            tiptext = '块有重叠，请调整后再保存';
            result = false;
        } else if (hasEmptyBlock) {
            tiptext = '请填满布局区域再保存';
            result = false;
        }

        if (result) {
            return true;
        } else {
            el_body.trigger('ui.showtoptip', [tiptext, 2000]);
            return false;
        }
    };

    return EditLayoutCtrl;
}();

module.exports = EditLayoutCtrl;

},{"../util/variables":5,"underscore":1}],9:[function(require,module,exports){
/* ==================================================================================
 * edu-portal: layoutCtrl.js
 * 块布局
 * ================================================================================== */
var Variables = require('../util/variables');

var LayoutCtrl = function () {

    el_bn_container = $('#bn_container');
    el_layoutList_content = $('#layout_content');
    el_body = $('body');

    variables = new Variables();

    currentLayout = null;

    addNewLayoutHtml = "<div class='layout-box btn-add' id='btn_addlayout'>" + "<div class='sel-box'></div>" + "<i class='fa fa-plus'></i>" + "</div>";

    maxLayoutNum = 6; //每个用户最多4个布局

    //constructor
    function LayoutCtrl() {}

    LayoutCtrl.prototype.setHomeLayout = function (layoutListData, appListData, layoutId) {
        var layoutData = null;
        var layoutHtml = "";
        for (var i = 0; i < layoutListData.length; i++) {
            if (layoutListData[i]._id == layoutId) {
                layoutData = layoutListData[i];
                break;
            }
        }
        if (layoutData) {
            //alert(layoutData.layout.length);
            for (var i = 0; i < layoutData.layout.length; i++) {
                var blockData = layoutData.layout[i];
                //alert(blockData.bxAppId);
                var appData = null;
                var appTitle = '';
                var appDesc = '';
                var appId = '';
                var appLink = '';
                var appIconClass = '';
                var appType = '';

                for (j = 0; j < appListData.length; j++) {
                    if (appListData[j].bxAppId == blockData.bxAppId) {
                        appData = appListData[j];
                        appTitle = appData.bxAppName;
                        appDesc = appData.description;
                        appId = appData.bxAppId;
                        appType = appData.appType;
                        appLink = appData.menuLink;
                        appIconClass = appData.appIcon;
                    }
                }

                var blockSizeClass = variables.getSizeClass(blockData.blockSize);
                var blockColorClass = variables.getColorClass(blockData.blockColor - 1);
                var blockPosColClass = 'bn-pos-col-' + blockData.blockPosCol;
                var blockPosRowClass = 'bn-pos-row-' + blockData.blockPosRow;
                var blockTypeClass = 'bn-layout-' + blockData.blockType;
                var blockDiv = "<div class='bn-block block-hover-anim " + blockSizeClass + " " + blockColorClass + " " + blockPosColClass + " " + blockPosRowClass + " " + blockTypeClass + "' id='appId_" + appId + "'>";
                if (appType != 1) {
                    blockDiv = "<div class='bn-block block-hover-anim " + blockSizeClass + " " + blockColorClass + " " + blockPosColClass + " " + blockPosRowClass + " " + blockTypeClass + "' id='appId_" + appId + "'" + "data-toggle='popbox' data-target='#popover_" + appId + "'>";
                }
                var blockHtml = blockDiv + "<div class='sel-box'></div>" + "<div class='bn-new-mark'>" + "<i class='iconfont icon-new'></i>" + "</div>" + "<div class='bn-block-content'>" + "<i class='bn-icon iconfont " + appIconClass + "'></i>" + "<div class='bn-title'>" + appTitle + "</div>" + "<div class='bn-text'>" + appDesc + "</div>" + "</div>" + "</div>";

                layoutHtml += blockHtml;
            }
            el_bn_container.html(layoutHtml);

            el_bn_container.find('.bn-block').click(function () {
                //alert($(this).index());
                var bxAppId = $(this).attr('id').split('_')[1];
                var thisAppData = null;
                for (var i = 0; i < appListData.length; i++) {
                    var appData = appListData[i];
                    if (appData.bxAppId == bxAppId) {
                        thisAppData = appData;
                        break;
                    }
                }
                //alert(thisAppData.bxAppName);
                if (thisAppData.appType == 1) {
                    //window.open(thisAppData.menuLink);
                    el_body.trigger('ui.showtoptip', ['实际项目中点此将链接到对应的外部网站', 2500]);
                } else {
                    el_body.trigger('popover.show');
                }
            });

            el_bn_container.find('.block-hover-anim').on('mouseover', function () {
                $(this).removeClass('hover-out');
                $(this).addClass('hover-in');
            });

            el_bn_container.find('.block-hover-anim').on('mouseout', function () {
                $(this).removeClass('hover-in');
                $(this).addClass('hover-out');
            });
        }
    };

    LayoutCtrl.prototype.setLayoutList = function (layoutListData, appListData, layoutId) {
        var base = this;
        var layoutListHtml = "";
        for (var i = 0; i < layoutListData.length; i++) {
            var layoutBoxData = layoutListData[i];
            var layoutData = layoutBoxData.layout;
            var thisLayoutId = layoutBoxData._id;
            var operatorId = layoutBoxData.operatorId;
            var layoutBoxHtml = "";

            if (layoutId == thisLayoutId) {
                layoutBoxHtml = "<div class='layout-box has-inner-btn sel' id='id_" + thisLayoutId + "'>";
            } else {
                layoutBoxHtml = "<div class='layout-box has-inner-btn' id='id_" + thisLayoutId + "'>";
            }
            layoutBoxHtml += "<div class='sel-box'></div>";

            if (operatorId != 0) {
                var innerBtnHtml = "<div class='inner-btn-group'>" + "<div class='inner-btn btn-edit'>" + "<i class='fa fa-th'></i>" + " 编辑" + "</div> " + "<div class='inner-btn btn-delete'>" + "<i class='fa fa-trash-o'></i>" + " 删除" + "</div>" + "</div>";
                layoutBoxHtml += innerBtnHtml;
            }

            var layoutBlocksHtml = "";
            for (var j = 0; j < layoutData.length; j++) {
                var blockData = layoutData[j];
                var blockSizeClass = variables.getSizeClass(blockData.blockSize);
                var blockColorClass = variables.getColorClass(blockData.blockColor - 1);
                var blockPosColClass = 'bn-pos-col-' + blockData.blockPosCol;
                var blockPosRowClass = 'bn-pos-row-' + blockData.blockPosRow;
                var blockHtml = "<div class='bn-block " + blockSizeClass + " " + blockColorClass + " " + blockPosColClass + " " + blockPosRowClass + "'></div>";
                layoutBlocksHtml += blockHtml;
            }

            layoutBoxHtml += layoutBlocksHtml;
            layoutBoxHtml += "</div>";

            layoutListHtml += layoutBoxHtml;
        }
        if (layoutListData.length < maxLayoutNum) {
            layoutListHtml += addNewLayoutHtml;
        }
        el_layoutList_content.html(layoutListHtml);
        currentLayout = layoutId;
        el_layoutList_content.find('.layout-box').each(function () {
            var $this = $(this);
            var layoutIndex = $this.index();
            var thisLayoutId = $this.attr('id').split('_')[1];
            $this.find('.sel-box').click(function () {
                if (!$this.hasClass('sel') && !$this.hasClass('btn-add')) {
                    el_body.trigger('data.changeLayout', [thisLayoutId]);
                } else if ($this.hasClass('btn-add')) {
                    el_body.trigger('ui.editlayout', ['empty', appListData, 'empty']);
                }
            });
            $this.find('.btn-edit').click(function () {
                //alert(JSON.stringify(appListData));
                el_body.trigger('ui.editlayout', [layoutListData[layoutIndex], appListData, thisLayoutId]);
            });
            $this.find('.btn-delete').click(function () {
                //alert('to delete');
                el_body.trigger('data.deleteLayout', [thisLayoutId]);
            });
        });
    };

    LayoutCtrl.prototype.changeLayout = function (layoutListData, appListData, layoutId) {
        var base = this;
        this.setHomeLayout(layoutListData, appListData, layoutId);
        $('#id_' + currentLayout).removeClass('sel');
        $('#id_' + layoutId).addClass('sel');
        currentLayout = layoutId;
    };

    LayoutCtrl.prototype.deleteLayout = function (deleteLayoutId, appListData) {
        var base = this;
        $('#id_' + deleteLayoutId).remove();
        if (el_layoutList_content.find('.btn-add').length == 0 && el_layoutList_content.find('.layout-box').length < maxLayoutNum) {
            el_layoutList_content.append(addNewLayoutHtml);
            el_layoutList_content.find('.btn-add').each(function () {
                var $this = $(this);
                $this.find('.sel-box').click(function () {
                    el_body.trigger('ui.editlayout', ['empty', appListData, 'empty']);
                });
            });
        }
    };

    return LayoutCtrl;
}();

module.exports = LayoutCtrl;

},{"../util/variables":5}],10:[function(require,module,exports){
/* ==================================================================================
 * edu-portal: setupToggle.js
 * 设置切换
 * ================================================================================== */

var SetupToggle = function () {

    el_setup_btns = $('.setup_toggle_btn'); //切换按钮们
    el_layout_content = $('#layout_content');

    setupContents = ['#theme_content', '#layout_content'];
    currentSetupContentId = 0;

    //constructor
    function SetupToggle() {
        this.initLayout();
    }

    SetupToggle.prototype.initLayout = function () {
        var base = this;

        el_layout_content.perfectScrollbar({
            suppressScrollX: true
        });

        el_setup_btns.click(function () {
            setupContentId = $(this).index();
            base.setSetupContent(setupContentId);
            if (setupContents[setupContentId] == '#layout_content') {
                el_layout_content.perfectScrollbar('update');
            }
        });

        base.setSetupContent(currentSetupContentId);
    };

    //
    SetupToggle.prototype.setSetupContent = function (setupContentId) {
        if (currentSetupContentId != setupContentId) {
            $(setupContents[currentSetupContentId]).removeClass("current-container");
            el_setup_btns.eq(currentSetupContentId).removeClass('sel');
            $(setupContents[setupContentId]).addClass("current-container");
            el_setup_btns.eq(setupContentId).addClass('sel');
            currentSetupContentId = setupContentId;
        } else if (!$("body").hasClass(themes[setupContentId])) {
            $(setupContents[setupContentId]).addClass("current-container");
            el_setup_btns.eq(setupContentId).addClass('sel');
        }
    };

    return SetupToggle;
}();

module.exports = SetupToggle;

},{}],11:[function(require,module,exports){
/* ==================================================================================
 * edu-portal: themeCtrl.js
 * 主题设置
 * ================================================================================== */

var ThemeCtrl = function () {

    el_theme_boxes = $('.theme-box'); //主题按钮们
    el_body = $('body');

    themes = ['theme1', 'theme2', 'theme3', 'theme4', 'theme5', 'theme6'];
    currentThemeId = null;

    //constructor
    function ThemeCtrl() {
        if (el_theme_boxes.length > 0) {
            this.initLayout();
        }
    }

    ThemeCtrl.prototype.initLayout = function () {
        var base = this;
        el_theme_boxes.click(function () {
            themeId = $(this).index();
            //base.setTheme(themeId);
            el_body.trigger('data.changeTheme', [themeId]);
        });
        //base.setTheme(currentThemeId);
    };

    ThemeCtrl.prototype.setTheme = function (themeId) {
        if (currentThemeId != themeId) {
            $("body").removeClass(themes[currentThemeId]);
            el_theme_boxes.eq(currentThemeId).removeClass('sel');
            $("body").addClass(themes[themeId]);
            el_theme_boxes.eq(themeId).addClass('sel');
            currentThemeId = themeId;
        } else if (!$("body").hasClass(themes[themeId])) {
            $("body").addClass(themes[themeId]);
            el_theme_boxes.eq(themeId).addClass('sel');
        }
    };

    return ThemeCtrl;
}();

module.exports = ThemeCtrl;

},{}],12:[function(require,module,exports){
/* ==================================================================================
 * edu-portal: timeCtrl.js
 * 设置切换
 * ================================================================================== */

var TimeCtrl = function () {

    days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    //constructor
    function TimeCtrl() {
        setInterval(function () {
            setTimeText();
        }, 100);
    }

    function setTimeText() {
        var myDate = new Date();

        var monthNum = myDate.getMonth() + 1;
        var month = (monthNum < 10 ? '0' + monthNum : monthNum) + '月';
        var date = myDate.getDate() + '日 ';
        var day = days[myDate.getDay()] + ' ';
        var hour = myDate.getHours() + ':';
        var minute = myDate.getMinutes() < 10 ? '0' + myDate.getMinutes() : myDate.getMinutes();
        var second = ':' + (myDate.getSeconds() < 10 ? '0' + myDate.getSeconds() : myDate.getSeconds());

        var dateText = month + date + day + hour + minute + second;
        //alert(dateText);
        $('#date').html(dateText);
    }

    return TimeCtrl;
}();

module.exports = TimeCtrl;

},{}],13:[function(require,module,exports){
/* ==================================================================================
 * edu-portal: uiCtrl.js
 * 控制页面内容切换，页面大小自适应等
 * ================================================================================== */

var SetupToggle = require('./setupToggle');
var ThemeCtrl = require('./themeCtrl');
var AppListCtrl = require('./appListCtrl');
var LayoutCtrl = require('./layoutCtrl');
var EditLayoutCtrl = require('./editLayoutCtrl');
var TimeCtrl = require('./timeCtrl');

var UiCtrl = function () {

    winHeight = 0;
    winWidth = 0;
    containers = ['#container_home', '#container_apps', '#container_setup', '#container_addlayout'];
    btns = ['#btn_home', '#btn_apps', '#btn_setup'];
    currentContainerId = 0;

    domLoaded = false;

    el_body = $('body');

    el_topbar = $('.topbar');
    el_applist = $('#applist');
    el_btn_home = $('#btn_home');
    el_btn_setup = $('#btn_setup , #btn_return_setup');
    el_btn_apps = $('#btn_apps');

    el_loading_mask = $('.loading-mask');
    el_top_tip = $('.top-tip');
    tipTimer = null;

    el_btn_rightmenu_show = $('#btn_rightmenu_show');
    el_btn_rightmenu_hide = $('#btn_rightmenu_hide');

    el_username = $('#username');
    el_topavatar = $('#btn_rightmenu_show');
    el_rightmenu_avatar = $('#rightmenu_avatar');

    setupToggle = new SetupToggle();
    themeCtrl = new ThemeCtrl();
    appListCtrl = new AppListCtrl();
    layoutCtrl = new LayoutCtrl();
    editLayoutCtrl = new EditLayoutCtrl();
    timeCtrl = new TimeCtrl();

    //constructor
    function UiCtrl() {
        initLayout();
        this.setContainer(0);
    }

    var initLayout = function () {
        var base = this;
        setResponsive();
        el_applist.perfectScrollbar({ suppressScrollX: true });
        $('.rm-menu').perfectScrollbar({ suppressScrollX: true });
    };

    //事件处理
    UiCtrl.prototype.bindeEvents = function () {
        var base = this;
        //首页按钮
        el_btn_home.click(function () {
            base.setContainer(0);
        });
        //应用列表按钮
        el_btn_apps.click(function () {
            base.setContainer(1);
            el_applist.perfectScrollbar('update');
        });
        //设置按钮
        el_btn_setup.click(function () {
            base.setContainer(2);
        });
        $('#theme_setup').click(function () {
            base.setContainer(2);
            el_body.removeClass('popover-show');
            el_body.removeClass('popover-hide');
            el_body.addClass('rightmenu-hide');
            el_body.removeClass('rightmenu-show');
        });
        //新建布局按钮
        //$('#btn_addlayout').click(function(){
        //    setContainer(3);
        //});

        el_btn_rightmenu_show.click(function () {
            el_body.removeClass('popover-show');
            el_body.removeClass('popover-hide');
            el_body.removeClass('rightmenu-hide');
            el_body.addClass('rightmenu-show');
        });
        el_btn_rightmenu_hide.click(function () {
            el_body.removeClass('popover-show');
            el_body.removeClass('popover-hide');
            el_body.addClass('rightmenu-hide');
            el_body.removeClass('rightmenu-show');
        });

        el_body.bind('popover.show', function () {
            el_body.removeClass('rightmenu-show');
            el_body.removeClass('rightmenu-hide');
            el_body.addClass('popover-show');
            el_body.removeClass('popover-hide');
        });
        el_body.bind('popover.hide', function () {
            el_body.removeClass('rightmenu-show');
            el_body.removeClass('rightmenu-hide');
            el_body.removeClass('popover-show');
            el_body.addClass('popover-hide');
        });
        $('.popover-bg, .popbox-dismiss').click(function () {
            el_body.trigger('popover.hide');
        });

        el_body.bind('ui.editlayout', function (evt, layoutData, appListData, layoutId) {
            base.setContainer(3);
            editLayoutCtrl.setEditLayout(layoutData, appListData, layoutId);
        });

        el_body.bind('ui.showtoptip', function (evt, tiptext, showtime) {
            base.showTopTip(tiptext, showtime);
        });

        $('#btn_logout').click(function () {
            el_body.trigger('data.logout');
        });

        $(window).resize(function () {
            setResponsive();
        });

        window.onload = function () {
            domLoaded = true;
        };
    };

    //自适应屏幕
    var setResponsive = function () {

        if (window.innerHeight) {
            winHeight = window.innerHeight;
            winWidth = window.innerWidth;
        } else if (document.body && document.body.clientHeight) {
            winHeight = document.body.clientHeight;
            winWidth = document.body.clientWidth;
        } else {
            winHeight = document.documentElement.clientHeight;
            winWidth = document.documentElement.clientWidth;
        }

        if (winWidth <= 1920) $("html").attr("class", "screen-large");

        if (winWidth <= 1400) $("html").attr("class", "screen-normal");

        if (winWidth <= 1200) $("html").attr("class", "screen-small");

        if (winWidth <= 1000) $("html").attr("class", "screen-tablet");

        if (winWidth <= 700) $("html").attr("class", "screen-mobile");
    };

    //切换页面容器
    UiCtrl.prototype.setContainer = function (containerId) {
        if (currentContainerId != containerId) {
            $(containers[currentContainerId]).removeClass('current-container');
            $(containers[containerId]).addClass('current-container');
            if (containerId < 3) {
                $(btns[currentContainerId]).removeClass('current');
                $(btns[containerId]).addClass('current');
            }
            currentContainerId = containerId;
        } else if (!$(containers[containerId]).hasClass('current-container')) {
            $(containers[containerId]).addClass('current-container');
            if (containerId < 3) {
                $(btns[containerId]).addClass('current');
            }
        }

        if (containerId == 3) {
            el_topbar.addClass('hide');
        } else {
            el_topbar.removeClass('hide');
        }
    };

    UiCtrl.prototype.setUserInfo = function (userData) {
        el_username.html(userData.userName);
        if (userData.avatar && userData.avatar != "") {
            var imgHtml = "<img src='" + userData.avatar + "'>";
            el_topavatar.html(imgHtml);
            el_rightmenu_avatar.html(imgHtml);
        }
    };

    UiCtrl.prototype.setTheme = function (themeId) {
        themeCtrl.setTheme(themeId);
    };

    UiCtrl.prototype.setAppList = function (appListData) {
        appListCtrl.setAppList(appListData);
    };

    UiCtrl.prototype.setHomeLayout = function (layoutListData, appListData, layoutId) {
        layoutCtrl.setHomeLayout(layoutListData, appListData, layoutId);
    };

    UiCtrl.prototype.setLayoutList = function (layoutListData, appListData, layoutId) {
        layoutCtrl.setLayoutList(layoutListData, appListData, layoutId);
    };

    UiCtrl.prototype.changeLayout = function (layoutListData, appListData, layoutId) {
        layoutCtrl.changeLayout(layoutListData, appListData, layoutId);
    };

    UiCtrl.prototype.deleteLayout = function (deleteLayoutId, appListData) {
        layoutCtrl.deleteLayout(deleteLayoutId, appListData);
    };

    UiCtrl.prototype.loadingShow = function () {
        if (!el_loading_mask.hasClass('show')) {
            el_loading_mask.addClass('show');
        }
    };

    UiCtrl.prototype.loadingHide = function () {
        el_loading_mask.removeClass('show');
    };

    UiCtrl.prototype.getDomLoaded = function () {
        return domLoaded;
    };

    UiCtrl.prototype.showTopTip = function (tiptext, showtime) {
        if (!showtime) {
            showtiem = 2000;
        }
        el_top_tip.html(tiptext);
        /*
        el_top_tip.addClass('show');
        if(tipTimer != null) {
            window.clearTimeout(tipTimer);
        }
        tipTimer = window.setTimeout(function(){
            el_top_tip.removeClass('show');
            window.clearTimeout(tipTimer);
        },showtime);*/

        if (el_top_tip.hasClass('show')) {
            if (el_top_tip.hasClass('shake_1')) {
                el_top_tip.removeClass('shake_1');
                el_top_tip.addClass('shake_2');
            } else if (el_top_tip.hasClass('shake_2')) {
                el_top_tip.removeClass('shake_2');
                el_top_tip.addClass('shake_1');
            } else {
                el_top_tip.addClass('shake_1');
            }
        } else {
            el_top_tip.addClass('show');
        }

        if (tipTimer != null) {
            window.clearTimeout(tipTimer);
        }
        tipTimer = window.setTimeout(function () {
            el_top_tip.removeClass('show');
            el_top_tip.removeClass('shake_1');
            el_top_tip.removeClass('shake_2');
            window.clearTimeout(tipTimer);
        }, showtime);
    };

    return UiCtrl;
}();

module.exports = UiCtrl;

},{"./appListCtrl":6,"./editLayoutCtrl":8,"./layoutCtrl":9,"./setupToggle":10,"./themeCtrl":11,"./timeCtrl":12}],14:[function(require,module,exports){
/* ========================================================================
 * Dolphin: popbox.js v0.0.1
 * 用于点击某元素弹出相应的提示框、模态窗口以及菜单等内容区域
 * ======================================================================== */

(function (factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        // AMD
        define(factory);
    } else if (typeof module !== 'undefined' && module.exports) {
        // CommonJS
        module.exports = factory;
    } else {
        // Global
        factory();
    }
})(function ($) {
    'use strict';

    var toggle = '[data-toggle="popbox"]';
    var backdrop = '.popbox-backdrop';
    var Popbox = function () {};

    function getParent($this) {
        var selector = $this.attr('data-target');

        if (!selector) {
            selector = $this.attr('href');
            selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
        }

        var $parent = selector && $(selector);

        return $parent && $parent.length ? $parent : $this.parent();
    }

    function clearPopboxes(e) {
        if (e && e.which === 3) return;
        $(backdrop).remove();
        $(toggle).each(function () {
            var $this = $(this);
            var $parent = getParent($this);
            var relatedTarget = { relatedTarget: this };

            if (!$parent.hasClass('open')) return;

            if (e && e.type == 'click' && /input|textarea/i.test(e.target.tagName) && $.contains($parent[0], e.target)) return;

            $parent.trigger(e = $.Event('hide.dp.popbox', relatedTarget));

            if (e.isDefaultPrevented()) return;

            $parent.removeClass('open').trigger($.Event('hidden.dp.popbox', relatedTarget));
        });
    }

    Popbox.prototype.dismiss = function (e) {
        var $this = $(this);
        var $parent = getParent($this);
        if ($parent.hasClass('open')) {
            $parent.removeClass('open');
        }
    };

    Popbox.prototype.toggle = function (e) {
        var $this = $(this);

        if ($this.is('.disabled, :disabled')) return;

        var $parent = getParent($this);
        var isActive = $parent.hasClass('open');

        //alert($this.hasClass('no-clear'));
        //alert($(e.target).hasClass('no-clear'));
        if (!$this.hasClass('no-clear')) {
            clearPopboxes();
        }

        if (!isActive) {
            if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
                // if mobile we use a backdrop because click events don't delegate
                $(document.createElement('div')).addClass('popbox-backdrop').insertAfter($(this)).on('click', clearPopboxes);
            }
            var relatedTarget = { relatedTarget: this };
            $parent.trigger(e = $.Event('show.dp.popbox', relatedTarget));

            if (e.isDefaultPrevented()) return;

            $this.trigger('focus');

            $parent.toggleClass('open').trigger($.Event('shown.dp.popbox', relatedTarget));
        }

        return false;
    };

    $(document).on('click.dp.popbox.data-api', clearPopboxes).on('click.dp.popbox.data-api', '.popbox form', function (e) {
        e.stopPropagation();
    }).on('click.dp.popbox.data-api', '.popbox-content form', function (e) {
        e.stopPropagation();
    }).on('click.dp.popbox.data-api', '.popbox-model', function (e) {
        e.stopPropagation();
    }).on('click.dp.popbox.data-api', '.dropdown-menu li', function (e) {
        e.stopPropagation();
    }).on('click.dp.popbox.data-api', '.pagination', function (e) {
        e.stopPropagation();
    }).on('click.dp.popbox.data-api', '.popbox-dismiss', Popbox.prototype.dismiss).on('click.dp.popbox.data-api', toggle, Popbox.prototype.toggle);
});

},{}]},{},[2]);
