import { v4 as uuidv4 } from 'uuid'
import {
  generateQuestion,
  evaluateAnswer,
  generateFollowupQuestion,
  generateFinalReport,
} from './gemini'
import { textToSpeechBase64 } from './elevenlabs'

export async function startInterview(
  role: string,
  level: string,
  name: string,
  age: number,
  experienceYears: number
): Promise<{
  session_id: string
  first_question_text: string
  interviewer_audio_url_or_base64: string
  started_at: string
}> {
  const sessionId = uuidv4()
  const timestamp = new Date().toISOString()

  const firstQuestion = await generateQuestion(
    role,
    level,
    1,
    null,
    name,
    age,
    experienceYears
  )

  let audioBase64 = ''
  try {
    audioBase64 = await textToSpeechBase64(firstQuestion)
  } catch (error) {
    console.warn('Audio generation failed, continuing without audio:', error)
  }

  return {
    session_id: sessionId,
    first_question_text: firstQuestion,
    interviewer_audio_url_or_base64: audioBase64,
    started_at: timestamp,
  }
}

export async function processAnswer(
  sessionId: string,
  question: string,
  answer: string,
  role: string,
  level: string,
  history: any[],
  candidateName?: string,
  candidateAge?: number,
  experienceYears?: number
): Promise<{
  followup_question_text: string
  evaluation: any
  interviewer_audio_url_or_base64: string
  timestamp: string
}> {
  const evaluation = await evaluateAnswer(
    question,
    answer,
    role,
    level,
    history,
    candidateName,
    candidateAge,
    experienceYears
  )

  const followupQuestion = await generateFollowupQuestion(
    question,
    answer,
    evaluation,
    role,
    level,
    history,
    candidateName,
    candidateAge,
    experienceYears
  )

  let audioBase64 = ''
  try {
    audioBase64 = await textToSpeechBase64(followupQuestion)
  } catch (error) {
    console.warn('Audio generation failed, continuing without audio:', error)
  }

  const timestamp = new Date().toISOString()

  return {
    followup_question_text: followupQuestion,
    evaluation,
    interviewer_audio_url_or_base64: audioBase64,
    timestamp,
  }
}

export async function endInterview(
  sessionId: string,
  role: string,
  level: string,
  history: any[],
  rubricScores: number[]
): Promise<any> {
  const finalReport = await generateFinalReport(role, level, history, rubricScores)
  return finalReport
}
