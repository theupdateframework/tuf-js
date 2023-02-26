import { collectTargets } from '../target';

describe('collectTargets', () => {
  it('collects targets', () => {
    const targets = [
      {
        name: 'foo.txt',
        content: 'hello, world!',
      },
      {
        name: 'bar.txt',
        content: 'hello, world!',
      },
    ];

    const targetFiles = collectTargets(targets);
    expect(targetFiles).toHaveLength(2);

    expect(targetFiles[0].path).toEqual(targets[0].name);
    expect(targetFiles[0].length).toEqual(targets[0].content.length);
    expect(targetFiles[0].hashes).toHaveProperty('sha256');
    expect(targetFiles[0].hashes['sha256']).toBeTruthy();

    expect(targetFiles[1].path).toEqual(targets[1].name);
    expect(targetFiles[1].length).toEqual(targets[1].content.length);
    expect(targetFiles[1].hashes).toHaveProperty('sha256');
    expect(targetFiles[1].hashes['sha256']).toBeTruthy();
  });
});
