/**
 * Browser-native Speech Recognition API wrapper
 * Real-time transcription using Web Speech API
 */

export interface SpeechRecognitionResult {
  transcript: string
  isFinal: boolean
}

export interface SpeechRecognitionState {
  isListening: boolean
  transcript: string
  error: string | null
}

export class SpeechRecognitionManager {
  private recognition: any = null
  private onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void
  private onStateChange?: (state: SpeechRecognitionState) => void
  private currentTranscript: string = ''
  private isListening: boolean = false

  constructor(
    onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void,
    onStateChange?: (state: SpeechRecognitionState) => void
  ) {
    this.onTranscriptUpdate = onTranscriptUpdate
    this.onStateChange = onStateChange
    this.initRecognition()
  }

  private initRecognition(): void {
    if (typeof window === 'undefined') return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported in this browser')
      return
    }

    this.recognition = new SpeechRecognition()
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = 'en-US'

    this.recognition.onstart = () => {
      this.isListening = true
      this.currentTranscript = ''
      this.onStateChange?.({
        isListening: true,
        transcript: '',
        error: null
      })
    }

    this.recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        this.currentTranscript = (this.currentTranscript + ' ' + finalTranscript).trim()
        this.onTranscriptUpdate?.(finalTranscript.trim(), true)
      }
      
      if (interimTranscript) {
        this.onTranscriptUpdate?.(interimTranscript, false)
      }

      this.onStateChange?.({
        isListening: this.isListening,
        transcript: this.currentTranscript + (interimTranscript ? ' ' + interimTranscript : ''),
        error: null
      })
    }

    this.recognition.onerror = (event: any) => {
      const error = event.error || 'Unknown error'
      this.isListening = false
      this.onStateChange?.({
        isListening: false,
        transcript: this.currentTranscript,
        error: error
      })
    }

    this.recognition.onend = () => {
      this.isListening = false
      this.onStateChange?.({
        isListening: false,
        transcript: this.currentTranscript,
        error: null
      })
    }
  }

  start(): void {
    if (!this.recognition) {
      throw new Error('Speech Recognition not available')
    }
    if (this.isListening) {
      return
    }
    try {
      this.recognition.start()
    } catch (error) {
      console.error('Error starting recognition:', error)
    }
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
  }

  abort(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort()
    }
  }

  getTranscript(): string {
    return this.currentTranscript
  }

  clearTranscript(): void {
    this.currentTranscript = ''
  }

  cleanup(): void {
    if (this.recognition) {
      this.stop()
      this.recognition = null
    }
  }
}

/**
 * Browser-native Speech Synthesis API wrapper
 */
export class SpeechSynthesisManager {
  private isSpeaking: boolean = false
  private currentUtterance: SpeechSynthesisUtterance | null = null

  speak(text: string, onEnd?: () => void, onError?: () => void): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech Synthesis not supported')
      return
    }

    this.stop()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0
    utterance.lang = 'en-US'

    utterance.onstart = () => {
      this.isSpeaking = true
    }

    utterance.onend = () => {
      this.isSpeaking = false
      this.currentUtterance = null
      onEnd?.()
    }

    utterance.onerror = (error) => {
      this.isSpeaking = false
      this.currentUtterance = null
      console.error('Speech synthesis error:', error)
      onError?.()
    }

    this.currentUtterance = utterance
    window.speechSynthesis.speak(utterance)
  }

  stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      this.isSpeaking = false
      this.currentUtterance = null
    }
  }

  pause(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause()
    }
  }

  resume(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume()
    }
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking
  }
}
