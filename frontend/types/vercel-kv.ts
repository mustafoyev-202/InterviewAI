declare module '@vercel/kv' {
  // Minimal typing to satisfy TypeScript in this project.
  // At runtime, the real '@vercel/kv' package will be used.
  export const kv: {
    get<T = any>(key: string): Promise<T | null>
    set(key: string, value: any): Promise<void>
  }
}

