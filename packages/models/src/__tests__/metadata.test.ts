import { Metadata, Root, Signature } from '../index';

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

    const subject = new Metadata(
      new Root({ version: 1, specVersion: '1.0.0', expires: '' }),
      { [sig1.keyID]: sig1 }
    );

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
});
