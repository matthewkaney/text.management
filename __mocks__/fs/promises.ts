export function __resolveWrite(path: string) {}

const readResolutions: Map<string, (content: string) => void> = new Map();

export function readFile(path: string) {
  return new Promise<string>((resolve) => {
    readResolutions.set(path, resolve);
  });
}

export function __resolveRead(path: string, content: string) {
  const resolution = readResolutions.get(path);

  if (!resolution) throw Error("Read did not happen");

  resolution(content);
  readResolutions.delete(path);
}

export function writeFile(path: string, content: string) {}
