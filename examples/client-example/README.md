to run the example:

# TUF Client Example

TUF Client Example, using `tuf-js`.

This TUF Client Example implements the following actions:

- Client Infrastructure Initialization
- Download target files from TUF Repository

The example client expects to find a TUF repository running on localhost. We
can use the static metadata files in `repository_data`
to set one up.

Run the `npm install` under `tuf-js/` to install the libraries

```console
$ npm install
```

Run the repository using the http-server under `tuf-js/`, and keep this
session running.

```console
$ npx http-server repository_data
Starting up http-server, serving repository_data Available on:
  http://127.0.0.1:8080
  http://100.64.106.17:8080
  ...
```

To use the TUF Client Example to download a target file. Run the command under `tuf-js/examples/client-example`

```console
$ npx ts-node client_example.ts
```
