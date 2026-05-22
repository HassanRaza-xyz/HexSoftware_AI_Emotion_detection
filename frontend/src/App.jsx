import { useState } from 'react'
import { Sparkles, Loader2, BrainCircuit } from 'lucide-react'
import './index.css'

function App() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!text.trim()) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })
      
      if (!response.ok) {
        throw new Error('Analysis failed')
      }
      
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError('Could not connect to the backend. Is it running?')
    } finally {
      setLoading(false)
    }
  }

  const getEmotionColor = (emotion) => {
    const validEmotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral', 'positive', 'negative']
    return validEmotions.includes(emotion) ? emotion : 'neutral'
  }

  return (
    <div className="app-container">
      <header className="header">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <BrainCircuit size={48} color="var(--accent)" />
        </div>
        <h1>Emotion Analyzer</h1>
        <p>Uncover the hidden feelings in your text using AI</p>
      </header>

      <main className="input-section">
        <textarea 
          placeholder="Type or paste your text here to analyze its emotional content..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        
        {error && <div style={{ color: 'var(--emotion-anger)', textAlign: 'center' }}>{error}</div>}
        
        <button 
          className="analyze-btn"
          onClick={handleAnalyze}
          disabled={loading || !text.trim()}
        >
          {loading ? (
            <Loader2 className="spinner" size={20} />
          ) : (
            <Sparkles size={20} />
          )}
          {loading ? 'Analyzing...' : 'Analyze Emotion'}
        </button>
      </main>

      {result && (
        <section className="results-container">
          <div className="primary-result">
            <div className="result-card">
              <span className="result-label">Primary Emotion</span>
              <span className={`result-value color-${getEmotionColor(result.top_emotion)}`}>
                {result.top_emotion}
              </span>
            </div>
            
            <div className="result-card">
              <span className="result-label">Overall Sentiment</span>
              <span className={`result-value color-${getEmotionColor(result.sentiment)}`}>
                {result.sentiment}
              </span>
            </div>
          </div>

          {result.emotions && Object.keys(result.emotions).length > 0 && (
            <div className="emotion-bars">
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: 'var(--text-muted)' }}>
                Emotion Breakdown
              </h3>
              {Object.entries(result.emotions)
                .sort(([, a], [, b]) => b - a)
                .filter(([, val]) => val > 0)
                .map(([emotion, value]) => {
                  const maxVal = Math.max(...Object.values(result.emotions));
                  const percentage = maxVal > 0 ? (value / maxVal) * 100 : 0;
                  const colorClass = getEmotionColor(emotion);
                  
                  return (
                    <div className="emotion-bar-item" key={emotion}>
                      <span className="emotion-name">{emotion}</span>
                      <div className="bar-bg">
                        <div 
                          className={`bar-fill bg-${colorClass}`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="bar-value">{value}</span>
                    </div>
                  )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default App
