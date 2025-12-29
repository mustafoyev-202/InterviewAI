import { NextRequest, NextResponse } from 'next/server'
import { endInterview } from '../../../../../lib/interview-engine'
import { textToSpeechBase64 } from '../../../../../lib/elevenlabs'
import { sessions } from '../../../../../lib/sessions'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId

    if (!sessions.has(sessionId)) {
      return NextResponse.json(
        { detail: 'Session not found' },
        { status: 404 }
      )
    }

    const session = sessions.get(sessionId)

    const finalReport = await endInterview(
      sessionId,
      session.role,
      session.level,
      session.history,
      session.rubric_scores
    )

    const closingText = `Thank you for the interview. Your overall score is ${finalReport.overall_score.toFixed(1)} out of 10. ${finalReport.summary}`

    let closingAudio = ''
    try {
      closingAudio = await textToSpeechBase64(closingText)
    } catch (error) {
      console.warn('Closing audio generation failed:', error)
    }

    return NextResponse.json({
      final_report: finalReport,
      interviewer_audio_url_or_base64: closingAudio,
    })
  } catch (error: any) {
    console.error('Error ending session:', error)
    return NextResponse.json(
      { detail: `Failed to end interview: ${error.message}` },
      { status: 500 }
    )
  }
}
