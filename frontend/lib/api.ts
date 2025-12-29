import { StartSessionResponse, AnswerResponse, EndSessionResponse } from '../types'

const API_BASE_URL = '/api'

export async function startSession(
  role: string, 
  level: string, 
  name: string, 
  age: number, 
  experienceYears: number
): Promise<StartSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/session/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      role, 
      level, 
      name, 
      age, 
      experience_years: experienceYears 
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to start interview')
  }

  return response.json()
}

export async function submitAnswer(
  sessionId: string,
  answerText: string,
  question: string,
  role: string,
  level: string
): Promise<AnswerResponse> {
  const response = await fetch(`${API_BASE_URL}/session/${sessionId}/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ answer_text: answerText, question, role, level }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to submit answer')
  }

  return response.json()
}

export async function endSession(
  sessionId: string,
  role: string,
  level: string
): Promise<EndSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/session/${sessionId}/end`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role, level }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to end interview')
  }

  return response.json()
}

export function playAudio(audioBase64: string): void {
  try {
    if (audioBase64.startsWith('http://') || audioBase64.startsWith('https://')) {
      const audio = new Audio(audioBase64)
      audio.play().catch(err => {
        console.error('Error playing audio URL:', err)
      })
    } else {
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`)
      audio.play().catch(err => {
        console.error('Error playing base64 audio:', err)
      })
    }
  } catch (error) {
    console.error('Error creating audio element:', error)
  }
}
