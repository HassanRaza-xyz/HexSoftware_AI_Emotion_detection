import { useState } from 'react'
import { Sparkles, Loader2, BrainCircuit, Trash2, Copy, Check, Quote, RefreshCw, Share2 } from 'lucide-react'
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
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('analysis_history')
    return saved ? JSON.parse(saved) : []
  })

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length

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
      
      // Save to history
      const newEntry = {
        id: Date.now(),
        text: text,
        preview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        top_emotion: data.top_emotion,
        timestamp: new Date().toLocaleTimeString()
      }
      const updatedHistory = [newEntry, ...history].slice(0, 5)
      setHistory(updatedHistory)
      localStorage.setItem('analysis_history', JSON.stringify(updatedHistory))
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

  const handleClearHistory = () => {
    setHistory([])
    localStorage.removeItem('analysis_history')
  }

  const handleCopy = async () => {
    if (!result) return
    const content = `Emotion: ${result.top_emotion}\nSentiment: ${result.sentiment}\nText: ${text}`
    await navigator.clipboard.writeText(content)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const handleShare = async () => {
    if (!result) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Emotion Analysis Results',
          text: `My text top emotion is ${result.top_emotion} (${result.sentiment} sentiment). Analyze yours at Emotion Analyzer!`,
          url: window.location.href,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      handleCopy()
    }
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
          <div className="textarea-footer">
            <span className="stats">{wordCount} words | {charCount} chars</span>
            {text && (
              <button className="icon-btn clear-btn-inline" onClick={handleClear} title="Clear text">
                <Trash2 size={16} />
              </button>
            )}
          </div>
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

        {history.length > 0 && !result && (
          <div className="history-section">
            <div className="history-header">
              <span className="sample-label">Recent Analyses:</span>
              <button className="clear-history-btn" onClick={handleClearHistory}>Clear All</button>
            </div>
            <div className="history-list">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className="history-item clickable"
                  onClick={() => setText(item.text)}
                  title="Reload this text"
                >
                  <span className="history-text">{item.preview}</span>
                  <span className={`history-tag bg-${getEmotionColor(item.top_emotion)}`}>
                    {item.top_emotion}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {result && (
        <section className="results-container">
          <div className="results-header">
            <h3>Analysis Results</h3>
            <div className="result-actions">
              <button className="copy-btn" onClick={handleShare}>
                <Share2 size={16} />
                Share
              </button>
              <button className={`copy-btn ${copySuccess ? 'success' : ''}`} onClick={handleCopy}>
                {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                {copySuccess ? 'Copied' : 'Copy'}
              </button>
            </div>
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
