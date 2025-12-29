// In-memory session storage
// In production, you might want to use Redis or a database
export const sessions = new Map<string, any>()
