'use client'

import { useState } from 'react'
import { startSession, playAudio } from '../lib/api'
import { StartSessionResponse } from '../types'

interface StartSectionProps {
  onStartInterview: (sessionId: string, firstQuestion: string, role: string, level: string) => void
  isProcessing: boolean
  setIsProcessing: (value: boolean) => void
}

export default function StartSection({
  onStartInterview,
  isProcessing,
  setIsProcessing,
}: StartSectionProps) {
  const [role, setRole] = useState('backend')
  const [level, setLevel] = useState('mid')
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleStart = async () => {
    if (!role || !level) {
      setError('Please select both role and level')
      return
    }

    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    const ageNum = parseInt(age)
    const expNum = parseFloat(experienceYears)

    if (!age || isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
      setError('Please enter a valid age (18-100)')
      return
    }

    if (experienceYears === '' || isNaN(expNum) || expNum < 0 || expNum > 50) {
      setError('Please enter valid experience years (0-50)')
      return
    }

    try {
      setIsProcessing(true)
      setError(null)

      const data: StartSessionResponse = await startSession(role, level, name, ageNum, expNum)

      // Play ElevenLabs audio if available
      if (data.interviewer_audio_url_or_base64) {
        playAudio(data.interviewer_audio_url_or_base64)
      }

      onStartInterview(data.session_id, data.first_question_text, role, level)
    } catch (err) {
      console.error('Error starting interview:', err)
      setError(err instanceof Error ? err.message : 'Failed to start interview. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="section">
      <div className="form-group">
        <label htmlFor="name-input">Your Name:</label>
        <input
          id="name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          disabled={isProcessing}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="age-input">Age:</label>
        <input
          id="age-input"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="Enter your age"
          min="18"
          max="100"
          disabled={isProcessing}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="experience-input">Years of Experience:</label>
        <input
          id="experience-input"
          type="number"
          value={experienceYears}
          onChange={(e) => setExperienceYears(e.target.value)}
          placeholder="Enter years of experience"
          min="0"
          max="50"
          step="0.5"
          disabled={isProcessing}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="role-select">Role:</label>
        <select
          id="role-select"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={isProcessing}
        >
          <option value="backend">Backend Engineer</option>
          <option value="frontend">Frontend Engineer</option>
          <option value="fullstack">Full Stack Engineer</option>
          <option value="ml">ML Engineer</option>
          <option value="data_scientist">Data Scientist</option>
          <option value="devops">DevOps Engineer</option>
          <option value="qa">QA Engineer</option>
          <option value="mobile">Mobile Developer</option>
          <option value="security">Security Engineer</option>
          <option value="blockchain">Blockchain Developer</option>
          <option value="game_dev">Game Developer</option>
          <option value="pm">Product Manager</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="level-select">Level:</label>
        <select
          id="level-select"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          disabled={isProcessing}
        >
          <option value="junior">Junior</option>
          <option value="mid">Mid-level</option>
          <option value="senior">Senior</option>
        </select>
      </div>

      <button
        id="start-btn"
        className="btn btn-primary"
        onClick={handleStart}
        disabled={isProcessing}
      >
        {isProcessing ? 'Loading...' : '🚀 Start Interview'}
      </button>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  )
}
