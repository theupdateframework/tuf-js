# TUF Client Example

The example client demonstrates how to initialize `tuf-js` and use it to
download targets from a TUF repository.

The client expects to find a TUF repository running on localhost. Use the
instructions in the [repository](../repository) directory to start the
example repo.

To use the client to download a target file, run the following command
from the "/examples/client" directory:

```console
npx ts-node client.ts
```

After running the client you should find that the TUF metadata files
from the sample repository have been cached in the "./metadata" directory
and the target file has been downloaded to "./targets/file1.txt"
