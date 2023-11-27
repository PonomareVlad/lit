/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ElementRenderer} from './element-renderer.js';
import {LitElement, CSSResult, ReactiveElement} from 'lit';
import {_$LE} from 'lit-element/private-ssr-support.js';
import {
  ariaMixinAttributes,
  HYDRATE_INTERNALS_ATTR_PREFIX,
} from '@lit-labs/ssr-dom-shim';
import {renderValue} from './render-value.js';
import type {RenderInfo} from './render-value.js';
import type {RenderResult} from './render-result.js';
import type {ServerController} from '@lit-labs/ssr-client/controllers/server-controller.js';

export type Constructor<T> = {new (): T};

const {attributeToProperty, changedProperties, getControllers} = _$LE;

/**
 * ElementRenderer implementation for LitElements
 */
export class LitElementRenderer extends ElementRenderer {
  override element: LitElement;

  static override matchesClass(ctor: typeof HTMLElement) {
    // This property needs to remain unminified.
    return (ctor as unknown as typeof LitElement)['_$litElement$'];
  }

  constructor(tagName: string, renderInfo: RenderInfo) {
    super(tagName, renderInfo);
    this.element = new (customElements.get(this.tagName)!)() as LitElement;

    // Reflect internals AOM attributes back to the DOM prior to hydration to
    // ensure search bots can accurately parse element semantics prior to
    // hydration. This is called whenever an instance of ElementInternals is
    // created on an element to wire up the getters/setters for the ARIAMixin
    // properties.
    const internals = (
      this.element as object as {__internals: ElementInternals}
    ).__internals;
    if (internals) {
      for (const [ariaProp, ariaAttribute] of Object.entries(
        ariaMixinAttributes
      )) {
        const value = internals[ariaProp as keyof ARIAMixin];
        if (value && !this.element.hasAttribute(ariaAttribute)) {
          this.element.setAttribute(ariaAttribute, value);
          this.element.setAttribute(
            `${HYDRATE_INTERNALS_ATTR_PREFIX}${ariaAttribute}`,
            value
          );
        }
      }
    }

    // Set the event target parent so events can bubble
    // TODO (justinfagnani): make this the correct composed path
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.element as any).__eventTargetParent =
      renderInfo.customElementInstanceStack.at(-1)?.element;
  }

  override get shadowRootOptions() {
    return (
      (this.element.constructor as typeof LitElement).shadowRootOptions ??
      super.shadowRootOptions
    );
  }

  override connectedCallback() {
    // TODO (justinfagnani): This assumes that connectedCallback() doesn't call
    // any DOM APIs _except_ addEventListener() - which is obviously a big and
    // bad assumption. We probably need a new SSR-compatible connected callback.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.element as any)?.serverCallback();

    // Call LitElement's `willUpdate` method.
    // Note, this method is required not to use DOM APIs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.element as any)?.willUpdate(changedProperties(this.element as any));
    // Reflect properties to attributes by calling into ReactiveElement's
    // update, which _only_ reflects attributes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ReactiveElement.prototype as any).update.call(this.element);
  }

  override attributeChangedCallback(
    name: string,
    _old: string | null,
    value: string | null
  ) {
    attributeToProperty(this.element as LitElement, name, value);
  }

  override *renderShadow(renderInfo: RenderInfo): RenderResult {
    const serverControllerUpdatePromises = Array.from<
      Partial<ServerController>
    >(getControllers(this.element) ?? [])
      .map((c: Partial<ServerController>) => c.serverUpdateComplete)
      .filter((p: Promise<unknown> | undefined) => !!p);
    if (serverControllerUpdatePromises?.length > 0) {
      const continuation = Promise.all(serverControllerUpdatePromises).then(
        (_) => this._renderShadowContents(renderInfo)
      );
      yield continuation;
    } else {
      yield* this._renderShadowContents(renderInfo);
    }
  }

  private *_renderShadowContents(renderInfo: RenderInfo): RenderResult {
    // Render styles.
    const styles = (this.element.constructor as typeof LitElement)
      .elementStyles;
    if (styles !== undefined && styles.length > 0) {
      yield '<style>';
      for (const style of styles) {
        yield (style as CSSResult).cssText;
      }
      yield '</style>';
    }
    // Render template
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yield* renderValue((this.element as any).render(), renderInfo);
  }

  override *renderLight(renderInfo: RenderInfo): RenderResult {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (this.element as any)?.renderLight();
    if (value) {
      yield* renderValue(value, renderInfo);
    } else {
      yield '';
    }
  }
}
