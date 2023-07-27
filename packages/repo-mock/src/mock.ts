import nock from 'nock';
import type { Handler, HandlerFn } from './shared.types';

type NockHandler = (uri: string, request: nock.Body) => nock.ReplyFnResult;

// Sets-up nock-based mocking for the given handler
export function mock(base: string, handler: Handler): void {
  nock(base).get(handler.path).reply(adapt(handler.fn));
}

// Adapts our HandlerFn to nock's NockHandler format
function adapt(handler: HandlerFn): NockHandler {
  /* istanbul ignore next */
  return (): nock.ReplyFnResult => {
    const { statusCode, response, contentType } = handler();

    return [
      statusCode,
      response,
      { 'Content-Type': contentType || 'text/plain' },
    ];
  };
}
