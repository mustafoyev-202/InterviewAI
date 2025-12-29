// Simple in-memory session storage.
// NOTE: This works well in local dev. On Vercel (serverless), sessions may not persist
// between invocations because each function runs in its own isolated environment.
export const sessions = new Map<string, any>()
