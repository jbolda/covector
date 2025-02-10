import { type Operation } from "effection";
import { createTestAdapter } from "./test-adapter";

import * as vitest from "vitest";

function describeWithScope(
  name: string | Function,
  factory?: vitest.SuiteFactory
): vitest.SuiteCollector {
  return vitest.describe(name, (...args) => {
    vitest.beforeAll((suite: any) => {
      let parent = suite.suite?.adapter;
      suite.adapter = createTestAdapter({ name: String(name), parent });
    });

    vitest.afterAll(async (suite: any) => {
      await suite.adapter.destroy();
    });

    if (factory && typeof factory === "function") {
      factory(...args);
    }
  });
}

describeWithScope.only = function describeWithScope(
  name: string | Function,
  factory?: vitest.SuiteFactory
): vitest.SuiteCollector {
  return vitest.describe.only(name, (...args) => {
    vitest.beforeAll((suite: any) => {
      let parent = suite.suite?.adapter;
      suite.adapter = createTestAdapter({ name: String(name), parent });
    });

    vitest.afterAll(async (suite: any) => {
      await suite.adapter.destroy();
    });

    if (factory && typeof factory === "function") {
      factory(...args);
    }
  });
};
describeWithScope.skip = vitest.describe.skip;
describeWithScope.skipIf = (condition: any) =>
  condition ? describeWithScope.skip : describeWithScope;
describeWithScope.runIf = (condition: any) =>
  condition ? describeWithScope : describeWithScope.skip;

export const describe = <typeof vitest.describe>(<unknown>describeWithScope);

export function beforeEach(op: () => Operation<void>): void {
  vitest.beforeEach(async (context: any) => {
    context.task.suite.adapter.addSetup(op);
  });
}

export function it(
  desc: string,
  op?: () => Operation<void>,
  timeout?: number
): void {
  if (op) {
    return vitest.it(
      desc,
      async (context: any) => {
        context.task.suite.adapter.runTest(op);
      },
      timeout
    );
  } else {
    return vitest.it.todo(desc);
  }
}

it.only = function only(
  desc: string,
  op?: () => Operation<void>,
  timeout?: number
): void {
  if (op) {
    return vitest.it.only(
      desc,
      async (context: any) => {
        context.task.suite.adapter.runTest(op);
      },
      timeout
    );
  } else {
    return vitest.it.skip(desc, () => {});
  }
};

it.skip = function skip(
  desc: string,
  op?: () => Operation<void>,
  timeout?: number
): void {
  return vitest.it.skip(desc, () => {});
};

export function* captureError<T>(op: Operation<T>): Operation<Error> {
  try {
    yield* op;
    throw new Error("expected operation to throw an error, but it did not!");
  } catch (error) {
    return error;
  }
}
