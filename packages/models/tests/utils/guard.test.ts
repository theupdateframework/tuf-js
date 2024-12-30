import {
  isDefined,
  isObject,
  isObjectRecord,
  isStringArray,
  isStringRecord,
} from '../../src/utils/guard';

describe('isDefined', () => {
  describe('when the value is defined', () => {
    it('returns true', () => {
      expect(isDefined(1)).toBe(true);
    });
  });

  describe('when the value is undefined', () => {
    it('returns false', () => {
      expect(isDefined(undefined)).toBe(false);
    });
  });
});

describe('isObject', () => {
  describe('when the value is an object', () => {
    it('returns true', () => {
      expect(isObject({})).toBe(true);
    });
  });

  describe('when the value is null', () => {
    it('returns false', () => {
      expect(isObject(null)).toBe(false);
    });
  });

  describe('when the value is not an object', () => {
    it('returns false', () => {
      expect(isObject(2)).toBe(false);
    });
  });
});

describe('isStringArray', () => {
  describe('when the value is a string array', () => {
    it('returns true', () => {
      expect(isStringArray(['a', 'b'])).toBe(true);
    });
  });

  describe('when the value is an array containing non-strings', () => {
    it('returns false', () => {
      expect(isStringArray(['a', 2])).toBe(false);
    });
  });

  describe('when the value is undefined', () => {
    it('returns false', () => {
      expect(isStringArray(undefined)).toBe(false);
    });
  });

  describe('when the value is a not an array', () => {
    it('returns false', () => {
      expect(isStringArray(2)).toBe(false);
    });
  });
});

describe('isStringRecord', () => {
  describe('when the value is a string record', () => {
    it('returns true', () => {
      expect(isStringRecord({ a: 'b' })).toBe(true);
    });
  });

  describe('when the value is a record containing non-strings', () => {
    it('returns false', () => {
      expect(isStringRecord({ a: 2 })).toBe(false);
    });
  });

  describe('when the value is undefined', () => {
    it('returns false', () => {
      expect(isStringRecord(undefined)).toBe(false);
    });
  });

  describe('when the value is null', () => {
    it('returns false', () => {
      expect(isStringRecord(null)).toBe(false);
    });
  });

  describe('when the value is a not an object', () => {
    it('returns false', () => {
      expect(isStringRecord(2)).toBe(false);
    });
  });
});

describe('isObjectRecord', () => {
  describe('when the value is an object record', () => {
    it('returns true', () => {
      expect(isObjectRecord({ a: {} })).toBe(true);
    });
  });

  describe('when the value is a record containing non-objects', () => {
    it('returns false', () => {
      expect(isObjectRecord({ a: 2 })).toBe(false);
    });
  });

  describe('when the value is undefined', () => {
    it('returns false', () => {
      expect(isObjectRecord(undefined)).toBe(false);
    });
  });

  describe('when the value is null', () => {
    it('returns false', () => {
      expect(isObjectRecord(null)).toBe(false);
    });
  });

  describe('when the value is a not an object', () => {
    it('returns false', () => {
      expect(isObjectRecord(2)).toBe(false);
    });
  });
});
