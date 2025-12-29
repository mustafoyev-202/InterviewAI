import { NextRequest, NextResponse } from 'next/server'
import { processAnswer } from '../../../../../lib/interview-engine'
import { getSession, setSession, InterviewSession } from '../../../../../lib/sessions'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    const body = await request.json()
    const { answer_text } = body

    const session = await getSession(sessionId)

    if (!session) {
      return NextResponse.json(
        { detail: 'Session not found' },
        { status: 404 }
      )
    }

    if (!session.history || session.history.length === 0) {
      return NextResponse.json(
        { detail: 'No question found in session' },
        { status: 400 }
      )
    }

    let currentQuestionItem: InterviewSession['history'][number] | null = null
    for (let i = session.history.length - 1; i >= 0; i--) {
      if (session.history[i].answer === null) {
        currentQuestionItem = session.history[i]
        break
      }
    }

    if (!currentQuestionItem) {
      return NextResponse.json(
        { detail: 'No unanswered question found in session' },
        { status: 400 }
      )
    }

    const currentQuestion = currentQuestionItem.question

    const result = await processAnswer(
      sessionId,
      currentQuestion,
      answer_text,
      session.role,
      session.level,
      session.history,
      session.name,
      session.age,
      session.experience_years
    )

    // Update session state
    currentQuestionItem.answer = answer_text
    currentQuestionItem.evaluation = result.evaluation
    currentQuestionItem.timestamp = result.timestamp

    session.history.push({
      question: result.followup_question_text,
      answer: null,
      evaluation: null,
      timestamp: result.timestamp,
    })

    session.rubric_scores.push(result.evaluation.score)
    session.timestamps.last_activity = result.timestamp

    await setSession(sessionId, session)

    return NextResponse.json({
      followup_question_text: result.followup_question_text,
      evaluation: result.evaluation,
      interviewer_audio_url_or_base64: result.interviewer_audio_url_or_base64,
    })
  } catch (error: any) {
    console.error('Error processing answer:', error)
    return NextResponse.json(
      { detail: `Failed to process answer: ${error.message}` },
      { status: 500 }
    )
  }
}
