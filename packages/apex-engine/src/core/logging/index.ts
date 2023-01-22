import { NodeReadableStream, WebReadableStream } from '../stream/ReadableStream';
import { WritableStream } from '../stream/WritableStream';

const writeStream = new WritableStream({
  write(chunk) {
    return new Promise(resolve => {
      console.log(chunk);
      resolve();
    });
  }
});

let readerController: ReadableStreamDefaultController;
let readStream!: InstanceType<typeof WebReadableStream | typeof NodeReadableStream>;

if (IS_SERVER) {
  readStream = new NodeReadableStream({
    start(controller) {
      readerController = controller;
    }
  });
}

if (IS_CLIENT) {
  readStream = new WebReadableStream({
    start(controller) {
      readerController = controller;
    }
  });
}

(async () => readStream.pipeTo(writeStream))();

export type LogVerbosity = 'log' | 'warning' | 'error';

export function log<T extends string>(
  category: T,
  verbosity: LogVerbosity,
  message: string,
  ...args: unknown[]
) {
  readerController.enqueue(`[${category}] [${verbosity}] ${message}`);
}
