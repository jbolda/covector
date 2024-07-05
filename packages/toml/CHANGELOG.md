# Changelog

## \[0.2.0]

### Enhancements

- [`e2c83dc`](https://www.github.com/jbolda/covector/commit/e2c83dc5e98b9d8ddbf428af2dda32168e4df9ec) ([#318](https://www.github.com/jbolda/covector/pull/318) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Add `exports` to `package.json` for improved capability and an enhanced experience when developed covector and testing locally.
- [`ce43ad7`](https://www.github.com/jbolda/covector/commit/ce43ad7fd924319b544b30785217070436182d71) ([#319](https://www.github.com/jbolda/covector/pull/319) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Add logger instance to allow custom loggers based on the usage context. It enables different structured logs for the CLI vs within a GitHub Action, as well as for local development and testing.

### Changes Supporting Covector Development

- [`ce43ad7`](https://www.github.com/jbolda/covector/commit/ce43ad7fd924319b544b30785217070436182d71) ([#319](https://www.github.com/jbolda/covector/pull/319) by [@jbolda](https://www.github.com/jbolda/covector/../../jbolda)) Switch to Vitest for the test runner. This improves speed and enables improved ability to update to current standards. Additionally, we use `pino-test` with the changes to the logger to more specifically check log output. Along with this, we switch multiple test fixtures to run commands that would return more standard output across OS which reduces test flakiness.

## \[0.1.0]

- [`f498d5e`](https://www.github.com/jbolda/covector/commit/f498d5e4abeacc1a1836dbb1dee02202714dcb98) ([#303](https://www.github.com/jbolda/covector/pull/303) by [@amrbashir](https://www.github.com/jbolda/covector/../../amrbashir)) Initial Release
