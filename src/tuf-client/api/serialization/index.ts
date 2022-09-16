import { Signed } from '../metadata';

export abstract class SignedSerializer {
  abstract serialize(signed: Signed): void;
}

export class CanonicalJSONSerializer extends SignedSerializer {
  constructor() {
    super();
  }
  public serialize(signed_obj: Signed) {
    //Serialize Signed object into utf-8 encoded OLPC Canonical JSON
    let canonical_bytes;
    const signed_dict = signed_obj.to_dict();
    // TODO implemenet encode_canonical involve with securesystemslib will work on it later
    // canonical_bytes = encode_canonical(signed_dict).encode('utf-8');

    return canonical_bytes;
  }
}
