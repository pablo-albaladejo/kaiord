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
    writeMesg(message: unknown): void;
    close(): Array<number>;
  }

  export const Profile: {
    types: {
      manufacturer: Record<number, string>;
      [key: string]: Record<number, string> | unknown;
    };
    [key: string]: unknown;
  };
}
