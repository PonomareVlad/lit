/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Readable} from 'stream';

export type MaybeAsyncIterable<T> = Iterable<
  T | Promise<MaybeAsyncIterable<T>> | AsyncIterable<T>
>;

async function* withAsync(
  iterable: MaybeAsyncIterable<string>
): AsyncIterable<string> {
  if (Symbol.asyncIterator in iterable)
    for await (const value of iterable) yield value as string;
  else
    for (const value of iterable as MaybeAsyncIterable<string>) {
      if (
        typeof (value as Promise<MaybeAsyncIterable<string>>)?.then ===
        'function'
      ) {
        yield* withAsync(await (value as Promise<MaybeAsyncIterable<string>>));
      } else {
        yield value as string;
      }
    }
}

export const readableFrom = (
  ssrResult: MaybeAsyncIterable<string>,
  handleAsync = false
) => {
  return Readable.from(handleAsync ? withAsync(ssrResult) : ssrResult);
};
