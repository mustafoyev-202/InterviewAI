import { kv } from '@vercel/kv'

// Session type used across API routes
export interface InterviewSession {
  session_id: string
  role: string
  level: string
  name: string
  age: number
  experience_years: number
  history: {
    question: string
    answer: string | null
    evaluation: any | null
    timestamp: string
  }[]
  rubric_scores: number[]
  timestamps: {
    started_at: string
    last_activity: string
  }
}

const prefix = 'session:'

export async function getSession(sessionId: string): Promise<InterviewSession | null> {
  const session = await kv.get<InterviewSession>(`${prefix}${sessionId}`)
  return session ?? null
}

export async function setSession(sessionId: string, data: InterviewSession): Promise<void> {
  await kv.set(`${prefix}${sessionId}`, data)
}

export async function updateSession(
  sessionId: string,
  updater: (current: InterviewSession) => InterviewSession
): Promise<InterviewSession | null> {
  const current = await getSession(sessionId)
  if (!current) return null
  const updated = updater(current)
  await setSession(sessionId, updated)
  return updated
}
