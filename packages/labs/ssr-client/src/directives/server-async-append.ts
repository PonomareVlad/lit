/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {directive} from 'lit/directive.js';
import {getDirectiveClass} from 'lit/directive-helpers.js';
import {AsyncAppendDirective} from 'lit/directives/async-append.js';

class ServerAsyncAppendDirective extends AsyncAppendDirective {
  static $litServerAsyncAppend = true;
}

/**
 */
export const serverAsyncAppend = directive(ServerAsyncAppendDirective);

export const isServerAsyncAppendDirective = (value: unknown): boolean =>
  (getDirectiveClass(value) as typeof ServerAsyncAppendDirective)
    ?.$litServerAsyncAppend;
