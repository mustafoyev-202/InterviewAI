'use client'

import { FinalReport } from '../types'

interface ResultsSectionProps {
  finalReport: FinalReport
  onReset: () => void
}

export default function ResultsSection({ finalReport, onReset }: ResultsSectionProps) {
  const overallScore = finalReport.overall_score.toFixed(1)
  const { summary, rubric_breakdown, next_steps } = finalReport

  return (
    <div className="section">
      <h2 style={{ color: '#ffd700', textAlign: 'center', marginBottom: '30px', fontSize: '2.5em', textTransform: 'uppercase', letterSpacing: '2px' }}>Interview Complete!</h2>
      <div className="results-content">
        <div className="final-score">
          <h3>Overall Score: {overallScore} / 10</h3>
        </div>

        <div className="summary-section">
          <h4>Summary</h4>
          <p>{summary}</p>
        </div>

        {rubric_breakdown && rubric_breakdown.length > 0 && (
          <div className="rubric-section">
            <h4>Rubric Breakdown</h4>
            <ul className="rubric-list">
              {rubric_breakdown.map((item, idx) => (
                <li key={idx}>
                  <strong>
                    {item.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                  </strong>{' '}
                  {item.score.toFixed(1)}/10
                  <p className="rubric-note">{item.notes}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {next_steps && next_steps.length > 0 && (
          <div className="next-steps-section">
            <h4>Next Steps</h4>
            <ul className="next-steps-list">
              {next_steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        id="new-interview-btn"
        className="btn btn-primary"
        onClick={onReset}
      >
        Start New Interview
      </button>
    </div>
  )
}
