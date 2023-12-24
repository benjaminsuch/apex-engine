import { readFile } from 'node:fs';
import { resolve } from 'node:path';

export function readFileFromContentBase(
  contentBase: string,
  urlPath: string,
  callback: (err: NodeJS.ErrnoException | null, data: Buffer, filePath: string) => void
) {
  let filePath = resolve(contentBase, '.' + urlPath);

  if (urlPath.endsWith('/')) {
    filePath = resolve(filePath, 'index.html');
  }

  readFile(filePath, (error, content) => {
    callback(error, content, filePath);
  });
}
