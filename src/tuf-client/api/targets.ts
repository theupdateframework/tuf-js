import { JSONObject, JSONValue } from '../utils/type';
import { Signed } from './base';

export class Targets extends Signed {
  public type = 'Targets';
  public static fromJSON(data: JSONValue): Targets {
    return new Targets({});
  }
  public toJSON(): JSONObject {
    return {};
  }
}
