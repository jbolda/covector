import { type Operation, run } from "effection";

export interface TestScope {
  addSetup(op: () => Operation<void>): void;
  runTest(op: () => Operation<void>): Promise<void>;
}

export function createTestScope(): TestScope {
  let setup: (() => Operation<void>)[] = [];
  return {
    addSetup(op) {
      setup.push(op);
    },
    runTest(op) {
      return run(function* () {
        for (let step of setup) {
          yield step();
        }
        yield op();
      });
    },
  };
}

import * as vitest from "vitest";

let scope: TestScope | undefined;

function describeWithScope(
  name: string | Function,
  factory?: vitest.SuiteFactory<{}>
): vitest.SuiteCollector<{}> {
  return vitest.describe(name, () => {
    vitest.beforeEach(() => {
      if (!scope) {
        scope = createTestScope();
      }
    });
    if (factory && typeof factory === "function") {
      (<Function>factory)();
    }
  });
}

describeWithScope.only = vitest.describe.only;
describeWithScope.skip = vitest.describe.skip;
describeWithScope.skipIf = vitest.describe.skipIf;

export const describe = <typeof vitest.describe>(<unknown>describeWithScope);

export function beforeEach(op: () => Operation<void>): void {
  vitest.beforeEach(() => scope!.addSetup(op));
}

export function it(
  desc: string,
  op?: () => Operation<void>,
  timeout?: number
): void {
  if (op) {
    return vitest.it(desc, async () => scope?.runTest(op), timeout);
  } else {
    return vitest.it.skip(desc, () => {});
  }
}

it.only = function only(
  desc: string,
  op?: () => Operation<void>,
  timeout?: number
): void {
  if (op) {
    return vitest.it.only(desc, async () => scope!.runTest(op), timeout);
  } else {
    return vitest.it.skip(desc, () => {});
  }
};

it.skipIf = function skipIf(condition: boolean) {
  return function (
    desc: string,
    op?: () => Operation<void>,
    timeout?: number
  ): void {
    if (condition) {
      return vitest.it.skip(desc, () => {});
    }
    if (op) {
      return vitest.it(desc, async () => scope?.runTest(op), timeout);
    } else {
      return vitest.it.skip(desc, () => {});
    }
  };
};

export function captureError<T>(op: Operation<T>): Operation<T | Error> {
  return function* () {
    try {
      yield op;
    } catch (error) {
      return error;
    }
    throw new Error("expected operation to throw an error, but it did not!");
  };
}
