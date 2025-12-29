'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import StartSection from '@/components/StartSection'
import InterviewSection from '@/components/InterviewSection'
import ResultsSection from '@/components/ResultsSection'
import { InterviewState, Evaluation, FinalReport, TranscriptItem } from '@/types'

export default function Home() {
  const [state, setState] = useState<InterviewState>('start')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptItem[]>([])
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleStartInterview = (newSessionId: string, firstQuestion: string) => {
    setSessionId(newSessionId)
    setCurrentQuestion(firstQuestion)
    setTranscript([{ speaker: 'Interviewer', text: firstQuestion }])
    setState('interview')
    setEvaluation(null)
    setFinalReport(null)
  }

  const handleAnswerSubmitted = (followupQuestion: string, newEvaluation: Evaluation) => {
    setCurrentQuestion(followupQuestion)
    setEvaluation(newEvaluation)
    setTranscript(prev => [
      ...prev,
      { speaker: 'Interviewer', text: followupQuestion }
    ])
  }

  const handleAddAnswerToTranscript = (answer: string) => {
    setTranscript(prev => [
      ...prev,
      { speaker: 'You', text: answer }
    ])
  }

  const handleEndInterview = (report: FinalReport) => {
    setFinalReport(report)
    setState('results')
  }

  const handleReset = () => {
    setState('start')
    setSessionId(null)
    setCurrentQuestion(null)
    setTranscript([])
    setEvaluation(null)
    setFinalReport(null)
    setIsProcessing(false)
  }

  return (
    <>
      <Navbar currentState={state} onReset={handleReset} />
      <div className="container">
        <main>
          {state === 'start' && (
            <StartSection
              onStartInterview={handleStartInterview}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          )}

          {state === 'interview' && sessionId && currentQuestion && (
            <InterviewSection
              sessionId={sessionId}
              currentQuestion={currentQuestion}
              transcript={transcript}
              evaluation={evaluation}
              onAnswerSubmitted={handleAnswerSubmitted}
              onAddAnswerToTranscript={handleAddAnswerToTranscript}
              onEndInterview={handleEndInterview}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          )}

          {state === 'results' && finalReport && (
            <ResultsSection
              finalReport={finalReport}
              onReset={handleReset}
            />
          )}
        </main>

        <footer>
          <p>Powered by ElevenLabs & Google Gemini</p>
        </footer>
      </div>
    </>
  )
}
