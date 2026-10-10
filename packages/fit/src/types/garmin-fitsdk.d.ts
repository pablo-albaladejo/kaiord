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

  export type ProfileSubField = {
    name: string;
    scale: number;
    offset: number;
    map: Array<{ name: string; value: number }>;
  };

  export type ProfileField = {
    num: number;
    name: string;
    type: string;
    subFields: Array<ProfileSubField>;
  };

  export const Profile: {
    messages: Partial<Record<number, { fields: Record<number, ProfileField> }>>;
    types: {
      manufacturer: Record<number, string>;
      swimStroke: Record<number, string>;
      [key: string]: Record<number, string> | unknown;
    };
    [key: string]: unknown;
  };
}
