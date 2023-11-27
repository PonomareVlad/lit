/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {litProdConfig} from '../../rollup-common.js';
import {createRequire} from 'module';

export default litProdConfig({
  packageName: createRequire(import.meta.url)('./package.json').name,
  includeNodeBuild: true,
  entryPoints: ['index'],
  external: [
    '@lit/reactive-element',
    '@lit/reactive-element/decorators/base.js',
    '@lit-labs/ssr-dom-shim',
    'lit',
    'lit/directive.js',
  ],
});
