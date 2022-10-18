import { Signed, SignedOptions } from './base';
import { ValueError } from './error';
import { JSONObject } from './types';

describe('Signed', () => {
  class DummySigned extends Signed {
    public toJSON(): JSONObject {
      return {};
    }
  }

  describe('constructor', () => {
    describe('when called with no arguments', () => {
      it('constructs an object', () => {
        const subject = new DummySigned({});
        expect(subject).toBeTruthy();
      });
    });

    describe('when spec version is too short', () => {
      it('constructs an object', () => {
        expect(() => {
          new DummySigned({ specVersion: '1' });
        }).toThrow(ValueError);
      });
    });

    describe('when spec version is too long', () => {
      it('constructs an object', () => {
        expect(() => {
          new DummySigned({ specVersion: '1.0.0.0' });
        }).toThrow(ValueError);
      });
    });

    describe('when spec version includes non number', () => {
      it('constructs an object', () => {
        expect(() => {
          new DummySigned({ specVersion: '1.b.c' });
        }).toThrow(ValueError);
      });
    });

    describe('when spec version is unsupported', () => {
      it('constructs an object', () => {
        expect(() => {
          new DummySigned({ specVersion: '2.0.0' });
        }).toThrow(ValueError);
      });
    });
  });

  describe('isExpired', () => {
    const subject = new DummySigned({
      expires: '2021-12-18T13:28:12.99008-06:00',
    });

    describe('when reference time is not provided', () => {
      it('returns true', () => {
        expect(subject.isExpired()).toBe(true);
      });
    });

    describe('when reference time is less than the expiry time', () => {
      it('returns false', () => {
        expect(subject.isExpired(new Date('2021-11-18'))).toBe(false);
      });
    });

    describe('when reference time is greater than the expiry time', () => {
      it('returns true', () => {
        expect(subject.isExpired(new Date())).toBe(true);
      });
    });
  });

  describe('equals', () => {
    const opts: SignedOptions = {
      version: 1,
      specVersion: '1.0.0',
      expires: new Date().toISOString(),
    };
    const subject = new DummySigned(opts);

    describe('when other is not a Signed', () => {
      it('returns false', () => {
        expect(subject.equals({} as DummySigned)).toBe(false);
      });
    });

    describe('when other is a Signed', () => {
      describe('when other is equal', () => {
        const other = new DummySigned(opts);
        it('returns true', () => {
          expect(subject.equals(other)).toBe(true);
        });
      });

      describe('when other is NOT equal', () => {
        const other = new DummySigned({ ...opts, version: 2 });
        it('returns false', () => {
          expect(subject.equals(other)).toBe(false);
        });
      });
    });
  });

  describe('isExpired', () => {
    const subject = new DummySigned({ expires: '1970-01-01T00:00:01.000Z' });

    describe('when reference time is not provided', () => {
      it('returns true', () => {
        expect(subject.isExpired()).toBe(true);
      });
    });

    describe('when reference time is less than the expiry time', () => {
      it('returns false', () => {
        expect(subject.isExpired(new Date(1))).toBe(false);
      });
    });

    describe('when reference time is greater than the expiry time', () => {
      it('returns true', () => {
        expect(subject.isExpired(new Date())).toBe(true);
      });
    });
  });

  describe('.commonFieldsFromJSON', () => {
    const json = {
      version: 1,
      spec_version: '1.0.0',
      expires: new Date().toISOString(),
      foo: 'bar',
    };

    describe('when there is a type error with version', () => {
      it('throws an error', () => {
        expect(() => {
          DummySigned.commonFieldsFromJSON({ ...json, version: '1' });
        }).toThrow(TypeError);
      });
    });

    describe('when there is a type error with spec_version', () => {
      it('throws an error', () => {
        expect(() => {
          DummySigned.commonFieldsFromJSON({ ...json, spec_version: 1 });
        }).toThrow(TypeError);
      });
    });

    describe('when there is a type error with expires', () => {
      it('throws an error', () => {
        expect(() => {
          DummySigned.commonFieldsFromJSON({ ...json, expires: 1 });
        }).toThrow(TypeError);
      });
    });

    describe('when the JSON is valid', () => {
      it('throws an error', () => {
        const opts = DummySigned.commonFieldsFromJSON(json);
        expect(opts.version).toEqual(1);
        expect(opts.specVersion).toEqual('1.0.0');
        expect(opts.expires).toEqual(json.expires);
        expect(opts.unrecognizedFields).toEqual({ foo: 'bar' });
      });
    });
  });
});
