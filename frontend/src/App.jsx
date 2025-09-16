import { useState } from 'react'
import './App.css'

function App() {
  const [descriptions, setDescriptions] = useState(['', ''])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDescriptionChange = (index, value) => {
    const newDescriptions = [...descriptions]
    newDescriptions[index] = value
    setDescriptions(newDescriptions)
  }

  const addDescription = () => {
    setDescriptions([...descriptions, ''])
  }

  const removeDescription = (index) => {
    if (descriptions.length > 1) {
      const newDescriptions = descriptions.filter((_, i) => i !== index)
      setDescriptions(newDescriptions)
    }
  }

  const getRecommendations = async () => {
    setLoading(true)
    setError('')
    
    try {
      const answers = descriptions
        .filter(desc => desc.trim())
        .map(desc => ({ description: desc }))
      
      if (answers.length === 0) {
        setError('Please enter at least one movie preference')
        setLoading(false)
        return
      }

      const response = await fetch('http://localhost:5000/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      })

      if (!response.ok) {
        throw new Error('Failed to get recommendations')
      }

      const data = await response.json()
      setRecommendations(data.recommendations)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>🎬 MoviePop</h1>
        <p>AI-powered movie recommendations based on your preferences</p>
      </header>

      <main>
        <section className="input-section">
          <h2>What kind of movies do you like?</h2>
          {descriptions.map((desc, index) => (
            <div key={index} className="description-input">
              <textarea
                value={desc}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                placeholder={`Describe your movie preference #${index + 1} (e.g., "I love action movies with explosions")`}
                rows={3}
              />
              {descriptions.length > 1 && (
                <button 
                  onClick={() => removeDescription(index)}
                  className="remove-btn"
                  type="button"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          
          <div className="buttons">
            <button onClick={addDescription} className="add-btn" type="button">
              + Add Another Preference
            </button>
            <button 
              onClick={getRecommendations} 
              className="recommend-btn"
              disabled={loading}
            >
              {loading ? 'Getting Recommendations...' : 'Get Movie Recommendations'}
            </button>
          </div>
        </section>

        {error && (
          <div className="error">
            <p>❌ {error}</p>
          </div>
        )}

        {recommendations.length > 0 && (
          <section className="results-section">
            <h2>🎯 Recommended Movies</h2>
            <div className="movie-list">
              {recommendations.map((movie, index) => (
                <div key={movie.id || index} className="movie-card">
                  <h3>{movie.title}</h3>
                  <p>{movie.description}</p>
                  <div className="similarity">
                    Match: {(movie.similarity * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
