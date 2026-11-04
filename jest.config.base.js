module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    'node_modules.*\\.[cm]?js$': [
      'babel-jest',
      {
        plugins: [
          '@babel/plugin-transform-modules-commonjs',
          'babel-plugin-transform-import-meta',
        ],
      },
    ],
  },
  // Nock and these dependencies are ESM, but Jest runs the tests as CommonJS.
  transformIgnorePatterns: [
    '/node_modules/(?!(nock|@mswjs/interceptors|@open-draft/until|rettime)/)',
  ],
};
