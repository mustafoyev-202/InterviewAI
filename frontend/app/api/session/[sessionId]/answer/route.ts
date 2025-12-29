import { NextRequest, NextResponse } from 'next/server'
import { processAnswer } from '../../../../../lib/interview-engine'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } } // kept for route shape, but not used for state
) {
  try {
    const sessionId = params.sessionId
    const body = await request.json()
    const { answer_text, question, role, level } = body

    if (!answer_text || !question || !role || !level) {
      return NextResponse.json(
        { detail: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await processAnswer(
      sessionId,
      question,
      answer_text,
      role,
      level,
      null,
      undefined,
      undefined,
      undefined
    )

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
