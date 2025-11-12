declare module "@garmin/fitsdk" {
  export class Stream {
    static fromByteArray(bytes: Array<number>): Stream;
  }

  export class Decoder {
    constructor(stream: Stream);
    read(): {
      messages: Record<string, unknown>;
      errors: Array<string>;
    };
  }

  export class Encoder {
    write(message: unknown): void;
    finish(): Array<number>;
  }
}
