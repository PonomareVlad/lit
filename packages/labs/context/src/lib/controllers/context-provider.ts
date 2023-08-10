/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ContextRequestEvent} from '../context-request-event.js';
import {Context, ContextType} from '../create-context.js';
import {ValueNotifier} from '../value-notifier.js';
import {ReactiveController, ReactiveElement} from 'lit';

// In the Node build, this import will be injected by Rollup:
// import {Event} from '@lit-labs/ssr-dom-shim';

const NODE_MODE = false;
const global = NODE_MODE ? globalThis : window;

if (NODE_MODE) {
  global.Event ??= Event;
}

declare global {
  interface HTMLElementEventMap {
    /**
     * A 'context-provider' event can be emitted by any element which hosts
     * a context provider to indicate it is available for use.
     */
    'context-provider': ContextProviderEvent<Context<unknown, unknown>>;
  }
}

export class ContextProviderEvent<
  C extends Context<unknown, unknown>
> extends Event {
  readonly context: C;

  /**
   *
   * @param context the context which this provider can provide
   */
  constructor(context: C) {
    super('context-provider', {bubbles: true, composed: true});
    this.context = context;
  }
}

export interface Options<C extends Context<unknown, unknown>> {
  context: C;
  initialValue?: ContextType<C>;
}

/**
 * A ReactiveController which adds context provider behavior to a
 * custom element.
 *
 * This controller simply listens to the `context-request` event when
 * the host is connected to the DOM and registers the received callbacks
 * against its observable Context implementation.
 */
export class ContextProvider<T extends Context<unknown, unknown>>
  extends ValueNotifier<ContextType<T>>
  implements ReactiveController
{
  protected readonly host: ReactiveElement;
  private readonly context: T;

  constructor(host: ReactiveElement, options: Options<T>);
  /** @deprecated Use new ContextProvider(host, options) */
  constructor(host: ReactiveElement, context: T, initialValue?: ContextType<T>);
  constructor(
    host: ReactiveElement,
    contextOrOptions: T | Options<T>,
    initialValue?: ContextType<T>
  ) {
    super(
      (contextOrOptions as Options<T>).context !== undefined
        ? (contextOrOptions as Options<T>).initialValue
        : initialValue
    );
    this.host = host;
    if ((contextOrOptions as Options<T>).context !== undefined) {
      this.context = (contextOrOptions as Options<T>).context;
    } else {
      this.context = contextOrOptions as T;
    }
    this.attachListeners();
    this.host.addController(this);
  }

  onContextRequest = (
    ev: ContextRequestEvent<Context<unknown, unknown>>
  ): void => {
    // Only call the callback if the context matches.
    // Also, in case an element is a consumer AND a provider
    // of the same context, we want to avoid the element to self-register.
    // The check on composedPath (as opposed to ev.target) is to cover cases
    // where the consumer is in the shadowDom of the provider (in which case,
    // event.target === this.host because of event retargeting).
    const consumerHost = ev.composedPath()[0] as Element;
    if (ev.context !== this.context || consumerHost === this.host) {
      return;
    }
    ev.stopPropagation();
    this.addCallback(ev.callback, consumerHost, ev.subscribe);
  };

  /**
   * When we get a provider request event, that means a child of this element
   * has just woken up. If it's a provider of our context, then we may need to
   * re-parent our subscriptions, because is a more specific provider than us
   * for its subtree.
   */
  onProviderRequest = (
    ev: ContextProviderEvent<Context<unknown, unknown>>
  ): void => {
    // Ignore events when the context doesn't match.
    // Also, in case an element is a consumer AND a provider
    // of the same context it shouldn't provide to itself.
    // We use composedPath (as opposed to ev.target) to cover cases
    // where the consumer is in the shadowDom of the provider (in which case,
    // event.target === this.host because of event retargeting).
    const childProviderHost = ev.composedPath()[0] as Element;
    if (ev.context !== this.context || childProviderHost === this.host) {
      return;
    }
    // Re-parent all of our subscriptions in case this new child provider
    // should take them over.
    for (const [callback, {consumerHost}] of this.subscriptions) {
      consumerHost.dispatchEvent(
        new ContextRequestEvent(this.context, callback, true)
      );
    }
    ev.stopPropagation();
  };

  private attachListeners() {
    this.host.addEventListener('context-request', this.onContextRequest);
    this.host.addEventListener('context-provider', this.onProviderRequest);
  }

  hostConnected(): void {
    // emit an event to signal a provider is available for this context
    this.host.dispatchEvent(new ContextProviderEvent(this.context));
  }
}
