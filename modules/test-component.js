import { AppComponent } from '../src/app-component.js'
import tpl from './test-component.html'

export class TestComponent extends AppComponent {
  constructor() {
    super();
    AppComponent.init(this, TestComponent, tpl);
  }

  static get observedAttributes() {
    return ['helpme', 'replaceme'];
  }
}

window.customElements.define('test-component', TestComponent);
