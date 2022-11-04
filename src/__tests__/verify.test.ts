import { Metadata } from '../models/metadata';
import { MetadataKind } from '../utils/types';
import { roots } from './__fixtures__/roots';
import { timestamps } from './__fixtures__/timestamps';

describe('sigstore TUF', () => {
  const root = Metadata.fromJSON(MetadataKind.Root, roots.sigstore);

  describe('verify root', () => {
    it('verifies the root successfully', () => {
      expect(() => {
        root.verifyDelegate('root', root);
      }).not.toThrow();
    });
  });
});

describe('python TUF sample', () => {
  const root = Metadata.fromJSON(MetadataKind.Root, roots.pythonSample);
  const timestamp = Metadata.fromJSON(
    MetadataKind.Timestamp,
    timestamps.pythonSample
  );

  describe('verify root', () => {
    it('verifies the root successfully', () => {
      expect(() => {
        root.verifyDelegate('root', root);
      }).not.toThrow();
    });
  });

  describe('verify timestamp meta from root ', () => {
    it('verifies the timestamp metadata successfully', () => {
      expect(() => {
        root.verifyDelegate('timestamp', timestamp);
      }).not.toThrow();
    });
  });
});
