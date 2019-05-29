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
const trees = new WeakMap();

function escape(text) {
  const node = document.createElement('p');
  node.textContent = text;
  return node.innerHTML;
}

function resolve(obj, prop) {
  if (typeof obj !== 'undefined' && null !== obj) {
    const value = obj[prop];
    if (typeof value === 'function') {
      return value.call();
    }
    return value;
  }
}

function pluck(context, key) {
  const properties = key.split('.');
  const value = properties.reduce(resolve, context) || '';
  return escape(value);
}

function bindings(node) {
  const results = [];
  for (const child of node.childNodes) {
    switch (child.nodeType) {
      case 1:
        if (child.nodeName !== 'TEMPLATE') {
          results.push(...bindAttributes(child));
          results.push(...bindings(child));
        }
        break;
      case 3:
        results.push(...bindText(child));
        break;
    }
  }
  return results;
}

function notifyTree(node) {
  for (const fn of node.observers) fn();
  for (const name in node.children) {
    notifyTree(node.children[name]);
  }
}

function appendChild(parent, name) {
  let child = parent.children[name];
  if (!child) {
    child = {name: name, children: {}, observers: []};
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
  const fn = compose(
    visitor,
    appendChild
  );
  return key.split('.').reduce(fn, node);
}

// Finds or builds the observer tree for a context object.
function tree(context) {
  let root = trees.get(context);
  if (!root) {
    root = {children: {}, observers: []};
    trees.set(context, root);
  }
  return root;
}

function bind(fragment, context) {
  const root = tree(context);
  for (const {target, key, update} of bindings(fragment)) {
    const observer = update.bind(target, context, key);
    const leaf = descend(root, key, proxyOnce(context));
    leaf.observers.push(observer);
    update.call(target, context, key);
  }
  return fragment;
}

// Returns a visitor function to descend through a context object's
// attributes, proxying assignment operators to notify the observer
// tree of changes.
function proxyOnce(context) {
  let current = context;
  return function visit(node) {
    if (!node.proxied) {
      proxy(current, node.name, notifyTree.bind(null, node));
      node.proxied = true;
    }
    if (!current[node.name]) {
      current[node.name] = {};
    }
    current = current[node.name];
    return node;
  };
}

function proxy(target, property, after) {
  let current = target[property];
  Object.defineProperty(target, property, {
    get: () => current,
    set: value => {
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
  return text.split(/({{.+?}})/).map(token => {
    const stache = token.startsWith('{{') && token.endsWith('}}');
    return stache
      ? {type: 1, value: token.slice(2, -2).trim()}
      : {type: 0, value: token};
  });
}

function bindAttributes(node) {
  const bindings = [];
  for (const attr of Array.from(node.attributes)) {
    for (const token of parse(attr.value)) {
      if (token.type === 1) {
        bindings.push({
          target: attr,
          key: token.value,
          update: updateAttribute
        });
      }
    }
  }
  return bindings;
}

function bindText(node) {
  const tokens = parse(node.textContent);
  if (tokens.length === 1 && tokens[0].type === 0) {
    return [];
  }

  const bindings = [];
  for (const token of tokens) {
    const text = document.createTextNode(token.value);
    node.parentNode.insertBefore(text, node);
    if (token.type === 1) {
      bindings.push({
        target: text,
        key: token.value,
        update: updateText
      });
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
var Map;
if (typeof window.Map === 'function') {
  Map = window.Map;
} else {
  Map = (function() {
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
      index.map = new Map();
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
const bubbleEvents = new WeakMap();
const captureEvents = new WeakMap();
const propagationStopped = new WeakMap();
const immediatePropagationStopped = new WeakMap();
const currentTargets = new WeakMap();
const currentTargetDesc = Object.getOwnPropertyDescriptor(
  Event.prototype,
  'currentTarget'
);

function before(subject, verb, fn) {
  const source = subject[verb];
  subject[verb] = function() {
    fn.apply(subject, arguments);
    return source.apply(subject, arguments);
  };
  return subject;
}

function matches$1(selectors, target, reverse) {
  const queue = [];
  let node = target;

  do {
    if (node.nodeType !== 1) break;
    const matches = selectors.matches(node);
    if (matches.length) {
      const matched = {node: node, observers: matches};
      if (reverse) {
        queue.unshift(matched);
      } else {
        queue.push(matched);
      }
    }
  } while ((node = node.parentElement));

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
  let result = {};
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
  const doc = event.currentTarget;
  const events = getEventsStore(event.eventPhase === 1, doc);

  const selectors = events[event.type];
  if (!selectors) return;

  const queue = matches$1(selectors, event.target, event.eventPhase === 1);
  if (!queue.length) return;

  before(event, 'stopPropagation', trackPropagation);
  before(event, 'stopImmediatePropagation', trackImmediate);
  defineCurrentTarget(event, getCurrentTarget);

  for (let i = 0, len1 = queue.length; i < len1; i++) {
    if (propagationStopped.get(event)) break;
    const matched = queue[i];
    currentTargets.set(event, matched.node);

    for (let j = 0, len2 = matched.observers.length; j < len2; j++) {
      if (immediatePropagationStopped.get(event)) break;
      matched.observers[j].data.call(matched.node, event);
    }
  }

  currentTargets.delete(event);
  defineCurrentTarget(event);
}

function on(name, selector, fn, options = {}) {
  const capture = options.capture ? true : false;
  const doc = options.document || document;
  const events = getEventsStore(capture, doc);

  let selectors = events[name];
  if (!selectors) {
    selectors = new SelectorSet();
    events[name] = selectors;
    doc.addEventListener(name, dispatch, capture);
  }
  selectors.add(selector, fn);
}

function off(name, selector, fn, options = {}) {
  const capture = options.capture ? true : false;
  const doc = options.document || document;
  const events = getEventsStore(capture, doc);

  const selectors = events[name];
  if (!selectors) return;
  selectors.remove(selector, fn);

  if (selectors.size) return;
  delete events[name];
  doc.removeEventListener(name, dispatch, capture);
}

class AppComponent extends HTMLElement {
  constructor() {
    super();

    this.ranConnected = false;
    this.observedAttributes = {};
    this.data = new Proxy({}, {
        set: (function(obj, prop, newval) {
          obj[prop] = newval;
          if (this.ranConnected
            && this.observedAttributes[prop]) {
            for (let f of this.observedAttributes[prop]) {
              f(prop, newval);
            }
          }
          return true;
        }).bind(this)
    });

    this.callbacks = {
      connect: [],
      attributechange: [],
      disconnect: []
    };
  }

  initTemplate(tpl, context) {
    let node = AppComponent.template(tpl).content.cloneNode(true);
    let tplb = stashe(node);

    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(tplb(context));

    const options = {document: this.shadowRoot};
    this.addListener = (args) => {
      const fullArgs = args.slice();
      fullArgs.push(options);
      on.apply(null, fullArgs);
    };
    this.removeListener = (args) => {
      const fullArgs = args.slice();
      fullArgs.push(options);
      off.apply(null, fullArgs);
    };
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.ranConnected || newValue === oldValue || newValue === null) {
      return false;
    }
    for (const [key] of Object.entries(this.observedAttributes)) {
      if (key === name) {
        newValue = this.parseAttribute(newValue);
      }
    }
    if (this.data[name] !== newValue) {
      this.data[name] = newValue;
    }
    this.runCallbacks("attributechange");
  }

  connectedCallback() {
    if (!this.isConnected) return;
    this.ranConnected = true;
    for (const [key] of Object.entries(this.observedAttributes)) {
      this.data[key] = this.parseAttribute(
        this.getAttribute(key)
      );
    }

    if (this.eventListeners) {
      for (let config of this.eventListeners) {
        if (config && config.length === 3) {
          this.addListener(config);
        }
      }
    }
    this.runCallbacks("connect");
  }

  disconnectedCallback() {
    this.ranConnected = false;
    if (this.eventListeners) {
      for (let config of this.eventListeners) {
        if (config && config.length === 3) {
          this.removeListener(config);
        }
      }
    }

    this.runCallbacks("disconnect");
  }

  serializeAttribute(value) {
    let result = value;
    if (!value) return null;

    if (typeof value === 'string') {
      result = value;
    } else {
      result = JSON.stringify(value);
    }
    return result;
  }

  parseAttribute(str) {
    if (!str) return null;

    try {
      return JSON.parse(str);
    } catch (e) {
      return str;
    }
  }

  on(e, callback) {
    if (this.callbacks[e]) {
      this.callbacks[e].push(callback);
      return true;
    } else {
      console.log(`An event with the name of "${e}" is not supported.`);
      return false;
    }
  }

  runCallbacks(e) {
    if (this.callbacks[e]) {
      for (let callback of this.callbacks[e]) {
        if (typeof callback === "function") {
          callback();
        }
      }
    }
  }

}

AppComponent.init = function init(that, clazz, tpl) {
  for (let e of clazz.observedAttributes) {
    that.observedAttributes[e] = [];
  }
  that.initTemplate(tpl, that.data);
  Object.assign(that, AppComponent.gatherElements(that.shadowRoot, 'data-element'));
};

AppComponent.template = function template(src) {
  const template = (document.createElement('template'));
  template.innerHTML = src;
  return template;
};

AppComponent.gatherElements = function gatherElements(doc, attributeName) {
  let result = {};
  let elements = doc.querySelectorAll('[' + attributeName + ']');
  for (let el of elements) {
    let name = '$' + el.getAttribute(attributeName);
    result[name] = el;
  }
  return result;
};

AppComponent.stashe = stashe;

var tpl = "<style> </style> <div class=\"hostdiv\"> <div><span>hello!</span></div> <div></div> <div>{{ replaceme }}! {{ helpme }}</div> <div>{{ dereference.me }}</div> </div> ";

class TestComponent extends AppComponent {
  constructor() {
    super();
    AppComponent.init(this, TestComponent, tpl);
  }

  get eventListeners() {
    // [name, selector, fn]
    return [
      ['click', 'span', function (event) {
        console.log('hey!');
      }]
    ];
  }

  static get observedAttributes() {
    return ['helpme', 'replaceme', 'dereference'];
  }
}

window.customElements.define('test-component', TestComponent);

var tpl$1 = "<template data-element=\"choiceTpl\"> <div class=\"choice\"><input type=\"radio\" name=\"{{name}}\" id=\"{{id}}\" value=\"{{choice}}\"><label for=\"{{id}}\">{{choice}}</label></div> </template> ";

class InRadio extends AppComponent {
  constructor() {
    super();
    AppComponent.init(this, InRadio, tpl$1);

    this.observedAttributes['choices'].push(this.renderChoices.bind(this));
    this.observedAttributes['choice'].push((function(prop, val) {
      this.setAttribute(prop, this.serializeAttribute(val));
      const option = this.shadowRoot.querySelector('[value='+this.data.choice+']');
      if (option) {
        option.checked = true;
      }
    }).bind(this));
  }

  get eventListeners() {
    const thing = (function(event) {
      const selected = this.shadowRoot.querySelector(':checked');
      this.data.choice = selected.getAttribute('value');
    }).bind(this);
    return [['click', 'input', thing]];
  }

  renderChoices() {
    const container = this.shadowRoot,
      template = this.$choiceTpl,
      name = this.data['in-name'],
      choices = this.data.choices;

    if (!container || !template || !name || !choices) {
      return;
    }

    container.querySelectorAll('.choice').forEach((el) => {el.remove();});

    // https://gist.github.com/gordonbrander/2230317
    const genId = function() {
      return '_' + Math.random().toString(36).substr(2, 9);
    };

    let checked = false;
    for (let choice of choices) {
      let tplb = AppComponent.stashe(template.content.cloneNode(true));
      let context = {};
      context.id = genId();
      context.name = name;
      context.choice = choice;
      let result = tplb(context);
      let $input = result.querySelector('input');
      if (!checked) {
        $input.checked = true;
        checked = true;
        this.data.choice = choice;
      }
      container.appendChild(result);
    }
  }

  static get observedAttributes() {
    return ['in-name', 'choices', 'choice'];
  }
}

window.customElements.define('in-radio', InRadio);
