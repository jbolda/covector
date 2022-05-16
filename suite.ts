/* eslint-disable @typescript-eslint/no-non-null-assertion,@typescript-eslint/no-explicit-any */
import {
  Effection,
  Resource,
  Task,
  sleep,
  Operation,
  race,
  run,
} from "effection";

import * as vitestGlobals from "vitest";
import type { TestFunction, RuntimeContext, TestContext } from "vitest";
import { assert } from "assert-ts";

export interface ItFn {
  (title: string, fn: TestFunction, timeout?: number): void;
}

export interface It extends ItFn {
  only: ItFn;
  skip: ItFn;
  eventually: ItFn;
  todo(title: string): void;
}

const scopes = {} as {
  all: Task | undefined;
  each: Task | undefined;
};

async function withinScope(
  name: keyof typeof scopes,
  fn: (task: Task) => Promise<void>
) {
  let scope = scopes[name];
  assert(!!scope, `critical: test scope '${name}' was not initialized`);
  if (scope.state === "errored" || scope.state === "erroring") {
    await scope;
  }
  await fn(scope);
  if (scope.state === "errored" || scope.state === "erroring") {
    await scope;
  }
}

function runInEachScope(fn: TestFunction, name: string): TestFunction {
  return async function (this: TestContext | undefined) {
    await withinScope("all", async () => {
      await withinScope("each", async (each) => {
        await each
          .run({
            name,
            init: fn.bind(this ?? {}),
          })
          .catchHalt();
      });
    });
  };
}

function runInAllScope(fn: TestFunction, name: string): TestFunction {
  return async function (this: RuntimeContext | undefined) {
    await withinScope("all", async (all) => {
      await all
        .run({
          name,
          init: fn.bind(this ?? {}),
        })
        .catchHalt();
    });
  };
}

vitestGlobals.beforeAll(async () => {
  await Effection.reset();
  scopes.all = run(undefined, { labels: { name: "allScope" } });
});

vitestGlobals.afterAll(async () => {
  scopes.all = undefined;
  await Effection.halt();
});

vitestGlobals.beforeEach(async () => {
  scopes.each = run(undefined, { labels: { name: "eachScope" } });
});

vitestGlobals.afterEach(async () => {
  let each = scopes.each;
  if (!!each) {
    each.halt();
    await each.catchHalt();
    scopes.each = undefined;
  }
});

export function beforeAll(fn: TestFunction, timeout?: number): void {
  // tserror: Type 'Suite' is missing the following properties from type 'TestContext': meta, expect
  return vitestGlobals.beforeAll(runInAllScope(fn, "beforeAll"), timeout);
}

export function beforeEach(fn: TestFunction, timeout?: number): void {
  return vitestGlobals.beforeEach(runInEachScope(fn, "beforeEach"), timeout);
}

export const describe = vitestGlobals.describe;

export const it: It = Object.assign(
  function it(name: string, fn: TestFunction, timeout?: number) {
    return vitestGlobals.it(
      name,
      runInEachScope(fn, `it(${JSON.stringify(name)})`),
      timeout
    );
  },
  {
    only(name: string, fn: TestFunction, timeout?: number): void {
      return vitestGlobals.it.only(
        name,
        runInEachScope(fn, `it(${JSON.stringify(name)})`),
        timeout
      );
    },
    skip(name: string, fn: TestFunction, timeout?: number): void {
      return vitestGlobals.it.skip(
        name,
        runInEachScope(fn, `it(${JSON.stringify(name)})`),
        timeout
      );
    },
    todo(name: string): void {
      return vitestGlobals.it.todo(name);
    },
    eventually(name: string, fn: TestFunction, testTimeout?: number) {
      let limit = testTimeout ?? 10000; //getState().testTimeout;

      return it(
        name,
        // tserror: Argument of type '(scope: any, current: any) =>
        // Generator<Operation<void>, void, unknown>'
        // is not assignable to parameter of type 'TestFunction<{}>'.
        function* (scope, current) {
          let operation = fn.bind(this) as (
            scope: Task,
            current: Task
          ) => Operation<void>;
          let error = new Error(
            `operation never succeeded within the ${limit}ms limit`
          );
          function* trial(): Operation<void> {
            while (true) {
              try {
                yield operation(scope, current);
                break;
              } catch (e) {
                error = e as Error;
                yield sleep(1);
              }
            }
          }
          function* timeout() {
            yield sleep(limit);
            throw error;
          }
          yield race([trial, timeout]);
        },
        limit * 3
      );
    },
  }
);

export function captureError(
  op: Operation<any>
): Operation<any> | Operation<Error> {
  return function* () {
    try {
      yield op;
    } catch (error) {
      return error;
    }
    throw new Error("expected operation to throw an error, but it did not!");
  };
}
