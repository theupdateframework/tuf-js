import { isMetadataKind, Signed, SignedOptions } from '../src/base';
import { ValueError } from '../src/error';
import { JSONObject } from '../src/utils';

describe('Signed', () => {
  class DummySigned extends Signed {
    public toJSON(): JSONObject {
      return {};
    }
  }

  describe('constructor', () => {
    describe('when called with no arguments', () => {
      it('constructs an object', () => {
        const subject = new DummySigned({} as SignedOptions);
        expect(subject).toBeTruthy();
      });
    });

    describe('when spec version is too short', () => {
      it('constructs an object', () => {
        expect(() => {
          new DummySigned({ specVersion: '1' } as SignedOptions);
        }).toThrow(ValueError);
      });
    });

    describe('when spec version is too long', () => {
      it('constructs an object', () => {
        expect(() => {
          new DummySigned({ specVersion: '1.0.0.0' } as SignedOptions);
        }).toThrow(ValueError);
      });
    });

    describe('when spec version includes non number', () => {
      it('constructs an object', () => {
        expect(() => {
          new DummySigned({ specVersion: '1.b.c' } as SignedOptions);
        }).toThrow(ValueError);
      });
    });

    describe('when spec version is unsupported', () => {
      it('constructs an object', () => {
        expect(() => {
          new DummySigned({ specVersion: '2.0.0' } as SignedOptions);
        }).toThrow(ValueError);
      });
    });
  });

  describe('isExpired', () => {
    const subject = new DummySigned({
      expires: '2021-12-18T13:28:12.99008-06:00',
    } as SignedOptions);

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
    const subject = new DummySigned({
      expires: '1970-01-01T00:00:01.000Z',
    } as SignedOptions);

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

    describe('when the version is not included', () => {
      it('throws an error', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          DummySigned.commonFieldsFromJSON({
            ...json,
            version: undefined,
          } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
        }).toThrow(ValueError);
      });
    });

    describe('when there is a type error with spec_version', () => {
      it('throws an error', () => {
        expect(() => {
          DummySigned.commonFieldsFromJSON({ ...json, spec_version: 1 });
        }).toThrow(TypeError);
      });
    });

    describe('when the spec_version is not included', () => {
      it('throws an error', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          DummySigned.commonFieldsFromJSON({
            ...json,
            spec_version: undefined,
          } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
        }).toThrow(ValueError);
      });
    });

    describe('when there is a type error with expires', () => {
      it('throws an error', () => {
        expect(() => {
          DummySigned.commonFieldsFromJSON({ ...json, expires: 1 });
        }).toThrow(TypeError);
      });
    });

    describe('when the expires is not included', () => {
      it('throws an error', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          DummySigned.commonFieldsFromJSON({
            ...json,
            expires: undefined,
          } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
        }).toThrow(ValueError);
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

describe('isMetadataKind', () => {
  describe('when the value is root', () => {
    it('returns true', () => {
      expect(isMetadataKind('root')).toBe(true);
    });
  });

  describe('when the value is targets', () => {
    it('returns true', () => {
      expect(isMetadataKind('targets')).toBe(true);
    });
  });
  describe('when the value is snapshot', () => {
    it('returns true', () => {
      expect(isMetadataKind('snapshot')).toBe(true);
    });
  });
  describe('when the value is timestamp', () => {
    it('returns true', () => {
      expect(isMetadataKind('timestamp')).toBe(true);
    });
  });
  describe('when the value is undefined', () => {
    it('returns false', () => {
      expect(isMetadataKind(undefined)).toBe(false);
    });
  });

  describe('when the value is null', () => {
    it('returns false', () => {
      expect(isMetadataKind(null)).toBe(false);
    });
  });

  describe('when the value is some random string', () => {
    it('returns false', () => {
      expect(isMetadataKind('random')).toBe(false);
    });
  });
});
