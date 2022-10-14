import { Signed } from './signed';

describe('Signed', () => {
  class DummySigned extends Signed {}

  describe('constructor', () => {
    describe('when called with no arguments', () => {
      it('constructs an object', () => {
        const signed = new DummySigned({});
        expect(signed).toBeTruthy();
      });
    });

    describe('when spec version is too short', () => {
      it('constructs an object', () => {
        expect(() => {
          new DummySigned({ specVersion: '1' });
        }).toThrow('Failed to parse specVersion');
      });
    });

    describe('when spec version is too long', () => {
      it('constructs an object', () => {
        expect(() => {
          new DummySigned({ specVersion: '1.0.0.0' });
        }).toThrow('Failed to parse specVersion');
      });
    });

    describe('when spec version includes non number', () => {
      it('constructs an object', () => {
        expect(() => {
          new DummySigned({ specVersion: '1.b.c' });
        }).toThrow('Failed to parse specVersion');
      });
    });

    describe('when spec version is unsupported', () => {
      it('constructs an object', () => {
        expect(() => {
          new DummySigned({ specVersion: '2.0.0' });
        }).toThrow('Unsupported specVersion');
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
        expect(subject.isExpired('2021-11-18')).toBe(false);
      });
    });

    describe('when reference time is greater than the expiry time', () => {
      it('returns true', () => {
        expect(subject.isExpired(new Date().toISOString())).toBe(true);
      });
    });
  });
});
