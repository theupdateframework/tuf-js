# @tufjs/repo-mock

Provides mocked HTTP responses for TUF repository requests.

Unmatched requests to a mocked origin receive an HTTP 501 response containing `ERR_NOCK_NO_MATCH`.
