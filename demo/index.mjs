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
  if (typeof obj !== 'undefined') {
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
        results.push(...bindAttributes(child));
        results.push(...bindings(child));
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

class AppComponent extends HTMLElement {
  constructor() {
    super();

    this.connected = false;
    this.observedAttributes = false;
    this.data = {};

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
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.connected || newValue === oldValue || newValue === null) {
      return false;
    }

    for (let att of this.observedAttributes) {
      if (att === name) {
        newValue = this.parseAttribute(newValue);
      }
    }
    this.data[name] = newValue;
    this.runCallbacks("attributechange");
  }

  connectedCallback() {
    this.connected = true;

    if (this.observedAttributes !== false && typeof this.observedAttributes === "object") {
      for (let att of this.observedAttributes) {
        this.data[att] = this.parseAttribute(
          this.getAttribute(att)
        );
      }
    }

    this.runCallbacks("connect");
  }

  disconnectedCallback() {
    this.connected = false;

    this.runCallbacks("disconnect");
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
  that.observedAttributes = clazz.observedAttributes;
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

var tpl = "<style> </style> <div class=\"hostdiv\"> <div>hello!</div> <div></div> <div>{{ replaceme }}! {{ helpme }}</div> </div> ";

class TestComponent extends AppComponent {
  constructor() {
    super();
    AppComponent.init(this, TestComponent, tpl);
  }

  static get observedAttributes() {
    return ['helpme', 'replaceme'];
  }
}

window.customElements.define('test-component', TestComponent);
