// Node.js 22+ yerleşik SQLite modülü için tip tanımı
// (TypeScript henüz bu modülü tanımıyor, build'in geçmesi için minimal tanım)
declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(path: string, options?: { open?: boolean })
    exec(sql: string): void
    prepare(sql: string): StatementSync
    close(): void
  }

  export class StatementSync {
    run(...params: any[]): { changes: number; lastInsertRowid: number | bigint }
    get(...params: any[]): any
    all(...params: any[]): any[]
  }
}
