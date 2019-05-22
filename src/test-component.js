import { AppComponent } from '../app-component.js'
import tpl from './test-component.html'

export class TestComponent extends AppComponent {
  constructor() {
    super();
    this.observedAttributes = TestComponent.observedAttributes;
    this.initTemplate(tpl, this.data);
  }

  static get observedAttributes() {
    return ['helpme', 'replaceme'];
  }
}

window.customElements.define('test-component', TestComponent);
