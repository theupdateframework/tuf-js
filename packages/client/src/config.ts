export type Config = {
  maxRootRotations: number;
  maxDelegations: number;
  rootMaxLength: number;
  timestampMaxLength: number;
  snapshotMaxLength: number;
  targetsMaxLength: number;
  prefixTargetsWithHash: boolean;
  fetchTimeout: number;
};

export const defaultConfig: Config = {
  maxRootRotations: 256,
  maxDelegations: 32,
  rootMaxLength: 512000, //bytes
  timestampMaxLength: 16384, // bytes
  snapshotMaxLength: 2000000, // bytes
  targetsMaxLength: 5000000, // bytes
  prefixTargetsWithHash: true,
  fetchTimeout: 100000, // milliseconds
};
