(function () {
  'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;

    try {
      Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function _construct(Parent, args, Class) {
    if (isNativeReflectConstruct()) {
      _construct = Reflect.construct;
    } else {
      _construct = function _construct(Parent, args, Class) {
        var a = [null];
        a.push.apply(a, args);
        var Constructor = Function.bind.apply(Parent, a);
        var instance = new Constructor();
        if (Class) _setPrototypeOf(instance, Class.prototype);
        return instance;
      };
    }

    return _construct.apply(null, arguments);
  }

  function _isNativeFunction(fn) {
    return Function.toString.call(fn).indexOf("[native code]") !== -1;
  }

  function _wrapNativeSuper(Class) {
    var _cache = typeof Map === "function" ? new Map() : undefined;

    _wrapNativeSuper = function _wrapNativeSuper(Class) {
      if (Class === null || !_isNativeFunction(Class)) return Class;

      if (typeof Class !== "function") {
        throw new TypeError("Super expression must either be null or a function");
      }

      if (typeof _cache !== "undefined") {
        if (_cache.has(Class)) return _cache.get(Class);

        _cache.set(Class, Wrapper);
      }

      function Wrapper() {
        return _construct(Class, arguments, _getPrototypeOf(this).constructor);
      }

      Wrapper.prototype = Object.create(Class.prototype, {
        constructor: {
          value: Wrapper,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
      return _setPrototypeOf(Wrapper, Class);
    };

    return _wrapNativeSuper(Class);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    }
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
  }

  /*
    Adapted from https://github.com/dgraham/stache-bind
    Copyright (c) 2015-2018 David Graham

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
    LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
    OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
    WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  */
  // Maps context object to observer tree.
  var trees = new WeakMap();

  function escape(text) {
    var node = document.createElement('p');
    node.textContent = text;
    return node.innerHTML;
  }

  function resolve(obj, prop) {
    if (typeof obj !== 'undefined') {
      var value = obj[prop];

      if (typeof value === 'function') {
        return value.call();
      }

      return value;
    }
  }

  function pluck(context, key) {
    var properties = key.split('.');
    var value = properties.reduce(resolve, context) || '';
    return escape(value);
  }

  function bindings(node) {
    var results = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = node.childNodes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var child = _step.value;

        switch (child.nodeType) {
          case 1:
            results.push.apply(results, _toConsumableArray(bindAttributes(child)));
            results.push.apply(results, _toConsumableArray(bindings(child)));
            break;

          case 3:
            results.push.apply(results, _toConsumableArray(bindText(child)));
            break;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return results;
  }

  function notifyTree(node) {
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = node.observers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var fn = _step2.value;
        fn();
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
          _iterator2["return"]();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    for (var name in node.children) {
      notifyTree(node.children[name]);
    }
  }

  function appendChild(parent, name) {
    var child = parent.children[name];

    if (!child) {
      child = {
        name: name,
        children: {},
        observers: []
      };
      parent.children[name] = child;
    }

    return child;
  }

  function compose(a, b) {
    return function composed() {
      return a(b.apply(this, arguments));
    };
  }

  function descend(node, key, visitor) {
    var fn = compose(visitor, appendChild);
    return key.split('.').reduce(fn, node);
  } // Finds or builds the observer tree for a context object.


  function tree(context) {
    var root = trees.get(context);

    if (!root) {
      root = {
        children: {},
        observers: []
      };
      trees.set(context, root);
    }

    return root;
  }

  function bind(fragment, context) {
    var root = tree(context);
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = bindings(fragment)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var _step3$value = _step3.value,
            target = _step3$value.target,
            key = _step3$value.key,
            update = _step3$value.update;
        var observer = update.bind(target, context, key);
        var leaf = descend(root, key, proxyOnce(context));
        leaf.observers.push(observer);
        update.call(target, context, key);
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
          _iterator3["return"]();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    return fragment;
  } // Returns a visitor function to descend through a context object's
  // attributes, proxying assignment operators to notify the observer
  // tree of changes.


  function proxyOnce(context) {
    var current = context;
    return function visit(node) {
      if (!node.proxied) {
        proxy(current, node.name, notifyTree.bind(null, node));
        node.proxied = true;
      }

      current = current[node.name];
      return node;
    };
  }

  function proxy(target, property, after) {
    var current = target[property];
    Object.defineProperty(target, property, {
      get: function get() {
        return current;
      },
      set: function set(value) {
        current = value;
        after();
      }
    });
  }

  function updateText(context, key) {
    this.textContent = pluck(context, key);
  }

  function updateAttribute(context, key) {
    this.value = pluck(context, key);
  }

  function parse(text) {
    return text.split(/({{.+?}})/).map(function (token) {
      var stache = token.startsWith('{{') && token.endsWith('}}');
      return stache ? {
        type: 1,
        value: token.slice(2, -2).trim()
      } : {
        type: 0,
        value: token
      };
    });
  }

  function bindAttributes(node) {
    var bindings = [];

    for (var _i = 0, _Array$from = Array.from(node.attributes); _i < _Array$from.length; _i++) {
      var attr = _Array$from[_i];
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = parse(attr.value)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var token = _step4.value;

          if (token.type === 1) {
            bindings.push({
              target: attr,
              key: token.value,
              update: updateAttribute
            });
          }
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
            _iterator4["return"]();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }

    return bindings;
  }

  function bindText(node) {
    var tokens = parse(node.textContent);

    if (tokens.length === 1 && tokens[0].type === 0) {
      return [];
    }

    var bindings = [];
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = tokens[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var token = _step5.value;
        var text = document.createTextNode(token.value);
        node.parentNode.insertBefore(text, node);

        if (token.type === 1) {
          bindings.push({
            target: text,
            key: token.value,
            update: updateText
          });
        }
      }
    } catch (err) {
      _didIteratorError5 = true;
      _iteratorError5 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
          _iterator5["return"]();
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5;
        }
      }
    }

    node.parentNode.removeChild(node);
    return bindings;
  }

  function stashe(fragment) {
    return function evaluate(context) {
      return bind(fragment, context);
    };
  }

  // Public: Create a new SelectorSet.
  function SelectorSet() {
    // Construct new SelectorSet if called as a function.
    if (!(this instanceof SelectorSet)) {
      return new SelectorSet();
    }

    // Public: Number of selectors added to the set
    this.size = 0;

    // Internal: Incrementing ID counter
    this.uid = 0;

    // Internal: Array of String selectors in the set
    this.selectors = [];

    // Internal: All Object index String names mapping to Index objects.
    this.indexes = Object.create(this.indexes);

    // Internal: Used Object index String names mapping to Index objects.
    this.activeIndexes = [];
  }

  // Detect prefixed Element#matches function.
  var docElem = window.document.documentElement;
  var matches = (docElem.matches ||
                  docElem.webkitMatchesSelector ||
                  docElem.mozMatchesSelector ||
                  docElem.oMatchesSelector ||
                  docElem.msMatchesSelector);

  // Public: Check if element matches selector.
  //
  // Maybe overridden with custom Element.matches function.
  //
  // el       - An Element
  // selector - String CSS selector
  //
  // Returns true or false.
  SelectorSet.prototype.matchesSelector = function(el, selector) {
    return matches.call(el, selector);
  };

  // Public: Find all elements in the context that match the selector.
  //
  // Maybe overridden with custom querySelectorAll function.
  //
  // selectors - String CSS selectors.
  // context   - Element context
  //
  // Returns non-live list of Elements.
  SelectorSet.prototype.querySelectorAll = function(selectors, context) {
    return context.querySelectorAll(selectors);
  };


  // Public: Array of indexes.
  //
  // name     - Unique String name
  // selector - Function that takes a String selector and returns a String key
  //            or undefined if it can't be used by the index.
  // element  - Function that takes an Element and returns an Array of String
  //            keys that point to indexed values.
  //
  SelectorSet.prototype.indexes = [];

  // Index by element id
  var idRe = /^#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g;
  SelectorSet.prototype.indexes.push({
    name: 'ID',
    selector: function matchIdSelector(sel) {
      var m;
      if (m = sel.match(idRe)) {
        return m[0].slice(1);
      }
    },
    element: function getElementId(el) {
      if (el.id) {
        return [el.id];
      }
    }
  });

  // Index by all of its class names
  var classRe = /^\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g;
  SelectorSet.prototype.indexes.push({
    name: 'CLASS',
    selector: function matchClassSelector(sel) {
      var m;
      if (m = sel.match(classRe)) {
        return m[0].slice(1);
      }
    },
    element: function getElementClassNames(el) {
      var className = el.className;
      if (className) {
        if (typeof className === 'string') {
          return className.split(/\s/);
        } else if (typeof className === 'object' && 'baseVal' in className) {
          // className is a SVGAnimatedString
          // global SVGAnimatedString is not an exposed global in Opera 12
          return className.baseVal.split(/\s/);
        }
      }
    }
  });

  // Index by tag/node name: `DIV`, `FORM`, `A`
  var tagRe = /^((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g;
  SelectorSet.prototype.indexes.push({
    name: 'TAG',
    selector: function matchTagSelector(sel) {
      var m;
      if (m = sel.match(tagRe)) {
        return m[0].toUpperCase();
      }
    },
    element: function getElementTagName(el) {
      return [el.nodeName.toUpperCase()];
    }
  });

  // Default index just contains a single array of elements.
  SelectorSet.prototype.indexes['default'] = {
    name: 'UNIVERSAL',
    selector: function() {
      return true;
    },
    element: function() {
      return [true];
    }
  };


  // Use ES Maps when supported
  var Map$1;
  if (typeof window.Map === 'function') {
    Map$1 = window.Map;
  } else {
    Map$1 = (function() {
      function Map() {
        this.map = {};
      }
      Map.prototype.get = function(key) {
        return this.map[key + ' '];
      };
      Map.prototype.set = function(key, value) {
        this.map[key + ' '] = value;
      };
      return Map;
    })();
  }


  // Regexps adopted from Sizzle
  //   https://github.com/jquery/sizzle/blob/1.7/sizzle.js
  //
  var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g;

  // Internal: Get indexes for selector.
  //
  // selector - String CSS selector
  //
  // Returns Array of {index, key}.
  function parseSelectorIndexes(allIndexes, selector) {
    allIndexes = allIndexes.slice(0).concat(allIndexes['default']);

    var allIndexesLen = allIndexes.length,
        i, j, m, dup, rest = selector,
        key, index, indexes = [];

    do {
      chunker.exec('');
      if (m = chunker.exec(rest)) {
        rest = m[3];
        if (m[2] || !rest) {
          for (i = 0; i < allIndexesLen; i++) {
            index = allIndexes[i];
            if (key = index.selector(m[1])) {
              j = indexes.length;
              dup = false;
              while (j--) {
                if (indexes[j].index === index && indexes[j].key === key) {
                  dup = true;
                  break;
                }
              }
              if (!dup) {
                indexes.push({index: index, key: key});
              }
              break;
            }
          }
        }
      }
    } while (m);

    return indexes;
  }

  // Internal: Find first item in Array that is a prototype of `proto`.
  //
  // ary   - Array of objects
  // proto - Prototype of expected item in `ary`
  //
  // Returns object from `ary` if found. Otherwise returns undefined.
  function findByPrototype(ary, proto) {
    var i, len, item;
    for (i = 0, len = ary.length; i < len; i++) {
      item = ary[i];
      if (proto.isPrototypeOf(item)) {
        return item;
      }
    }
  }

  // Public: Log when added selector falls under the default index.
  //
  // This API should not be considered stable. May change between
  // minor versions.
  //
  // obj - {selector, data} Object
  //
  //   SelectorSet.prototype.logDefaultIndexUsed = function(obj) {
  //     console.warn(obj.selector, "could not be indexed");
  //   };
  //
  // Returns nothing.
  SelectorSet.prototype.logDefaultIndexUsed = function() {};

  // Public: Add selector to set.
  //
  // selector - String CSS selector
  // data     - Optional data Object (default: undefined)
  //
  // Returns nothing.
  SelectorSet.prototype.add = function(selector, data) {
    var obj, i, indexProto, key, index, objs,
        selectorIndexes, selectorIndex,
        indexes = this.activeIndexes,
        selectors = this.selectors;

    if (typeof selector !== 'string') {
      return;
    }

    obj = {
      id: this.uid++,
      selector: selector,
      data: data
    };

    selectorIndexes = parseSelectorIndexes(this.indexes, selector);
    for (i = 0; i < selectorIndexes.length; i++) {
      selectorIndex = selectorIndexes[i];
      key = selectorIndex.key;
      indexProto = selectorIndex.index;

      index = findByPrototype(indexes, indexProto);
      if (!index) {
        index = Object.create(indexProto);
        index.map = new Map$1();
        indexes.push(index);
      }

      if (indexProto === this.indexes['default']) {
        this.logDefaultIndexUsed(obj);
      }
      objs = index.map.get(key);
      if (!objs) {
        objs = [];
        index.map.set(key, objs);
      }
      objs.push(obj);
    }

    this.size++;
    selectors.push(selector);
  };

  // Public: Remove selector from set.
  //
  // selector - String CSS selector
  // data     - Optional data Object (default: undefined)
  //
  // Returns nothing.
  SelectorSet.prototype.remove = function(selector, data) {
    if (typeof selector !== 'string') {
      return;
    }

    var selectorIndexes, selectorIndex, i, j, k, selIndex, objs, obj;
    var indexes = this.activeIndexes;
    var removedIds = {};
    var removeAll = arguments.length === 1;

    selectorIndexes = parseSelectorIndexes(this.indexes, selector);
    for (i = 0; i < selectorIndexes.length; i++) {
      selectorIndex = selectorIndexes[i];

      j = indexes.length;
      while (j--) {
        selIndex = indexes[j];
        if (selectorIndex.index.isPrototypeOf(selIndex)) {
          objs = selIndex.map.get(selectorIndex.key);
          if (objs) {
            k = objs.length;
            while (k--) {
              obj = objs[k];
              if (obj.selector === selector && (removeAll || obj.data === data)) {
                objs.splice(k, 1);
                removedIds[obj.id] = true;
              }
            }
          }
          break;
        }
      }
    }

    this.size -= Object.keys(removedIds).length;
  };

  // Sort by id property handler.
  //
  // a - Selector obj.
  // b - Selector obj.
  //
  // Returns Number.
  function sortById(a, b) {
    return a.id - b.id;
  }

  // Public: Find all matching decendants of the context element.
  //
  // context - An Element
  //
  // Returns Array of {selector, data, elements} matches.
  SelectorSet.prototype.queryAll = function(context) {
    if (!this.selectors.length) {
      return [];
    }

    var matches = {}, results = [];
    var els = this.querySelectorAll(this.selectors.join(', '), context);

    var i, j, len, len2, el, m, match, obj;
    for (i = 0, len = els.length; i < len; i++) {
      el = els[i];
      m = this.matches(el);
      for (j = 0, len2 = m.length; j < len2; j++) {
        obj = m[j];
        if (!matches[obj.id]) {
          match = {
            id: obj.id,
            selector: obj.selector,
            data: obj.data,
            elements: []
          };
          matches[obj.id] = match;
          results.push(match);
        } else {
          match = matches[obj.id];
        }
        match.elements.push(el);
      }
    }

    return results.sort(sortById);
  };

  // Public: Match element against all selectors in set.
  //
  // el - An Element
  //
  // Returns Array of {selector, data} matches.
  SelectorSet.prototype.matches = function(el) {
    if (!el) {
      return [];
    }

    var i, j, k, len, len2, len3, index, keys, objs, obj, id;
    var indexes = this.activeIndexes, matchedIds = {}, matches = [];

    for (i = 0, len = indexes.length; i < len; i++) {
      index = indexes[i];
      keys = index.element(el);
      if (keys) {
        for (j = 0, len2 = keys.length; j < len2; j++) {
          if (objs = index.map.get(keys[j])) {
            for (k = 0, len3 = objs.length; k < len3; k++) {
              obj = objs[k];
              id = obj.id;
              if (!matchedIds[id] && this.matchesSelector(el, obj.selector)) {
                matchedIds[id] = true;
                matches.push(obj);
              }
            }
          }
        }
      }
    }

    return matches.sort(sortById);
  };

  // Adapted from https://github.com/dgraham/delegated-events
  var bubbleEvents = new WeakMap();
  var captureEvents = new WeakMap();
  var propagationStopped = new WeakMap();
  var immediatePropagationStopped = new WeakMap();
  var currentTargets = new WeakMap();
  var currentTargetDesc = Object.getOwnPropertyDescriptor(Event.prototype, 'currentTarget');

  function before(subject, verb, fn) {
    var source = subject[verb];

    subject[verb] = function () {
      fn.apply(subject, arguments);
      return source.apply(subject, arguments);
    };

    return subject;
  }

  function matches$1(selectors, target, reverse) {
    var queue = [];
    var node = target;

    do {
      if (node.nodeType !== 1) break;

      var _matches = selectors.matches(node);

      if (_matches.length) {
        var matched = {
          node: node,
          observers: _matches
        };

        if (reverse) {
          queue.unshift(matched);
        } else {
          queue.push(matched);
        }
      }
    } while (node = node.parentElement);

    return queue;
  }

  function trackPropagation() {
    propagationStopped.set(this, true);
  }

  function trackImmediate() {
    propagationStopped.set(this, true);
    immediatePropagationStopped.set(this, true);
  }

  function getCurrentTarget() {
    return currentTargets.get(this) || null;
  }

  function defineCurrentTarget(event, getter) {
    if (!currentTargetDesc) return;
    Object.defineProperty(event, 'currentTarget', {
      configurable: true,
      enumerable: true,
      get: getter || currentTargetDesc.get
    });
  }

  function getEventsStore(capture, doc) {
    var result = {};

    if (capture) {
      if (!captureEvents.has(doc)) {
        captureEvents.set(doc, result);
      }

      result = captureEvents.get(doc);
    } else {
      if (!bubbleEvents.has(doc)) {
        bubbleEvents.set(doc, result);
      }

      result = bubbleEvents.get(doc);
    }

    return result;
  }

  function dispatch(event) {
    var doc = event.currentTarget;
    var events = getEventsStore(event.eventPhase === 1, doc);
    var selectors = events[event.type];
    if (!selectors) return;
    var queue = matches$1(selectors, event.target, event.eventPhase === 1);
    if (!queue.length) return;
    before(event, 'stopPropagation', trackPropagation);
    before(event, 'stopImmediatePropagation', trackImmediate);
    defineCurrentTarget(event, getCurrentTarget);

    for (var i = 0, len1 = queue.length; i < len1; i++) {
      if (propagationStopped.get(event)) break;
      var matched = queue[i];
      currentTargets.set(event, matched.node);

      for (var j = 0, len2 = matched.observers.length; j < len2; j++) {
        if (immediatePropagationStopped.get(event)) break;
        matched.observers[j].data.call(matched.node, event);
      }
    }

    currentTargets["delete"](event);
    defineCurrentTarget(event);
  }

  function on(name, selector, fn) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var capture = options.capture ? true : false;
    var doc = options.document || document;
    var events = getEventsStore(capture, doc);
    var selectors = events[name];

    if (!selectors) {
      selectors = new SelectorSet();
      events[name] = selectors;
      doc.addEventListener(name, dispatch, capture);
    }

    selectors.add(selector, fn);
  }
  function off(name, selector, fn) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var capture = options.capture ? true : false;
    var doc = options.document || document;
    var events = getEventsStore(capture, doc);
    var selectors = events[name];
    if (!selectors) return;
    selectors.remove(selector, fn);
    if (selectors.size) return;
    delete events[name];
    doc.removeEventListener(name, dispatch, capture);
  }

  var AppComponent =
  /*#__PURE__*/
  function (_HTMLElement) {
    _inherits(AppComponent, _HTMLElement);

    function AppComponent() {
      var _this;

      _classCallCheck(this, AppComponent);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(AppComponent).call(this));
      _this.connected = false;
      _this.observedAttributes = false;
      _this.data = {};
      _this.callbacks = {
        connect: [],
        attributechange: [],
        disconnect: []
      };
      return _this;
    }

    _createClass(AppComponent, [{
      key: "initTemplate",
      value: function initTemplate(tpl, context) {
        var node = AppComponent.template(tpl).content.cloneNode(true);
        var tplb = stashe(node);
        this.attachShadow({
          mode: 'open'
        });
        this.shadowRoot.appendChild(tplb(context));
        var options = {
          document: this.shadowRoot
        };

        this.addListener = function (args) {
          var fullArgs = args.slice();
          fullArgs.push(options);
          on.apply(null, fullArgs);
        };

        this.removeListener = function (args) {
          var fullArgs = args.slice();
          fullArgs.push(options);
          off.apply(null, fullArgs);
        };
      }
    }, {
      key: "attributeChangedCallback",
      value: function attributeChangedCallback(name, oldValue, newValue) {
        if (!this.connected || newValue === oldValue || newValue === null) {
          return false;
        }

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = this.observedAttributes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var att = _step.value;

            if (att === name) {
              newValue = this.parseAttribute(newValue);
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        this.data[name] = newValue;
        this.runCallbacks("attributechange");
      }
    }, {
      key: "connectedCallback",
      value: function connectedCallback() {
        this.connected = true;

        if (this.observedAttributes) {
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = this.observedAttributes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var att = _step2.value;
              this.data[att] = this.parseAttribute(this.getAttribute(att));
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
                _iterator2["return"]();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
        }

        if (this.eventListeners) {
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = this.eventListeners[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var config = _step3.value;

              if (config && config.length === 3) {
                this.addListener(config);
              }
            }
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
                _iterator3["return"]();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
            }
          }
        }

        this.runCallbacks("connect");
      }
    }, {
      key: "disconnectedCallback",
      value: function disconnectedCallback() {
        this.connected = false;

        if (this.eventListeners) {
          var _iteratorNormalCompletion4 = true;
          var _didIteratorError4 = false;
          var _iteratorError4 = undefined;

          try {
            for (var _iterator4 = this.eventListeners[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
              var config = _step4.value;

              if (config && config.length === 3) {
                this.removeListener(config);
              }
            }
          } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
                _iterator4["return"]();
              }
            } finally {
              if (_didIteratorError4) {
                throw _iteratorError4;
              }
            }
          }
        }

        this.runCallbacks("disconnect");
      }
    }, {
      key: "parseAttribute",
      value: function parseAttribute(str) {
        if (!str) return null;

        try {
          return JSON.parse(str);
        } catch (e) {
          return str;
        }
      }
    }, {
      key: "on",
      value: function on(e, callback) {
        if (this.callbacks[e]) {
          this.callbacks[e].push(callback);
          return true;
        } else {
          console.log("An event with the name of \"".concat(e, "\" is not supported."));
          return false;
        }
      }
    }, {
      key: "runCallbacks",
      value: function runCallbacks(e) {
        if (this.callbacks[e]) {
          var _iteratorNormalCompletion5 = true;
          var _didIteratorError5 = false;
          var _iteratorError5 = undefined;

          try {
            for (var _iterator5 = this.callbacks[e][Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
              var callback = _step5.value;

              if (typeof callback === "function") {
                callback();
              }
            }
          } catch (err) {
            _didIteratorError5 = true;
            _iteratorError5 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
                _iterator5["return"]();
              }
            } finally {
              if (_didIteratorError5) {
                throw _iteratorError5;
              }
            }
          }
        }
      }
    }]);

    return AppComponent;
  }(_wrapNativeSuper(HTMLElement));

  AppComponent.init = function init(that, clazz, tpl) {
    that.observedAttributes = clazz.observedAttributes;
    that.initTemplate(tpl, that.data);
    Object.assign(that, AppComponent.gatherElements(that.shadowRoot, 'data-element'));
  };

  AppComponent.template = function template(src) {
    var template = document.createElement('template');
    template.innerHTML = src;
    return template;
  };

  AppComponent.gatherElements = function gatherElements(doc, attributeName) {
    var result = {};
    var elements = doc.querySelectorAll('[' + attributeName + ']');
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
      for (var _iterator6 = elements[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
        var el = _step6.value;
        var name = '$' + el.getAttribute(attributeName);
        result[name] = el;
      }
    } catch (err) {
      _didIteratorError6 = true;
      _iteratorError6 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion6 && _iterator6["return"] != null) {
          _iterator6["return"]();
        }
      } finally {
        if (_didIteratorError6) {
          throw _iteratorError6;
        }
      }
    }

    return result;
  };

  var tpl = "<style> </style> <div class=\"hostdiv\"> <div><span>hello!</span></div> <div></div> <div>{{ replaceme }}! {{ helpme }}</div> </div> ";

  var TestComponent =
  /*#__PURE__*/
  function (_AppComponent) {
    _inherits(TestComponent, _AppComponent);

    function TestComponent() {
      var _this;

      _classCallCheck(this, TestComponent);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(TestComponent).call(this));
      AppComponent.init(_assertThisInitialized(_this), TestComponent, tpl);
      return _this;
    }

    _createClass(TestComponent, [{
      key: "eventListeners",
      get: function get() {
        // [name, selector, fn]
        return [['click', 'span', function (event) {
          console.log('hey!');
        }]];
      }
    }], [{
      key: "observedAttributes",
      get: function get() {
        return ['helpme', 'replaceme'];
      }
    }]);

    return TestComponent;
  }(AppComponent);
  window.customElements.define('test-component', TestComponent);

}());
