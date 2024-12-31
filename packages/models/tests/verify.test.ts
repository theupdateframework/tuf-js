import { Metadata, MetadataKind, ValueError } from '../src/index';
import { JSONObject } from '../src/utils';

/* eslint-disable @typescript-eslint/no-require-imports */
const rootJSON = require('./__fixtures__/root.json') as JSONObject;
const timestampJSON = require('./__fixtures__/timestamp.json') as JSONObject;
const snapshotJSON = require('./__fixtures__/snapshot.json') as JSONObject;
const targetsJSON = require('./__fixtures__/targets.json') as JSONObject;
const role1JSON = require('./__fixtures__/role1.json') as JSONObject;
/* eslint-enable @typescript-eslint/no-require-imports */

describe('Verify TUF local sample', () => {
  const root = Metadata.fromJSON(MetadataKind.Root, rootJSON);
  const timestamp = Metadata.fromJSON(MetadataKind.Timestamp, timestampJSON);

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
      const delegator = Metadata.fromJSON(MetadataKind.Targets, targetsJSON);
      const newDelegate = Metadata.fromJSON(MetadataKind.Targets, role1JSON);

      expect(() => {
        delegator.verifyDelegate('role1', newDelegate);
      }).not.toThrow();
    });

    it('cannot find role', () => {
      const delegator = Metadata.fromJSON(MetadataKind.Targets, targetsJSON);
      const newDelegate = Metadata.fromJSON(MetadataKind.Targets, role1JSON);

      expect(() => {
        delegator.verifyDelegate('wrongrole', newDelegate);
      }).toThrow(ValueError);
    });
  });

  describe('unsupport metadata verification ', () => {
    it('cannot use snapshot metadata to verify', () => {
      const snapshot = Metadata.fromJSON(MetadataKind.Snapshot, snapshotJSON);
      expect(() => {
        snapshot.verifyDelegate('snapshot', snapshot);
      }).toThrow(TypeError);
    });

    it('cannot use timestamp metadata to verify', () => {
      const timestamp = Metadata.fromJSON(
        MetadataKind.Timestamp,
        timestampJSON
      );
      expect(() => {
        timestamp.verifyDelegate('timestamp', timestamp);
      }).toThrow(TypeError);
    });
  });
});
