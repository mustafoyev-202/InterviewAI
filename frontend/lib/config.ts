function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key]
  if (!value && !defaultValue) {
    throw new Error(`${key} is required. Please set it in .env.local file.`)
  }
  return value || defaultValue || ''
}

export const config = {
  gemini: {
    apiKey: getEnvVar('GEMINI_API_KEY'),
    model: getEnvVar('GEMINI_MODEL', 'gemini-2.5-flash'),
    temperature: parseFloat(getEnvVar('GEMINI_TEMPERATURE', '0.7')),
    maxRetries: parseInt(getEnvVar('GEMINI_MAX_RETRIES', '3')),
    maxOutputTokens: parseInt(getEnvVar('GEMINI_MAX_OUTPUT_TOKENS', '1024')),
  },
  elevenlabs: {
    apiKey: getEnvVar('ELEVENLABS_API_KEY'),
    voiceId: getEnvVar('ELEVENLABS_VOICE_ID'),
    modelId: getEnvVar('ELEVENLABS_MODEL_ID', 'eleven_multilingual_v2'),
    stability: parseFloat(getEnvVar('ELEVENLABS_STABILITY', '0.5')),
    similarityBoost: parseFloat(getEnvVar('ELEVENLABS_SIMILARITY_BOOST', '0.75')),
  },
  interview: {
    maxQuestionsPerSession: parseInt(getEnvVar('MAX_QUESTIONS_PER_SESSION', '5')),
    minScoreForAdvancedQuestion: parseFloat(getEnvVar('MIN_SCORE_FOR_ADVANCED_QUESTION', '7.0')),
  },
}
