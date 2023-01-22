const stream = new WritableStream({
  write(chunk) {
    return new Promise(resolve => {
      console.log(chunk);
      resolve();
    });
  }
});

let readerController: ReadableStreamDefaultController;

const reader = new ReadableStream({
  start(controller) {
    readerController = controller;
  }
});

(async () => reader.pipeTo(stream))();

export type LogVerbosity = 'log' | 'warning' | 'error';

export function log<T extends string>(
  category: T,
  verbosity: LogVerbosity,
  message: string,
  ...args: unknown[]
) {
  readerController.enqueue(`[${category}] [${verbosity}] ${message}`);
}
