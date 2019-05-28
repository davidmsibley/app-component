import { stashe } from './stashe-bind.js'
import { on, off } from './delegated-events.js'
export class AppComponent extends HTMLElement {
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
    this.ranConnected = false
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
}
