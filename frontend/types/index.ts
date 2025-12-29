export type InterviewState = 'start' | 'interview' | 'results'

export interface TranscriptItem {
  speaker: 'Interviewer' | 'You'
  text: string
}

export interface Evaluation {
  score: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  missing_topics: string[]
  followup_intent: 'deepen' | 'clarify' | 'simplify' | 'next_topic'
}

export interface RubricItem {
  category: string
  score: number
  notes: string
}

export interface FinalReport {
  overall_score: number
  summary: string
  rubric_breakdown: RubricItem[]
  next_steps: string[]
}

export interface StartSessionResponse {
  session_id: string
  first_question_text: string
  interviewer_audio_url_or_base64: string
}

export interface AnswerResponse {
  followup_question_text: string
  evaluation: Evaluation
  interviewer_audio_url_or_base64: string
}

export interface EndSessionResponse {
  final_report: FinalReport
  interviewer_audio_url_or_base64: string
}
