'use client'

import { useState, useRef, useEffect } from 'react'
import { submitAnswer, endSession, playAudio } from '@/lib/api'
import { AnswerResponse, EndSessionResponse, TranscriptItem, Evaluation, FinalReport } from '@/types'
import { SpeechRecognitionManager } from '@/lib/speechRecognition'

interface InterviewSectionProps {
  sessionId: string
  currentQuestion: string
  transcript: TranscriptItem[]
  evaluation: Evaluation | null
  onAnswerSubmitted: (followupQuestion: string, evaluation: Evaluation) => void
  onAddAnswerToTranscript: (answer: string) => void
  onEndInterview: (report: FinalReport) => void
  isProcessing: boolean
  setIsProcessing: (value: boolean) => void
}

export default function InterviewSection({
  sessionId,
  currentQuestion,
  transcript,
  evaluation,
  onAnswerSubmitted,
  onAddAnswerToTranscript,
  onEndInterview,
  isProcessing,
  setIsProcessing,
}: InterviewSectionProps) {
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [interimTranscript, setInterimTranscript] = useState('')
  const answerInputRef = useRef<HTMLTextAreaElement>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const speechRecognitionRef = useRef<SpeechRecognitionManager | null>(null)

  useEffect(() => {
    answerInputRef.current?.focus()
    
    // Initialize speech recognition
    speechRecognitionRef.current = new SpeechRecognitionManager(
      (transcript, isFinal) => {
        if (isFinal && transcript.trim()) {
          setAnswer(prev => {
            const current = prev.replace(/\s+\|.*$/, '')
            return (current + ' ' + transcript).trim()
          })
          setInterimTranscript('')
        } else {
          setInterimTranscript(transcript)
        }
      },
      (state) => {
        setIsListening(state.isListening)
        setSpeechError(state.error)
      }
    )

    // Cleanup on unmount
    return () => {
      speechRecognitionRef.current?.cleanup()
    }
  }, [])

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  const handleSubmitAnswer = async () => {
    const finalAnswer = answer.replace(/\s+\|.*$/, '').trim()
    
    if (!finalAnswer) {
      setError('Please enter an answer')
      return
    }

    if (isProcessing) {
      return
    }

    try {
      setIsProcessing(true)
      setError(null)

      // Add answer to transcript immediately
      onAddAnswerToTranscript(finalAnswer)
      setAnswer('')
      setInterimTranscript('')

      const data: AnswerResponse = await submitAnswer(sessionId, finalAnswer)

      // Show evaluation
      onAnswerSubmitted(data.followup_question_text, data.evaluation)

      // Play ElevenLabs audio if available
      if (data.interviewer_audio_url_or_base64) {
        playAudio(data.interviewer_audio_url_or_base64)
      }

      answerInputRef.current?.focus()
    } catch (err) {
      console.error('Error submitting answer:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit answer. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEndInterview = async () => {
    try {
      setIsProcessing(true)
      setError(null)

      const data: EndSessionResponse = await endSession(sessionId)

      // Play closing audio if available
      if (data.interviewer_audio_url_or_base64) {
        playAudio(data.interviewer_audio_url_or_base64)
      }

      onEndInterview(data.final_report)
    } catch (err) {
      console.error('Error ending interview:', err)
      setError(err instanceof Error ? err.message : 'Failed to end interview')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSubmitAnswer()
    }
  }

  const handleStartListening = () => {
    try {
      setError(null)
      setSpeechError(null)
      speechRecognitionRef.current?.start()
    } catch (err) {
      console.error('Error starting speech recognition:', err)
      setError(err instanceof Error ? err.message : 'Failed to start speech recognition. Please check microphone permissions.')
    }
  }

  const handleStopListening = () => {
    try {
      speechRecognitionRef.current?.stop()
      const finalTranscript = speechRecognitionRef.current?.getTranscript() || ''
      if (finalTranscript) {
        setAnswer(finalTranscript)
      }
      setInterimTranscript('')
      answerInputRef.current?.focus()
    } catch (err) {
      console.error('Error stopping speech recognition:', err)
    }
  }

  return (
    <div className="section">
      <div className="question-panel">
        <h2>Current Question</h2>
        <div className="question-text">{currentQuestion}</div>
      </div>

      <div className="answer-panel">
        <h3>Your Answer</h3>
        
        {/* Real-time Speech Recognition Controls */}
        <div className="voice-recording-controls">
          {!isListening && (
            <button
              type="button"
              className="btn btn-voice"
              onClick={handleStartListening}
              disabled={isProcessing}
              title="Start real-time speech recognition"
            >
              🎤 Start Speaking (Real-time)
            </button>
          )}
          
          {isListening && (
            <>
              <div className="recording-indicator">
                <span className="recording-dot"></span>
                <span className="recording-time">
                  🎙️ Listening... (speak now)
                </span>
              </div>
              <div className="recording-buttons">
                <button
                  type="button"
                  className="btn btn-voice-stop"
                  onClick={handleStopListening}
                  disabled={isProcessing}
                >
                  ⏹️ Stop Listening
                </button>
              </div>
              {speechError && (
                <div className="error-message" style={{ marginTop: '10px', fontSize: '0.9em' }}>
                  {speechError}
                </div>
              )}
            </>
          )}
        </div>

        <div className="input-divider">
          <span>or type your answer</span>
        </div>

        <textarea
          ref={answerInputRef}
          id="answer-input"
          value={answer + (interimTranscript ? ' ' + interimTranscript : '')}
          onChange={(e) => {
            setAnswer(e.target.value)
            setInterimTranscript('')
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer here... (Ctrl+Enter to submit)"
          rows={5}
          disabled={isProcessing}
        />
        <div className="button-group">
          <button
            id="send-answer-btn"
            className="btn btn-primary"
            onClick={handleSubmitAnswer}
            disabled={isProcessing || !answer.replace(/\s+\|.*$/, '').trim()}
          >
            {isProcessing ? 'Processing...' : 'Send Answer'}
          </button>
          <button
            id="end-interview-btn"
            className="btn btn-secondary"
            onClick={handleEndInterview}
            disabled={isProcessing}
          >
            End Interview
          </button>
        </div>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>

      {evaluation && (
        <div className="evaluation-panel">
          <h3>Evaluation</h3>
          <div className="score-display">
            <span className="score-label">Score:</span>
            <span className={`score-value ${getScoreClass(evaluation.score)}`}>
              {evaluation.score.toFixed(1)}
            </span>
            <span className="score-max">/ 10</span>
          </div>
          <div className="evaluation-details">
            {evaluation.strengths && evaluation.strengths.length > 0 && (
              <div className="eval-section">
                <strong>Strengths:</strong>
                <ul>
                  {evaluation.strengths.map((strength, idx) => (
                    <li key={idx}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}
            {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
              <div className="eval-section">
                <strong>Weaknesses:</strong>
                <ul>
                  {evaluation.weaknesses.map((weakness, idx) => (
                    <li key={idx}>{weakness}</li>
                  ))}
                </ul>
              </div>
            )}
            {evaluation.suggestions && evaluation.suggestions.length > 0 && (
              <div className="eval-section">
                <strong>Suggestions:</strong>
                <ul>
                  {evaluation.suggestions.map((suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="transcript-panel">
        <h3>Conversation Transcript</h3>
        <div className="transcript">
          {transcript.map((item, idx) => (
            <div
              key={idx}
              className={`transcript-item ${
                item.speaker === 'You' ? 'candidate' : 'interviewer'
              }`}
            >
              <div className="transcript-speaker">{item.speaker}:</div>
              <div className="transcript-text">{item.text}</div>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      </div>
    </div>
  )
}

function getScoreClass(score: number): string {
  if (score >= 8) return 'score-high'
  if (score >= 6) return 'score-medium'
  return 'score-low'
}
