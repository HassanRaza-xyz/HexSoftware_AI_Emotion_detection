import { useState } from 'react'
import { Sparkles, Loader2, BrainCircuit, Trash2, Copy, Check, Quote, RefreshCw } from 'lucide-react'
import './index.css'

const SAMPLES = [
  { text: "I am absolutely thrilled about this new project! It's going to be amazing.", label: "Joyful" },
  { text: "I'm so frustrated with the constant delays. It's getting really annoying.", label: "Angry" },
  { text: "The movie was so heartbreaking. I couldn't stop thinking about it for days.", label: "Sad" },
  { text: "I'm a bit nervous about the upcoming presentation, but I'll do my best.", label: "Nervous" }
]

function App() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

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

  const handleClear = () => {
    setText('')
    setResult(null)
    setError('')
  }

  const handleCopy = async () => {
    if (!result) return
    const content = `Emotion: ${result.top_emotion}\nSentiment: ${result.sentiment}\nText: ${text}`
    await navigator.clipboard.writeText(content)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const getEmotionColor = (emotion) => {
    const validEmotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral', 'positive', 'negative']
    return validEmotions.includes(emotion?.toLowerCase()) ? emotion.toLowerCase() : 'neutral'
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-container">
          <BrainCircuit size={48} color="var(--accent)" className="logo-icon" />
        </div>
        <h1>Emotion Analyzer</h1>
        <p>Uncover the hidden feelings in your text using AI</p>
      </header>

      <main className="input-section">
        <div className="textarea-wrapper">
          <textarea 
            placeholder="Type or paste your text here to analyze its emotional content..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {text && (
            <button className="icon-btn clear-btn" onClick={handleClear} title="Clear text">
              <Trash2 size={18} />
            </button>
          )}
        </div>

        <div className="samples-container">
          <span className="sample-label"><Quote size={14} /> Try a sample:</span>
          <div className="sample-chips">
            {SAMPLES.map((sample, i) => (
              <button 
                key={i} 
                className="sample-chip" 
                onClick={() => setText(sample.text)}
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="action-row">
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
          
          {result && (
            <button className="icon-btn reset-btn" onClick={handleClear} title="Analyze new text">
              <RefreshCw size={20} />
            </button>
          )}
        </div>
      </main>

      {result && (
        <section className="results-container">
          <div className="results-header">
            <h3>Analysis Results</h3>
            <button className={`copy-btn ${copySuccess ? 'success' : ''}`} onClick={handleCopy}>
              {copySuccess ? <Check size={16} /> : <Copy size={16} />}
              {copySuccess ? 'Copied' : 'Copy'}
            </button>
          </div>

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
              <h3 className="breakdown-title">Emotion Breakdown</h3>
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
                      <span className="bar-value">{(value * 100).toFixed(1)}%</span>
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
