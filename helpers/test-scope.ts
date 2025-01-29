import { type Scope, type Operation, createScope } from "effection";

export interface TestScope {
  scope: Scope;
  parent?: TestScope;
  setup: Array<() => Operation<void>>;
  runTest(op: () => Operation<void>): Promise<void>;
}

export function createTestScope(parent?: TestScope): TestScope {
  let setup: TestScope["setup"] = [];
  let [scope, destroy] = createScope(parent?.scope);
  return {
    scope,
    parent,
    setup,
    runTest(op) {
      return scope.run(function* () {
        let setups = setup;
        for (let current = parent; !!current; current = current.parent) {
          setups = current.setup.concat(setups);
        }
        console.dir({ l: setups.length, parent });
        for (let step of setups) {
          yield* step();
        }
        yield* op();
      });
    },
  };
}

import * as vitest from "vitest";

let currentTestScope = createTestScope();

function describeWithScope(
  name: string | Function,
  factory?: vitest.SuiteFactory
): vitest.SuiteCollector {
  return vitest.describe(name, (...args) => {
    // saves a local reference to the current test scope
    const original = currentTestScope;
    console.dir({ currentTestScope });
    currentTestScope = createTestScope(original);
    try {
      if (factory && typeof factory === "function") {
        factory(...args);
      }
    } finally {
      // restores the original test scope
      currentTestScope = original;
    }
  });
}

describeWithScope.only = vitest.describe.only;
describeWithScope.skip = vitest.describe.skip;
describeWithScope.skipIf = vitest.describe.skipIf;
describeWithScope.runIf = vitest.describe.runIf;

export const describe = <typeof vitest.describe>(<unknown>describeWithScope);

export function beforeEach(op: () => Operation<void>): void {
  currentTestScope.setup.push(op);
}

export function it(
  desc: string,
  op?: () => Operation<void>,
  timeout?: number
): void {
  const scope = currentTestScope;
  console.log({ scope });
  if (op) {
    return vitest.it(desc, async () => scope.runTest(op), timeout);
  } else {
    return vitest.it.todo(desc);
  }
}

it.only = function only(
  desc: string,
  op?: () => Operation<void>,
  timeout?: number
): void {
  const scope = currentTestScope;
  if (op) {
    return vitest.it.only(desc, async () => scope.runTest(op), timeout);
  } else {
    return vitest.it.skip(desc, () => {});
  }
};

export function* captureError<T>(op: Operation<T>): Operation<Error> {
  try {
    yield* op;
    throw new Error("expected operation to throw an error, but it did not!");
  } catch (error) {
    return error;
  }
}
