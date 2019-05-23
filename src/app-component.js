import { stashe } from './stashe-bind.js'
import { on, off } from './delegated-events.js'
export class AppComponent extends HTMLElement {
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

    if (this.observedAttributes) {
      for (let att of this.observedAttributes) {
        this.data[att] = this.parseAttribute(
          this.getAttribute(att)
        );
      }
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
    this.connected = false;

    if (this.eventListeners) {
      for (let config of this.eventListeners) {
        if (config && config.length === 3) {
          this.removeListener(config);
        }
      }
    }

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
}
