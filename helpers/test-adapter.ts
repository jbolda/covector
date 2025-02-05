import type { Future, Operation, Scope } from "effection";
import { createScope } from "effection";

export interface TestOp {
  (): Operation<void>;
}

export interface TestAdapter {
  readonly parent?: TestAdapter;
  readonly name: string;
  readonly fullname: string;
  readonly scope: Scope;
  readonly lineage: Array<TestAdapter>;
  readonly setups: TestOp[];
  addSetup(op: TestOp): void;
  runTest(body: TestOp): Future<void>;
  destroy(): Future<void>;
}

export interface TestAdapterOptions {
  name?: string;
  parent?: TestAdapter;
}

const anonymousNames: Iterator<string, never> = (function* () {
  let count = 1;
  while (true) {
    yield `anonymous test adapter ${count++}`;
  }
})();

export function createTestAdapter(
  options: TestAdapterOptions,
): TestAdapter {
  let setups: TestOp[] = [];
  let { parent, name = anonymousNames.next().value } = options;

  let [scope, destroy] = createScope(parent?.scope);

  let adapter: TestAdapter = {
    parent,
    name,
    scope,
    setups,
    get lineage() {
      let lineage = [adapter];
      for (let current = parent; current; current = current.parent) {
        lineage.unshift(current);
      }
      return lineage;
    },
    get fullname() {
      return adapter.lineage.map((adapter) => adapter.name).join(" > ");
    },
    addSetup(op) {
      setups.push(op);
    },
    runTest(op) {
      return scope.run(function* () {
	let allSetups = adapter.lineage.reduce((all, adapter) => all.concat(adapter.setups),[] as TestOp[])
	for (let setup of allSetups) {
	  yield* setup();
	}
        yield* op();
      });
    },
    destroy,
  };

  return adapter;
}
