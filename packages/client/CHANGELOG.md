# tuf-js

## 2.2.0

### Minor Changes

- d7c2600: Adds a new `forceCache` option to the `Updater`

## 2.1.0

### Minor Changes

- 00bdeea: Export `UpdaterOptions` and `Config` types

## 2.0.0

### Major Changes

- bae838e: Drop node 14 support
- bae838e: Bump `make-fetch-happen` from 11.0.0 to 13.0.0

### Minor Changes

- d3b9587: Deprecates in `fetchRetries` config option in the `UpdaterOptions` interface in favor of the new `fetchRetry` option.

### Patch Changes

- Updated dependencies [e95e18e]
  - @tufjs/models@2.0.0

## 1.1.7

### Patch Changes

- d286cba: Fixes bug in `findCachedTarget` which skips verification of cached targets

## 1.1.6

### Patch Changes

- 670d771: Integrate `debug` logging library

## 1.1.5

### Patch Changes

- Updated dependencies [a668944]
  - @tufjs/models@1.0.4

## 1.1.4

### Patch Changes

- Updated dependencies [028df77]
  - @tufjs/models@1.0.3

## 1.1.3

### Patch Changes

- f53a392: Fix error downloading delegated targets
- Updated dependencies [4e4f6e9]
  - @tufjs/models@1.0.2

## 1.1.2

### Patch Changes

- Updated dependencies [8d71675]
  - @tufjs/models@1.0.1

## 1.1.1

### Patch Changes

- 80e8e0f: Re-add missing TargetFile export

## 1.1.0

### Minor Changes

- e67ae32: TUF metadata model classes refactored into dedicated @tufjs/models package

## 1.0.0

### Major Changes

- 99624cc: Initial release
