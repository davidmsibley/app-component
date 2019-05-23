// Adapted from https://github.com/dgraham/delegated-events
// Thanks to Yuyz0112 https://github.com/dgraham/delegated-events/pull/20
/*
  Copyright (c) 2015-2017 David Graham

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

import SelectorSet from 'selector-set';

const eventsStore = [];
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

function matches(selectors, target, reverse) {
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
      eventsStore.push(result);
    }
    result = captureEvents.get(doc);
  } else {
    if (!bubbleEvents.has(doc)) {
      bubbleEvents.set(doc, result);
      eventsStore.push(result);
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

  const queue = matches(selectors, event.target, event.eventPhase === 1);
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

export function on(name, selector, fn, options = {}) {
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

export function off(name, selector, fn, options = {}) {
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

export function fire(target, name, detail) {
  return target.dispatchEvent(
    new CustomEvent(name, {
      bubbles: true,
      cancelable: true,
      detail: detail
    })
  );
}
