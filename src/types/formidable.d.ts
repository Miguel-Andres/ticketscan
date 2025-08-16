declare module 'formidable' {
  import { IncomingMessage } from 'http';

  namespace formidable {
    interface File {
      filepath: string;
      originalFilename: string | null;
      newFilename: string;
      mimetype: string | null;
      size: number;
      hashAlgorithm: false | 'sha1' | 'md5' | 'sha256';
      hash: string | null;
    }

    interface Part {
      name: string;
      mimetype?: string;
      filename?: string;
    }

    interface Options {
      uploadDir?: string;
      keepExtensions?: boolean;
      maxFileSize?: number;
      maxFieldsSize?: number;
      maxFields?: number;
      allowEmptyFiles?: boolean;
      multiples?: boolean;
      filter?: (part: Part) => boolean;
      [key: string]: any;
    }

    interface Formidable {
      parse(req: IncomingMessage): Promise<[fields: { [key: string]: string[] }, files: { [key: string]: File[] }]>;
    }
  }

  function formidable(options?: formidable.Options): formidable.Formidable;

  export = formidable;
}
