import { NextRequest, NextResponse } from 'next/server'
import { endInterview } from '../../../../../lib/interview-engine'
import { textToSpeechBase64 } from '../../../../../lib/elevenlabs'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } } // kept for route shape, but not used for state
) {
  try {
    const sessionId = params.sessionId
    const body = await request.json()
    const { role, level } = body

    if (!role || !level) {
      return NextResponse.json(
        { detail: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Stateless: no history or rubric scores available, so pass empty arrays.
    const finalReport = await endInterview(
      sessionId,
      role,
      level,
      [],
      []
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
