'use client'

interface NavbarProps {
  currentState: 'start' | 'interview' | 'results'
  onReset?: () => void
}

export default function Navbar({ currentState, onReset }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <span className="navbar-logo">🎤</span>
          <span className="navbar-title">Voice Interviewer AI</span>
        </div>
        <div className="navbar-menu">
          {currentState === 'interview' && (
            <button className="navbar-btn" onClick={onReset}>
              ⚡ Exit Interview
            </button>
          )}
          {currentState === 'results' && (
            <button className="navbar-btn" onClick={onReset}>
              🔥 New Interview
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
