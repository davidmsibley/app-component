import { AppComponent } from '../src/app-component.js';
import tpl from './in-radio.html';

export class InRadio extends AppComponent {
  constructor() {
    super();
    AppComponent.init(this, InRadio, tpl);

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

    container.querySelectorAll('.choice').forEach((el) => {el.remove()})

    // https://gist.github.com/gordonbrander/2230317
    const genId = function() {
      return '_' + Math.random().toString(36).substr(2, 9);
    }

    let checked = false;
    for (let choice of choices) {
      let result = template.content.cloneNode(true);
      let id = genId();
      let $input = result.querySelector('input');
      let $label = result.querySelector('label');
      $input.setAttribute('name', name);
      $input.setAttribute('id', id);
      $input.setAttribute('value', choice);
      $label.setAttribute('for', id);
      $label.textContent=choice;
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
