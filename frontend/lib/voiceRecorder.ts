/**
 * Voice recording utility using MediaRecorder API
 * Records audio and converts to MP3 format
 */

export interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  error: string | null
}

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null
  private startTime: number = 0
  private durationInterval: NodeJS.Timeout | null = null
  private onStateChange?: (state: RecordingState) => void

  constructor(onStateChange?: (state: RecordingState) => void) {
    this.onStateChange = onStateChange
  }

  async startRecording(): Promise<void> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      })

      // Create MediaRecorder with WebM format (we'll convert to MP3 on backend)
      const options: MediaRecorderOptions = {
        mimeType: this.getSupportedMimeType(),
        audioBitsPerSecond: 128000, // 128 kbps
      }

      this.mediaRecorder = new MediaRecorder(this.stream, options)
      this.audioChunks = []

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        this.stopStream()
      }

      this.mediaRecorder.onerror = (event) => {
        this.onStateChange?.({
          isRecording: false,
          isPaused: false,
          duration: 0,
          error: 'Recording error occurred',
        })
      }

      this.mediaRecorder.start(100) // Collect data every 100ms
      this.startTime = Date.now()
      
      // Update duration every second
      this.durationInterval = setInterval(() => {
        const duration = Math.floor((Date.now() - this.startTime) / 1000)
        this.onStateChange?.({
          isRecording: true,
          isPaused: false,
          duration,
          error: null,
        })
      }, 1000)

      this.onStateChange?.({
        isRecording: true,
        isPaused: false,
        duration: 0,
        error: null,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording'
      this.onStateChange?.({
        isRecording: false,
        isPaused: false,
        duration: 0,
        error: errorMessage,
      })
      throw error
    }
  }

  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause()
      if (this.durationInterval) {
        clearInterval(this.durationInterval)
        this.durationInterval = null
      }
      this.onStateChange?.({
        isRecording: false,
        isPaused: true,
        duration: Math.floor((Date.now() - this.startTime) / 1000),
        error: null,
      })
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume()
      this.startTime = Date.now() - (this.mediaRecorder.startTime || 0)
      
      this.durationInterval = setInterval(() => {
        const duration = Math.floor((Date.now() - this.startTime) / 1000)
        this.onStateChange?.({
          isRecording: true,
          isPaused: false,
          duration,
          error: null,
        })
      }, 1000)

      this.onStateChange?.({
        isRecording: true,
        isPaused: false,
        duration: Math.floor((Date.now() - this.startTime) / 1000),
        error: null,
      })
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'))
        return
      }

      if (this.durationInterval) {
        clearInterval(this.durationInterval)
        this.durationInterval = null
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { 
          type: this.mediaRecorder?.mimeType || 'audio/webm' 
        })
        this.stopStream()
        this.onStateChange?.({
          isRecording: false,
          isPaused: false,
          duration: 0,
          error: null,
        })
        resolve(audioBlob)
      }

      if (this.mediaRecorder.state === 'recording' || this.mediaRecorder.state === 'paused') {
        this.mediaRecorder.stop()
      } else {
        reject(new Error('Recording not active'))
      }
    })
  }

  private stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
  }

  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/mpeg',
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    // Fallback to default
    return 'audio/webm'
  }

  cleanup(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval)
      this.durationInterval = null
    }
    this.stopStream()
    this.mediaRecorder = null
    this.audioChunks = []
  }
}

/**
 * Format duration in seconds to MM:SS format
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
