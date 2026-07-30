# Changelog

## [0.3.0]

### Enhancements

- [`1c745f0`](https://www.github.com/jbolda/covector/commit/1c745f062521531a18cd09469a7ab131c9840dd5) ([#365](https://www.github.com/jbolda/covector/pull/365) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Upgrade to `effection` v4. This is mostly an internal change, but allows for much better type handling and deeper logging customization.

### Dependencies

- [`4aa45ed`](https://www.github.com/jbolda/covector/commit/4aa45ed242bbd419f0a3abb380da6112e6a7f782) ([#394](https://www.github.com/jbolda/covector/pull/394) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Update to `wasm-pack@0.15.0`.

### Changes Supporting Covector Development

- [`29348d2`](https://www.github.com/jbolda/covector/commit/29348d217b906f5a39b45a94bae10be523874f40) ([#395](https://www.github.com/jbolda/covector/pull/395) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Shift to using `tsdown` for bundling dependencies.

## \[0.2.0]

### Enhancements

- [`e2c83dc`](https://www.github.com/jbolda/covector/commit/e2c83dc5e98b9d8ddbf428af2dda32168e4df9ec) ([#318](https://www.github.com/jbolda/covector/pull/318) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Add `exports` to `package.json` for improved capability and an enhanced experience when developed covector and testing locally.
- [`ce43ad7`](https://www.github.com/jbolda/covector/commit/ce43ad7fd924319b544b30785217070436182d71) ([#319](https://www.github.com/jbolda/covector/pull/319) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Add logger instance to allow custom loggers based on the usage context. It enables different structured logs for the CLI vs within a GitHub Action, as well as for local development and testing.

### Changes Supporting Covector Development

- [`ce43ad7`](https://www.github.com/jbolda/covector/commit/ce43ad7fd924319b544b30785217070436182d71) ([#319](https://www.github.com/jbolda/covector/pull/319) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Switch to Vitest for the test runner. This improves speed and enables improved ability to update to current standards. Additionally, we use `pino-test` with the changes to the logger to more specifically check log output. Along with this, we switch multiple test fixtures to run commands that would return more standard output across OS which reduces test flakiness.

## \[0.1.0]

- [`f498d5e`](https://www.github.com/jbolda/covector/commit/f498d5e4abeacc1a1836dbb1dee02202714dcb98) ([#303](https://www.github.com/jbolda/covector/pull/303) by [@amrbashir](https://www.github.com/jbolda/covector/../../amrbashir)) Initial Release
