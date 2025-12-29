import { config } from './config'
import {
  formatQuestionPrompt,
  formatEvaluationPrompt,
  formatFollowupPrompt,
  formatFinalReportPrompt,
} from './prompts'

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>
    }
    finishReason?: string
  }>
  text?: string
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function generateContent(prompt: string, enforceJson: boolean = false): Promise<string> {
  const maxRetries = config.gemini.maxRetries
  let lastError: Error | null = null

  console.log('\n🔵 ===== GEMINI REQUEST =====')
  console.log(`📝 Prompt (${enforceJson ? 'JSON' : 'TEXT'} mode):`)
  console.log('─'.repeat(60))
  console.log(prompt.substring(0, 500) + (prompt.length > 500 ? '...' : ''))
  console.log('─'.repeat(60))
  console.log(`📊 Full prompt length: ${prompt.length} characters`)

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (enforceJson) {
        prompt = `${prompt}\n\nIMPORTANT: Respond with valid JSON only. Do not include any markdown formatting, code blocks, or additional text outside the JSON.`
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`
      
      console.log(`\n🚀 Attempt ${attempt + 1}/${maxRetries} - Calling Gemini API...`)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: config.gemini.temperature,
            maxOutputTokens: config.gemini.maxOutputTokens,
          }
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Gemini API error: ${response.status} ${errorText}`)
      }

      const result: GeminiResponse = await response.json()
      
      let text: string
      let finishReason: string | undefined
      if (result.candidates && result.candidates.length > 0) {
        text = result.candidates[0].content.parts[0].text.trim()
        finishReason = result.candidates[0].finishReason
      } else if ((result as any).text) {
        text = (result as any).text.trim()
      } else {
        throw new Error('No candidates in Gemini response')
      }
      
      if (finishReason && finishReason !== 'STOP') {
        console.warn(`⚠️  Warning: Response finished with reason: ${finishReason}`)
        if (finishReason === 'MAX_TOKENS') {
          console.warn(`⚠️  Response was truncated! Consider increasing maxOutputTokens (current: ${config.gemini.maxOutputTokens})`)
        }
      }

      if (enforceJson) {
        text = extractJson(text)
      }

      console.log('\n✅ ===== GEMINI RESPONSE =====')
      console.log(`📄 Generated text (${text.length} chars, ~${Math.ceil(text.length / 4)} tokens):`)
      console.log('─'.repeat(80))
      console.log(text)
      console.log('─'.repeat(80))
      console.log('✅ ===== END RESPONSE =====\n')

      return text
    } catch (error) {
      lastError = error as Error
      console.error(`\n❌ Attempt ${attempt + 1} failed:`, error)
      if (attempt < maxRetries - 1) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000)
        console.log(`⏳ Retrying in ${waitTime}ms...`)
        await sleep(waitTime)
      }
    }
  }

  console.error('\n❌ ===== GEMINI FAILED AFTER RETRIES =====')
  console.error('Last error:', lastError)
  throw lastError || new Error('Failed to generate content after retries')
}

function extractJson(text: string): string {
  // Try to find JSON in the response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      JSON.parse(jsonMatch[0])
      return jsonMatch[0]
    } catch {
      // Continue to try other methods
    }
  }

  // Try removing markdown code blocks
  const withoutMarkdown = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    JSON.parse(withoutMarkdown)
    return withoutMarkdown
  } catch {
    // Continue
  }

  // Return original if no valid JSON found
  return text
}

export async function generateQuestion(
  role: string,
  level: string,
  questionNumber: number,
  history: any[] | null,
  candidateName: string,
  candidateAge: number,
  experienceYears: number
): Promise<string> {
  console.log('\n🎯 ===== GENERATING QUESTION =====')
  console.log(`👤 Candidate: ${candidateName} (Age: ${candidateAge}, Exp: ${experienceYears} years)`)
  console.log(`💼 Role: ${role} | Level: ${level} | Question #${questionNumber}`)
  
  const prompt = formatQuestionPrompt(
    role,
    level,
    questionNumber,
    history,
    candidateName,
    candidateAge,
    experienceYears
  )
  const question = await generateContent(prompt)
  
  console.log(`\n✨ Generated Question: "${question}"`)
  console.log('🎯 ===== END QUESTION GENERATION =====\n')
  
  return question
}

export async function evaluateAnswer(
  question: string,
  answer: string,
  role: string,
  level: string,
  history: any[] | null,
  candidateName?: string,
  candidateAge?: number,
  experienceYears?: number
): Promise<any> {
  console.log('\n📊 ===== EVALUATING ANSWER =====')
  console.log(`❓ Question: "${question.substring(0, 80)}..."`)
  console.log(`💬 Answer: "${answer.substring(0, 100)}..."`)
  
  const prompt = formatEvaluationPrompt(question, answer, role, level, history)
  const jsonText = await generateContent(prompt, true)
  
  try {
    const evaluation = JSON.parse(jsonText)
    console.log(`\n⭐ Evaluation Result:`)
    console.log(`   Score: ${evaluation.score}/10`)
    console.log(`   Strengths: ${evaluation.strengths?.length || 0}`)
    console.log(`   Weaknesses: ${evaluation.weaknesses?.length || 0}`)
    console.log(`   Follow-up Intent: ${evaluation.followup_intent}`)
    console.log('📊 ===== END EVALUATION =====\n')
    return evaluation
  } catch (error) {
    console.error('❌ Failed to parse evaluation JSON:', jsonText)
    throw new Error('Invalid evaluation response format')
  }
}

export async function generateFollowupQuestion(
  question: string,
  answer: string,
  evaluation: any,
  role: string,
  level: string,
  history: any[] | null,
  candidateName?: string,
  candidateAge?: number,
  experienceYears?: number
): Promise<string> {
  console.log('\n🔄 ===== GENERATING FOLLOW-UP QUESTION =====')
  console.log(`📈 Previous Score: ${evaluation.score}/10`)
  console.log(`🎯 Intent: ${evaluation.followup_intent}`)
  
  const prompt = formatFollowupPrompt(
    question,
    answer,
    evaluation.score,
    evaluation.missing_topics || [],
    evaluation.followup_intent || 'clarify',
    role,
    level,
    history
  )
  const followup = await generateContent(prompt)
  
  console.log(`\n✨ Generated Follow-up: "${followup}"`)
  console.log('🔄 ===== END FOLLOW-UP GENERATION =====\n')
  
  return followup
}

export async function generateFinalReport(
  role: string,
  level: string,
  history: any[],
  rubricScores: number[]
): Promise<any> {
  console.log('\n📋 ===== GENERATING FINAL REPORT =====')
  console.log(`📊 Total Questions: ${history.length}`)
  console.log(`📈 Average Score: ${(rubricScores.reduce((a, b) => a + b, 0) / rubricScores.length).toFixed(1)}/10`)
  
  const prompt = formatFinalReportPrompt(role, level, history, rubricScores)
  const jsonText = await generateContent(prompt, true)
  
  try {
    const report = JSON.parse(jsonText)
    console.log(`\n🏆 Final Report:`)
    console.log(`   Overall Score: ${report.overall_score}/10`)
    console.log(`   Summary: "${report.summary?.substring(0, 100)}..."`)
    console.log(`   Rubric Categories: ${report.rubric_breakdown?.length || 0}`)
    console.log('📋 ===== END FINAL REPORT =====\n')
    return report
  } catch (error) {
    console.error('❌ Failed to parse final report JSON:', jsonText)
    throw new Error('Invalid final report response format')
  }
}
