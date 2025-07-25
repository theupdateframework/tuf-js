# tuf-js

## 4.0.0

### Major Changes

- e6b255a: Drop support for node 18
- e6b255a: Bump make-fetch-happen from 14.x to 15.x

### Patch Changes

- Updated dependencies [e6b255a]
  - @tufjs/models@4.0.0

## 3.1.0

### Minor Changes

- dac4594: Bump make-fetch-happen from 14.0.2 to 14.0.3
- dac4594: Bump debug from 4.3.6. to 4.4.1

## 3.0.1

### Patch Changes

- cb54532: Ensure errors are thrown when root metadata is invalid
- 6915c1f: Ensure that role names are properly encoded when used in URLs or file names
- Updated dependencies [47b931f]
- Updated dependencies [777b805]
  - @tufjs/models@3.0.1

## 3.0.0

### Major Changes

- a5cd1ec: Bump make-fetch-happen from 13.0.1 to 14.0.1
- a5cd1ec: Drop support for node 16

### Minor Changes

- 9c8f0e8: Change maxRootRotations from 32 to 256

### Patch Changes

- Updated dependencies [a5cd1ec]
- Updated dependencies [ff91b23]
  - @tufjs/models@3.0.0

## 2.2.1

### Patch Changes

- e70004a: Bump make-fetch-happen from 13.0.0 to 13.0.1
- Updated dependencies [a108f83]
  - @tufjs/models@2.0.1

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
