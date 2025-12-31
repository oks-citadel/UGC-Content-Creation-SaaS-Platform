declare module 'json2csv' {
  export interface ParserOptions<T = any> {
    fields?: string[];
    transforms?: Array<(item: T) => T>;
    formatters?: Record<string, (value: any) => string>;
    defaultValue?: string;
    delimiter?: string;
    eol?: string;
    header?: boolean;
    includeEmptyRows?: boolean;
    withBOM?: boolean;
  }

  export class Parser<T = any> {
    constructor(opts?: ParserOptions<T>);
    parse(data: T | T[]): string;
  }
}
