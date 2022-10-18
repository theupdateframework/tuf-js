import { LengthOrHashMismatchError, ValueError } from './error';
import { MetaFile, TargetFile } from './file';

describe('MetaFile', () => {
  describe('constructor', () => {
    describe('when called with version less than 1', () => {
      const opts = { version: 0 };
      it('throws an error', () => {
        expect(() => new MetaFile(opts)).toThrow(ValueError);
      });
    });

    describe('when called with length less than 0', () => {
      const opts = { version: 1, length: -1 };
      it('throws an error', () => {
        expect(() => new MetaFile(opts)).toThrow(ValueError);
      });
    });

    describe('when called with valid arguments', () => {
      const opts = {
        version: 1,
        length: 1,
        hashes: { sha256: 'a' },
        unrecognizedFields: { foo: 'bar' },
      };
      it('constructs an object', () => {
        const file = new MetaFile(opts);
        expect(file).toBeTruthy();
        expect(file.version).toEqual(opts.version);
        expect(file.length).toEqual(opts.length);
        expect(file.hashes).toEqual(opts.hashes);
        expect(file.unrecognizedFields).toEqual(opts.unrecognizedFields);
      });
    });
  });

  describe('#equals', () => {
    const opts = {
      version: 1,
      length: 1,
      hashes: { sha256: 'a' },
      unrecognizedFields: { foo: 'bar' },
    };
    const subject = new MetaFile(opts);

    describe('when the other object is not a MetaFile', () => {
      it('returns false', () => {
        expect(subject.equals({} as MetaFile)).toBeFalsy();
      });
    });

    describe('when the other object has a different version', () => {
      const other = new MetaFile({ ...opts, version: 2 });
      it('returns false', () => {
        expect(subject.equals(other)).toBeFalsy();
      });
    });

    describe('when the other object has a different length', () => {
      const other = new MetaFile({ ...opts, length: 2 });
      it('returns false', () => {
        expect(subject.equals(other)).toBeFalsy();
      });
    });

    describe('when the other object has different hashes', () => {
      const other = new MetaFile({ ...opts, hashes: { sha256: 'b' } });
      it('returns false', () => {
        expect(subject.equals(other)).toBeFalsy();
      });
    });

    describe('when the other object has different unrecognized fields', () => {
      const other = new MetaFile({
        ...opts,
        unrecognizedFields: { foo: 'baz' },
      });
      it('returns false', () => {
        expect(subject.equals(other)).toBeFalsy();
      });
    });

    describe('when the other object has the same values', () => {
      const other = new MetaFile(opts);
      it('returns true', () => {
        expect(subject.equals(other)).toBeTruthy();
      });
    });
  });

  describe('#verify', () => {
    const opts = {
      version: 1,
      length: 5,
      hashes: {
        sha256:
          '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      },
    };
    const subject = new MetaFile(opts);

    describe('when the data length does not match the expected length', () => {
      const data = Buffer.from('a');

      it('throws an error', () => {
        expect(() => subject.verify(data)).toThrow(LengthOrHashMismatchError);
      });
    });

    describe('when the data does not match the expected hash', () => {
      const data = Buffer.from('abcde');

      it('throws an error', () => {
        expect(() => subject.verify(data)).toThrow(LengthOrHashMismatchError);
      });
    });

    describe('when the data matches the expected length and hash', () => {
      const data = Buffer.from('hello');

      it('does not throw an error', () => {
        expect(() => subject.verify(data)).not.toThrow();
      });
    });
  });

  describe('#toJSON', () => {
    describe('when all fields are present', () => {
      const opts = {
        version: 1,
        length: 1,
        hashes: { sha256: 'a' },
        unrecognizedFields: { foo: 'bar' },
      };
      const subject = new MetaFile(opts);

      it('returns a JSON representation of the object', () => {
        const json = subject.toJSON();
        expect(json.version).toEqual(opts.version);
        expect(json.length).toEqual(opts.length);
        expect(json.hashes).toEqual(opts.hashes);
        expect(json).toHaveProperty('foo');
        expect(json.foo).toEqual(opts.unrecognizedFields.foo);
      });
    });

    describe('when some fields are missing', () => {
      const opts = {
        version: 1,
      };
      const subject = new MetaFile(opts);

      it('returns a JSON representation of the object', () => {
        const json = subject.toJSON();
        expect(json.version).toEqual(opts.version);
        expect(Object.keys(json).length).toEqual(1);
        expect(json).not.toHaveProperty('length');
        expect(json).not.toHaveProperty('hashes');
      });
    });
  });

  describe('.fromJSON', () => {
    const json = {
      version: 1,
      length: 1,
      hashes: { sha256: 'a' },
      foo: 'bar',
    };

    describe('when there is a type error with the version', () => {
      it('throws an error', () => {
        expect(() => MetaFile.fromJSON({ ...json, version: '1' })).toThrow(
          TypeError
        );
      });
    });

    describe('when there is a type error with the length', () => {
      it('throws an error', () => {
        expect(() => MetaFile.fromJSON({ ...json, length: 'a' })).toThrow(
          TypeError
        );
      });
    });

    describe('when there is a type error with the hashes', () => {
      it('throws an error', () => {
        expect(() => MetaFile.fromJSON({ ...json, hashes: 'a' })).toThrow(
          TypeError
        );
      });
    });

    describe('when the JSON is valid', () => {
      it('returns a MetaFile object', () => {
        const subject = MetaFile.fromJSON(json);
        expect(subject).toBeTruthy();
        expect(subject.version).toEqual(json.version);
        expect(subject.length).toEqual(json.length);
        expect(subject.hashes).toEqual(json.hashes);
        expect(subject.unrecognizedFields).toEqual({ foo: 'bar' });
      });
    });
  });
});

describe('TargetFile', () => {
  describe('constructor', () => {
    describe('when called with length less than 0', () => {
      const opts = { length: -1, path: 'foo', hashes: { sha256: 'a' } };
      it('throws an error', () => {
        expect(() => new TargetFile(opts)).toThrow(ValueError);
      });
    });

    describe('when called with valid arguments', () => {
      const opts = {
        length: 1,
        path: 'foo',
        hashes: { sha256: 'a' },
        unrecognizedFields: { foo: 'bar' },
      };
      it('constructs an object', () => {
        const file = new TargetFile(opts);
        expect(file).toBeTruthy();
        expect(file.length).toEqual(opts.length);
        expect(file.hashes).toEqual(opts.hashes);
        expect(file.unrecognizedFields).toEqual(opts.unrecognizedFields);
      });
    });
  });

  describe('#custom', () => {
    describe('when custom fields are present', () => {
      const opts = {
        length: 1,
        path: 'foo',
        hashes: { sha256: 'a' },
        unrecognizedFields: { custom: { foo: 'bar' } },
      };

      it('returns the custom fields', () => {
        const file = new TargetFile(opts);
        expect(file.custom).toEqual(opts.unrecognizedFields.custom);
      });
    });

    describe('when NO custom fields are present', () => {
      const opts = {
        length: 1,
        path: 'foo',
        hashes: { sha256: 'a' },
      };

      it('returns undefined', () => {
        const file = new TargetFile(opts);
        expect(file.custom).toBeUndefined();
      });
    });
  });

  describe('#equals', () => {
    const opts = {
      length: 1,
      path: 'foo',
      hashes: { sha256: 'a' },
      unrecognizedFields: { foo: 'bar' },
    };
    const subject = new TargetFile(opts);

    describe('when the other object is not a TargetFile', () => {
      it('returns false', () => {
        expect(subject.equals({} as TargetFile)).toBeFalsy();
      });
    });

    describe('when the other object has a different length', () => {
      const other = new TargetFile({ ...opts, length: 2 });
      it('returns false', () => {
        expect(subject.equals(other)).toBeFalsy();
      });
    });

    describe('when the other object has a different path', () => {
      const other = new TargetFile({ ...opts, path: 'bar' });
      it('returns false', () => {
        expect(subject.equals(other)).toBeFalsy();
      });
    });

    describe('when the other object has different hashes', () => {
      const other = new TargetFile({ ...opts, hashes: { sha256: 'b' } });
      it('returns false', () => {
        expect(subject.equals(other)).toBeFalsy();
      });
    });

    describe('when the other object has different unrecognized fields', () => {
      const other = new TargetFile({
        ...opts,
        unrecognizedFields: { foo: 'baz' },
      });
      it('returns false', () => {
        expect(subject.equals(other)).toBeFalsy();
      });
    });

    describe('when the other object has the same values', () => {
      const other = new TargetFile(opts);
      it('returns true', () => {
        expect(subject.equals(other)).toBeTruthy();
      });
    });
  });

  describe('#verify', () => {
    const opts = {
      length: 5,
      path: 'foo',
      hashes: {
        sha256:
          '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      },
    };
    const subject = new TargetFile(opts);

    describe('when the data length does not match the expected length', () => {
      const data = Buffer.from('a');

      it('throws an error', () => {
        expect(() => subject.verify(data)).toThrow(LengthOrHashMismatchError);
      });
    });

    describe('when the hash algorithm is not supported', () => {
      const subject = new TargetFile({ ...opts, hashes: { foo: 'a' } });
      const data = Buffer.from('abcde');

      it('throws an error', () => {
        expect(() => subject.verify(data)).toThrow(LengthOrHashMismatchError);
      });
    });
    describe('when the data does not match the expected hash', () => {
      const data = Buffer.from('abcde');

      it('throws an error', () => {
        expect(() => subject.verify(data)).toThrow(LengthOrHashMismatchError);
      });
    });

    describe('when the data matches the expected length and hash', () => {
      const data = Buffer.from('hello');

      it('does not throw an error', () => {
        expect(() => subject.verify(data)).not.toThrow();
      });
    });
  });

  describe('#toJSON', () => {
    const opts = {
      length: 1,
      path: 'foo',
      hashes: { sha256: 'a' },
      unrecognizedFields: { foo: 'bar' },
    };
    const subject = new TargetFile(opts);

    it('returns a JSON representation of the object', () => {
      const json = subject.toJSON();
      expect(json.length).toEqual(opts.length);
      expect(json.hashes).toEqual(opts.hashes);
      expect(json).toHaveProperty('foo');
      expect(json.foo).toEqual(opts.unrecognizedFields.foo);
    });
  });

  describe('.fromJSON', () => {
    const path = 'foo';
    const json = {
      length: 1,
      hashes: { sha256: 'a' },
      foo: 'bar',
    };

    describe('when there is a type error with the length', () => {
      it('throws an error', () => {
        expect(() =>
          TargetFile.fromJSON(path, { ...json, length: 'a' })
        ).toThrow(TypeError);
      });
    });

    describe('when there is a type error with the hashes', () => {
      it('throws an error', () => {
        expect(() =>
          TargetFile.fromJSON(path, { ...json, hashes: 'a' })
        ).toThrow(TypeError);
      });
    });

    describe('when the JSON is valid', () => {
      it('returns a MetaFile object', () => {
        const subject = TargetFile.fromJSON(path, json);
        expect(subject).toBeTruthy();
        expect(subject.length).toEqual(json.length);
        expect(subject.hashes).toEqual(json.hashes);
        expect(subject.unrecognizedFields).toEqual({ foo: 'bar' });
      });
    });
  });
});
