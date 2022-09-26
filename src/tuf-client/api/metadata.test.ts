import { Signed } from './metadata';

describe('Signed', () => {
  class DummySigned extends Signed {
    public toJSON() {
      return {};
    }
  }

  describe('constructor', () => {
    describe('when called with no arguments', () => {
      it('constructs an object', () => {
        const signed = new DummySigned();
        expect(signed).toBeTruthy();
      });
    });

    describe('when spec version is too short', () => {
      it('constructs an object', () => {
        expect(() => {
          new DummySigned(1, '1');
        }).toThrow('Failed to parse specVersion');
      });
    });

    describe('when spec version is too long', () => {
      it('constructs an object', () => {
        expect(() => {
          new DummySigned(1, '1.0.0.0');
        }).toThrow('Failed to parse specVersion');
      });
    });

    describe('when spec version includes non number', () => {
      it('constructs an object', () => {
        expect(() => {
          new DummySigned(1, '1.b.c');
        }).toThrow('Failed to parse specVersion');
      });
    });

    describe('when spec version is unsupported', () => {
      it('constructs an object', () => {
        expect(() => {
          new DummySigned(1, '2.0.0');
        }).toThrow('Unsupported specVersion');
      });
    });
  });

  describe('equals', () => {
    const subject = new DummySigned(1, '1.0.0', 1, {});

    describe('when other is not a Signed', () => {
      it('returns false', () => {
        expect(subject.equals({} as any)).toBe(false);
      });
    });

    describe('when other is a Signed', () => {
      describe('when other is equal', () => {
        it('returns true', () => {
          const other = new DummySigned(1, '1.0.0', 1, {});
          expect(subject.equals(other)).toBe(true);
        });
      });

      describe('when other is NOT equal', () => {
        it('returns false', () => {
          const other = new DummySigned(2, '1.0.0', 1, {});
          expect(subject.equals(other)).toBe(false);
        });
      });

      describe('when both with no arguments', () => {
        it('returns true', () => {
          const current = new DummySigned();
          const other = new DummySigned();
          expect(current.equals(other)).toBe(true);
        });
      });
    });
  });

  describe('isExpired', () => {
    const subject = new DummySigned(1, '1.0.0', 100, {});

    describe('when reference time is not provided', () => {
      it('returns true', () => {
        expect(subject.isExpired()).toBe(true);
      });
    });

    describe('when reference time is less than the expiry time', () => {
      it('returns false', () => {
        expect(subject.isExpired(1)).toBe(false);
      });
    });

    describe('when reference time is greater than the expiry time', () => {
      it('returns true', () => {
        expect(subject.isExpired(new Date().getUTCMilliseconds())).toBe(true);
      });
    });
  });
});
