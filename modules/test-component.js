import { AppComponent } from '../src/app-component.js'
import tpl from './test-component.html'

export class TestComponent extends AppComponent {
  constructor() {
    super();
    AppComponent.init(this, TestComponent, tpl);
  }

  get eventListeners() {
    // [name, selector, fn]
    return [
      ['click', 'span', function (event) {
        console.log('hey!')
      }]
    ];
  }

  static get observedAttributes() {
    return ['helpme', 'replaceme', 'dereference'];
  }
}

window.customElements.define('test-component', TestComponent);
