import { config } from './config'

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function textToSpeechBase64(text: string, voiceId?: string): Promise<string> {
  const maxRetries = 3
  let lastError: Error | null = null
  const voice = voiceId || config.elevenlabs.voiceId

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice}`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': config.elevenlabs.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: config.elevenlabs.modelId,
          voice_settings: {
            stability: config.elevenlabs.stability,
            similarity_boost: config.elevenlabs.similarityBoost,
            style: 0.0,
            use_speaker_boost: true,
            speed: 1.0,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      // Use Buffer in Node.js environment (Next.js API routes)
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(arrayBuffer).toString('base64')
      }
      // Fallback for browser environment
      const bytes = new Uint8Array(arrayBuffer)
      const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '')
      return btoa(binary)
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000)
        await sleep(waitTime)
      }
    }
  }

  throw lastError || new Error('Failed to generate speech after retries')
}
