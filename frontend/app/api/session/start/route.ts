import { NextRequest, NextResponse } from 'next/server'
import { startInterview } from '../../../../lib/interview-engine'
import { sessions } from '../../../../lib/sessions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { role, level, name, age, experience_years } = body

    if (!role || !level || !name || !age || !experience_years) {
      return NextResponse.json(
        { detail: 'Missing required fields' },
        { status: 400 }
      )
    }

    const sessionData = await startInterview(role, level, name, age, experience_years)

    sessions.set(sessionData.session_id, {
      session_id: sessionData.session_id,
      role,
      level,
      name,
      age,
      experience_years,
      history: [{
        question: sessionData.first_question_text,
        answer: null,
        evaluation: null,
        timestamp: sessionData.started_at,
      }],
      rubric_scores: [],
      timestamps: {
        started_at: sessionData.started_at,
        last_activity: sessionData.started_at,
      },
    })

    return NextResponse.json({
      session_id: sessionData.session_id,
      first_question_text: sessionData.first_question_text,
      interviewer_audio_url_or_base64: sessionData.interviewer_audio_url_or_base64,
    })
  } catch (error: any) {
    console.error('Error starting session:', error)
    return NextResponse.json(
      { detail: `Failed to start interview session: ${error.message}` },
      { status: 500 }
    )
  }
}
