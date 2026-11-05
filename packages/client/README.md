# tuf-js

JavaScript TUF client implementation.

## Target cache writes

Downloaded targets are verified before publication. The client copies each verified download into a unique temporary directory under the destination's parent, then renames it over the destination. On filesystems supporting atomic replacement, readers see a complete old or new target, including when multiple updater instances share a target cache.

On Windows, the client retries `EPERM`, `EACCES`, and `EBUSY` rename errors up to 15 times, with exponential backoff capped at 250 ms. This allows short-lived readers to close the target before the replacement is retried. If retries fail, the download rejects and the existing target remains intact. The client does not delete the destination or fall back to overwriting it in place.

This behavior does not deduplicate downloads, serialize metadata refreshes, guarantee which concurrent target version wins, or provide crash durability through `fsync`. Metadata files are not covered by this target-publication guarantee.
