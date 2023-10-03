# @tufjs/cli

CLI for securely downloading targets from TUF repositories.

# Usage
<!-- usage -->
```sh-session
$ npm install -g @tufjs/cli
$ tuf COMMAND
running command...
$ tuf (--version)
@tufjs/cli/0.0.0 darwin-arm64 node-v16.19.1
$ tuf --help [COMMAND]
USAGE
  $ tuf COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`tuf download-target`](#tuf-download-target)
* [`tuf help [COMMANDS]`](#tuf-help-commands)

## `tuf download-target`

download a target from a TUF repository and verify its signature

```
USAGE
  $ tuf download-target --metadata-base-url <value> --target-name <value> [--cache-path <value>] [--target-base-url
    <value>] [--root <value>] [--unsafe-root-download] [-o <value>]

FLAGS
  -o, --output-file=<value>    write output to file
  --cache-path=<value>         path to the Sigstore TUF cache
  --metadata-base-url=<value>  (required) URL to the TUF metadata repository
  --root=<value>               path to the initial trusted root
  --target-base-url=<value>    URL to the TUF target repository
  --target-name=<value>        (required) me of the target to download
  --unsafe-root-download       allow downloading the trusted root from the TUF metadata repository (THIS IS NOT SAFE)

DESCRIPTION
  download a target from a TUF repository and verify its signature

ALIASES
  $ tuf download

EXAMPLES
  $ tuf download-target
```



## `tuf help [COMMANDS]`

Display help for tuf.

```
USAGE
  $ tuf help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for tuf.
```


<!-- commandsstop -->
