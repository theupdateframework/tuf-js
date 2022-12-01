import { Metadata } from '../models/metadata';
import { MetadataKind } from '../utils/types';
import { rootJson } from './__fixtures__/roots';
import { snapshotJson } from './__fixtures__/snapshots';
import { role1Json, targetsJson } from './__fixtures__/targets';
import { timestampJson } from './__fixtures__/timestamps';

describe('Verify TUF local sample', () => {
  const root = Metadata.fromJSON(MetadataKind.Root, rootJson);
  const timestamp = Metadata.fromJSON(MetadataKind.Timestamp, timestampJson);

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

  describe('verify the role target from targets ', () => {
    it('verifies the role metadata successfully', () => {
      const delegator = Metadata.fromJSON(MetadataKind.Targets, targetsJson);
      const newDelegate = Metadata.fromJSON(MetadataKind.Targets, role1Json);

      expect(() => {
        delegator.verifyDelegate('role1', newDelegate);
      }).not.toThrow();
    });

    it('cannot find role', () => {
      const delegator = Metadata.fromJSON(MetadataKind.Targets, targetsJson);
      const newDelegate = Metadata.fromJSON(MetadataKind.Targets, role1Json);

      expect(() => {
        delegator.verifyDelegate('wrongrole', newDelegate);
      }).toThrow('no delegation found for wrongrole');
    });
  });

  describe('unsupport metadata verification ', () => {
    it('cannot use snapshot metadata to verify', () => {
      const snapshot = Metadata.fromJSON(MetadataKind.Snapshot, snapshotJson);
      expect(() => {
        snapshot.verifyDelegate('snapshot', snapshot);
      }).toThrow('invalid metadata type');
    });

    it('cannot use timestamp metadata to verify', () => {
      const timestamp = Metadata.fromJSON(
        MetadataKind.Timestamp,
        timestampJson
      );
      expect(() => {
        timestamp.verifyDelegate('timestamp', timestamp);
      }).toThrow('invalid metadata type');
    });
  });
});
