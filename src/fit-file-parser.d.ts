// fit-file-parser não traz tipos próprios; usamos uma declaração mínima.
declare module 'fit-file-parser' {
  export default class FitParser {
    constructor(options?: Record<string, unknown>)
    parse(content: ArrayBuffer | Uint8Array, cb: (error: unknown, data: unknown) => void): void
  }
}
