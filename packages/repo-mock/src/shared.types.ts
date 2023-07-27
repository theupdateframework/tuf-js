export interface Target {
  name: string;
  content: string | Buffer;
}

export type HandlerFn = () => HandlerFnResult;

export type HandlerFnResult = {
  statusCode: number;
  response: string | Buffer;
  contentType?: string;
};

export type Handler = {
  path: string;
  fn: HandlerFn;
};
