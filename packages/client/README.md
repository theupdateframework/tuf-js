# tuf-js

JavaScript TUF client implementation.

## Target cache writes

Downloaded targets are verified before publication. The client copies each verified download into a unique temporary directory under the destination's parent, then renames it over the destination. On filesystems supporting atomic replacement, readers see a complete old or new target, including when multiple updater instances share a target cache.

Publication failures reject the download and leave the existing target intact. The client does not delete the destination or fall back to overwriting it in place. Filesystem permissions and platform file-sharing restrictions can cause rename to fail.

This behavior does not deduplicate downloads, serialize metadata refreshes, guarantee which concurrent target version wins, or provide crash durability through `fsync`. Metadata files are not covered by this target-publication guarantee.
