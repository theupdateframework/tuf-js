export type JSONValue =
  | string
  | number
  | boolean
  | any
  | { [x: string]: JSONValue }
  | Array<JSONValue>;
