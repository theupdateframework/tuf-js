# <img src="https://cdn.rawgit.com/theupdateframework/artwork/3a649fa6/tuf-logo.svg" height="100" valign="middle" alt="TUF"/> A Framework for Securing Software Update Systems

[![npm version](https://img.shields.io/npm/v/tuf-js.svg?style=flat)](https://www.npmjs.com/package/tuf-js) [![CI Status](https://github.com/theupdateframework/tuf-js/workflows/CI/badge.svg)](https://github.com/theupdateframework/tuf-js/actions/workflows/ci.yml) [![Smoke Test Status](https://github.com/theupdateframework/tuf-js/workflows/smoke-test/badge.svg)](https://github.com/theupdateframework/tuf-js/actions/workflows/smoke-test.yml)

---

[The Update Framework (TUF)](https://theupdateframework.io/) is a framework for
secure content delivery and updates. It protects against various types of
supply chain attacks and provides resilience to compromise. This repository is written in Typescript. It is intended to conform to
version 1.0 of the [TUF
specification](https://theupdateframework.github.io/specification/latest/).

## About The Update Framework

The Update Framework (TUF) design helps developers maintain the security of a
software update system, even against attackers that compromise the repository
or signing keys.
TUF provides a flexible
[specification](https://github.com/theupdateframework/specification/blob/master/tuf-spec.md)
defining functionality that developers can use in any software update system or
re-implement to fit their needs.

TUF is hosted by the [Linux Foundation](https://www.linuxfoundation.org/) as
part of the [Cloud Native Computing Foundation](https://www.cncf.io/) (CNCF)
and its design is [used in production](https://theupdateframework.io/adoptions/)
by various tech companies and open source organizations. A variant of TUF
called [Uptane](https://uptane.github.io/) is used to secure over-the-air
updates in automobiles.

Please see [TUF's website](https://theupdateframework.com/) for more information about TUF!

## Documentation

- [Introduction to TUF's Design](https://theupdateframework.io/overview/)
- [The TUF Specification](https://theupdateframework.github.io/specification/latest/)
- [Developer documentation](https://theupdateframework.readthedocs.io/), including
  [API reference](https://theupdateframework.readthedocs.io/en/latest/api/api-reference.html)
- [Usage examples](./examples/client)

## Requirements

* node: >= 18.17.0

## License

This project is licensed under the terms of the MIT open source license. Please refer to [MIT](./LICENSE.md) for the full terms.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](./CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## Maintainers

`tuf-js` is maintained by [@ejahnGithub](https://github.com/ejahnGithub) and [@bdehamer](https://github.com/bdehamer) on the Package Security team at GitHub.
