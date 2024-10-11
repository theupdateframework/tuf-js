import { Metadata, MetadataKind, Root, Signature, ValueError } from '../index';

describe('Metadata', () => {
  describe('#sign', () => {
    const sig1 = new Signature({
      keyID: 'bar',
      sig: 'DEAD',
    });

    const sig2 = new Signature({
      keyID: 'foo',
      sig: 'BEEF',
    });

    const subject = new Metadata(new Root({}), { [sig1.keyID]: sig1 });

    describe('when appending a signature', () => {
      const append = true;

      it('leaves any existing signatures', () => {
        subject.sign(() => sig2, append);

        expect(subject.signatures).toHaveProperty(sig1.keyID);
        expect(subject.signatures[sig1.keyID]).toEqual(sig1);
      });

      it('adds the signature', () => {
        subject.sign(() => sig2, append);

        expect(subject.signatures).toHaveProperty(sig2.keyID);
        expect(subject.signatures[sig2.keyID]).toEqual(sig2);
      });
    });

    describe('when overriding signatures', () => {
      const append = false;

      it('deletes any existing signatures', () => {
        subject.sign(() => sig2, append);

        expect(subject.signatures).not.toHaveProperty(sig1.keyID);
      });

      it('adds the signature', () => {
        subject.sign(() => sig2, append);

        expect(subject.signatures).toHaveProperty(sig2.keyID);
        expect(subject.signatures[sig2.keyID]).toEqual(sig2);
      });
    });
  });

  describe('#fromJSON', () => {
    const json = {
      signatures: [
        {
          keyid: 'foo',
          sig: 'DEAD',
        },
      ],
      signed: {
        _type: 'root',
        version: 1,
        spec_version: '1.0.0',
        expires: '2020-01-01T00:00:00.000Z',
        consistent_snapshot: false,
        keys: {
          abc: {
            keyid_hash_algorithms: ['sha256', 'sha512'],
            keytype: 'ed25519',
            keyval: {
              public: 'foo',
            },
            scheme: 'ed25519',
          },
        },
        roles: {
          root: { keyids: ['xyz'], threshold: 1 },
          timestamp: { keyids: [], threshold: 1 },
          snapshot: { keyids: [], threshold: 1 },
          targets: { keyids: [], threshold: 1 },
        },
      },
    };

    describe('when the JSON is valid', () => {
      it('returns the expected Metadata', () => {
        const root = Metadata.fromJSON(MetadataKind.Root, json);

        expect(root.signatures).toHaveProperty('foo');
        expect(root.signed).toBeDefined();
        expect(root.signed.type).toEqual(MetadataKind.Root);
      });
    });

    describe('when the JSON contains duplicate signatures', () => {
      it('returns the expected Metadata', () => {
        expect(() => {
          Metadata.fromJSON(MetadataKind.Root, {
            ...json,
            signatures: [json.signatures[0], json.signatures[0]],
          });
        }).toThrow(ValueError);
      });
    });

    describe('when the JSON is missing the signed element', () => {
      it('returns the expected Metadata', () => {
        expect(() => {
          Metadata.fromJSON(MetadataKind.Root, {
            ...json,
            signed: '',
          });
        }).toThrow(TypeError);
      });
    });

    describe('when the JSON is contains an unknown metadata type', () => {
      it('returns the expected Metadata', () => {
        expect(() => {
          Metadata.fromJSON(MetadataKind.Root, {
            ...json,
            signed: { ...json.signed, _type: 'foo' },
          });
        }).toThrow(ValueError);
      });
    });

    describe('when the JSON is contains signatures which are not an array', () => {
      it('returns the expected Metadata', () => {
        expect(() => {
          Metadata.fromJSON(MetadataKind.Root, {
            ...json,
            signatures: 'foo',
          });
        }).toThrow(TypeError);
      });
    });
  });
});
