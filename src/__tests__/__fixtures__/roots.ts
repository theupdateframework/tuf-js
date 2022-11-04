export const roots = {
  // Example Sigstore root signed w/ ECDSA keys
  sigstore: {
    signatures: [
      {
        keyid:
          '2f64fb5eac0cf94dd39bb45308b98920055e9a0d8e012a7220787834c60aef97',
        sig: '30450221008a35d51da0f845301a5eac98ad0df00a934f59b709c1eaf81c86be734d9356f80220742942325599749800f52675f6efe124345980a2a636c0dc76f9caf9fc3123b0',
      },
      {
        keyid:
          'bdde902f5ec668179ff5ca0dabf7657109287d690bf97e230c21d65f99155c62',
        sig: '3045022100ef9157ece2a09baec1eab80adfc00b04da20b1f9a0d1b47c5dabc4506719ef2c022074f72acd57398e4ddc8c2a5040df902961e9615dca48f3fbe38cbb506e500066',
      },
      {
        keyid:
          'eaf22372f417dd618a46f6c627dbc276e9fd30a004fc94f9be946e73f8bd090b',
        sig: '30450220420fdc9a09cd069b8b15fd8db9cedf7d0dee75871bd1cfee77c926d4120a770002210097553b5ad0d6b4a13902ed37509638bb63a9009f78230cd56c802909ffbfead7',
      },
      {
        keyid:
          'f40f32044071a9365505da3d1e3be6561f6f22d0e60cf51df783999f6c3429cb',
        sig: '304502202aaf32e66f90752f658672b085ecfe45cc1ad31ee6cf5c9ad05f3267685f8d88022100b5df02acdaa371123db9d7a42219553fe079b230b168833e951be7ee56ded347',
      },
      {
        keyid:
          'f505595165a177a41750a8e864ed1719b1edfccd5a426fd2c0ffda33ce7ff209',
        sig: '304402205d420c7d05c58980c1c9f7d221f53b5334aae27a447d2a91c2ceddd685269749022039ec83e51f8e1779d7f0142dfa4a5bbecfe327fc0b91b7416090fea2416fd53a',
      },
    ],
    signed: {
      _type: 'root',
      consistent_snapshot: false,
      expires: '2021-12-18T13:28:12.99008-06:00',
      keys: {
        '2f64fb5eac0cf94dd39bb45308b98920055e9a0d8e012a7220787834c60aef97': {
          keyid_hash_algorithms: ['sha256', 'sha512'],
          keytype: 'ecdsa-sha2-nistp256',
          keyval: {
            public:
              '04cbc5cab2684160323c25cd06c3307178a6b1d1c9b949328453ae473c5ba7527e35b13f298b41633382241f3fd8526c262d43b45adee5c618fa0642c82b8a9803',
          },
          scheme: 'ecdsa-sha2-nistp256',
        },
        bdde902f5ec668179ff5ca0dabf7657109287d690bf97e230c21d65f99155c62: {
          keyid_hash_algorithms: ['sha256', 'sha512'],
          keytype: 'ecdsa-sha2-nistp256',
          keyval: {
            public:
              '04a71aacd835dc170ba6db3fa33a1a33dee751d4f8b0217b805b9bd3242921ee93672fdcfd840576c5bb0dc0ed815edf394c1ee48c2b5e02485e59bfc512f3adc7',
          },
          scheme: 'ecdsa-sha2-nistp256',
        },
        eaf22372f417dd618a46f6c627dbc276e9fd30a004fc94f9be946e73f8bd090b: {
          keyid_hash_algorithms: ['sha256', 'sha512'],
          keytype: 'ecdsa-sha2-nistp256',
          keyval: {
            public:
              '04117b33dd265715bf23315e368faa499728db8d1f0a377070a1c7b1aba2cc21be6ab1628e42f2cdd7a35479f2dce07b303a8ba646c55569a8d2a504ba7e86e447',
          },
          scheme: 'ecdsa-sha2-nistp256',
        },
        f40f32044071a9365505da3d1e3be6561f6f22d0e60cf51df783999f6c3429cb: {
          keyid_hash_algorithms: ['sha256', 'sha512'],
          keytype: 'ecdsa-sha2-nistp256',
          keyval: {
            public:
              '04cc1cd53a61c23e88cc54b488dfae168a257c34fac3e88811c55962b24cffbfecb724447999c54670e365883716302e49da57c79a33cd3e16f81fbc66f0bcdf48',
          },
          scheme: 'ecdsa-sha2-nistp256',
        },
        f505595165a177a41750a8e864ed1719b1edfccd5a426fd2c0ffda33ce7ff209: {
          keyid_hash_algorithms: ['sha256', 'sha512'],
          keytype: 'ecdsa-sha2-nistp256',
          keyval: {
            public:
              '048a78a44ac01099890d787e5e62afc29c8ccb69a70ec6549a6b04033b0a8acbfb42ab1ab9c713d225cdb52b858886cf46c8e90a7f3b9e6371882f370c259e1c5b',
          },
          scheme: 'ecdsa-sha2-nistp256',
        },
      },
      roles: {
        root: {
          keyids: [
            '2f64fb5eac0cf94dd39bb45308b98920055e9a0d8e012a7220787834c60aef97',
            'bdde902f5ec668179ff5ca0dabf7657109287d690bf97e230c21d65f99155c62',
            'eaf22372f417dd618a46f6c627dbc276e9fd30a004fc94f9be946e73f8bd090b',
            'f40f32044071a9365505da3d1e3be6561f6f22d0e60cf51df783999f6c3429cb',
            'f505595165a177a41750a8e864ed1719b1edfccd5a426fd2c0ffda33ce7ff209',
          ],
          threshold: 3,
        },
        snapshot: {
          keyids: [
            '2f64fb5eac0cf94dd39bb45308b98920055e9a0d8e012a7220787834c60aef97',
            'bdde902f5ec668179ff5ca0dabf7657109287d690bf97e230c21d65f99155c62',
            'eaf22372f417dd618a46f6c627dbc276e9fd30a004fc94f9be946e73f8bd090b',
            'f40f32044071a9365505da3d1e3be6561f6f22d0e60cf51df783999f6c3429cb',
            'f505595165a177a41750a8e864ed1719b1edfccd5a426fd2c0ffda33ce7ff209',
          ],
          threshold: 3,
        },
        targets: {
          keyids: [
            '2f64fb5eac0cf94dd39bb45308b98920055e9a0d8e012a7220787834c60aef97',
            'bdde902f5ec668179ff5ca0dabf7657109287d690bf97e230c21d65f99155c62',
            'eaf22372f417dd618a46f6c627dbc276e9fd30a004fc94f9be946e73f8bd090b',
            'f40f32044071a9365505da3d1e3be6561f6f22d0e60cf51df783999f6c3429cb',
            'f505595165a177a41750a8e864ed1719b1edfccd5a426fd2c0ffda33ce7ff209',
          ],
          threshold: 3,
        },
        timestamp: {
          keyids: [
            '2f64fb5eac0cf94dd39bb45308b98920055e9a0d8e012a7220787834c60aef97',
            'bdde902f5ec668179ff5ca0dabf7657109287d690bf97e230c21d65f99155c62',
            'eaf22372f417dd618a46f6c627dbc276e9fd30a004fc94f9be946e73f8bd090b',
            'f40f32044071a9365505da3d1e3be6561f6f22d0e60cf51df783999f6c3429cb',
            'f505595165a177a41750a8e864ed1719b1edfccd5a426fd2c0ffda33ce7ff209',
          ],
          threshold: 3,
        },
      },
      spec_version: '1.0',
      version: 1,
    },
  },

  pythonSample: {
    signatures: [
      {
        keyid:
          '4e777de0d275f9d28588dd9a1606cc748e548f9e22b6795b7cb3f63f98035fcb',
        sig: 'a337d6375fedd2eabfcd6c2ef6c8a9c3bb85dc5a857715f6a6bd41123e7670c4972d8548bcd7248154f3d864bf25f1823af59d74c459f41ea09a02db057ca1245612ebbdb97e782c501dc3e094f7fa8aa1402b03c6ed0635f565e2a26f9f543a89237e15a2faf0c267e2b34c3c38f2a43a28ddcdaf8308a12ead8c6dc47d1b762de313e9ddda8cc5bc25aea1b69d0e5b9199ca02f5dda48c3bff615fd12a7136d00634b9abc6e75c3256106c4d6f12e6c43f6195071355b2857bbe377ce028619b58837696b805040ce144b393d50a472531f430fadfb68d3081b6a8b5e49337e328c9a0a3f11e80b0bc8eb2dc6e78d1451dd857e6e6e6363c3fd14c590aa95e083c9bfc77724d78af86eb7a7ef635eeddaa353030c79f66b3ba9ea11fab456cfe896a826fdfb50a43cd444f762821aada9bcd7b022c0ee85b8768f960343d5a1d3d76374cc0ac9e12a500de0bf5d48569e5398cadadadab045931c398e3bcb6cec88af2437ba91959f956079cbed159fed3938016e6c3b5e446131f81cc5981',
      },
    ],
    signed: {
      _type: 'root',
      consistent_snapshot: false,
      expires: '2030-01-01T00:00:00Z',
      keys: {
        '4e777de0d275f9d28588dd9a1606cc748e548f9e22b6795b7cb3f63f98035fcb': {
          keyid_hash_algorithms: ['sha256', 'sha512'],
          keytype: 'rsa',
          keyval: {
            public:
              '-----BEGIN PUBLIC KEY-----\nMIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEA0GjPoVrjS9eCqzoQ8VRe\nPkC0cI6ktiEgqPfHESFzyxyjC490Cuy19nuxPcJuZfN64MC48oOkR+W2mq4pM51i\nxmdG5xjvNOBRkJ5wUCc8fDCltMUTBlqt9y5eLsf/4/EoBU+zC4SW1iPU++mCsity\nfQQ7U6LOn3EYCyrkH51hZ/dvKC4o9TPYMVxNecJ3CL1q02Q145JlyjBTuM3Xdqsa\nndTHoXSRPmmzgB/1dL/c4QjMnCowrKW06mFLq9RAYGIaJWfM/0CbrOJpVDkATmEc\nMdpGJYDfW/sRQvRdlHNPo24ZW7vkQUCqdRxvnTWkK5U81y7RtjLt1yskbWXBIbOV\nz94GXsgyzANyCT9qRjHXDDz2mkLq+9I2iKtEqaEePcWRu3H6RLahpM/TxFzw684Y\nR47weXdDecPNxWyiWiyMGStRFP4Cg9trcwAGnEm1w8R2ggmWphznCd5dXGhPNjfA\na82yNFY8ubnOUVJOf0nXGg3Edw9iY3xyjJb2+nrsk5f3AgMBAAE=\n-----END PUBLIC KEY-----',
          },
          scheme: 'rsassa-pss-sha256',
        },
        '59a4df8af818e9ed7abe0764c0b47b4240952aa0d179b5b78346c470ac30278d': {
          keyid_hash_algorithms: ['sha256', 'sha512'],
          keytype: 'ed25519',
          keyval: {
            public:
              'edcd0a32a07dce33f7c7873aaffbff36d20ea30787574ead335eefd337e4dacd',
          },
          scheme: 'ed25519',
        },
        '65171251a9aff5a8b3143a813481cb07f6e0de4eb197c767837fe4491b739093': {
          keyid_hash_algorithms: ['sha256', 'sha512'],
          keytype: 'ed25519',
          keyval: {
            public:
              '89f28bd4ede5ec3786ab923fd154f39588d20881903e69c7b08fb504c6750815',
          },
          scheme: 'ed25519',
        },
        '8a1c4a3ac2d515dec982ba9910c5fd79b91ae57f625b9cff25d06bf0a61c1758': {
          keyid_hash_algorithms: ['sha256', 'sha512'],
          keytype: 'ed25519',
          keyval: {
            public:
              '82ccf6ac47298ff43bfa0cd639868894e305a99c723ff0515ae2e9856eb5bbf4',
          },
          scheme: 'ed25519',
        },
      },
      roles: {
        root: {
          keyids: [
            '4e777de0d275f9d28588dd9a1606cc748e548f9e22b6795b7cb3f63f98035fcb',
          ],
          threshold: 1,
        },
        snapshot: {
          keyids: [
            '59a4df8af818e9ed7abe0764c0b47b4240952aa0d179b5b78346c470ac30278d',
          ],
          threshold: 1,
        },
        targets: {
          keyids: [
            '65171251a9aff5a8b3143a813481cb07f6e0de4eb197c767837fe4491b739093',
          ],
          threshold: 1,
        },
        timestamp: {
          keyids: [
            '8a1c4a3ac2d515dec982ba9910c5fd79b91ae57f625b9cff25d06bf0a61c1758',
          ],
          threshold: 1,
        },
      },
      spec_version: '1.0.0',
      version: 1,
    },
  },
};
