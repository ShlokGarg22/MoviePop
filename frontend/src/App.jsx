import { useState } from 'react'
import './App.css'

// Environment-based API URL for deployment
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5001'
  : 'https://movie-recommender-backend-ze14.onrender.com';

console.log('🔍 Debug Info:');
console.log('Current hostname:', window.location.hostname);
console.log('API_URL being used:', API_URL);
console.log('Environment PROD:', import.meta.env.PROD);
console.log('Environment MODE:', import.meta.env.MODE);

function App() {
  const [groupSize, setGroupSize] = useState(1)
  const [currentStep, setCurrentStep] = useState('groupSize') // 'groupSize', 'quiz', 'results'
  const [currentMember, setCurrentMember] = useState(0)
  const [memberAnswers, setMemberAnswers] = useState({})
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const questions = [
    {
      id: 'mood',
      question: "What mood are you in for tonight?",
      options: [
        { value: 'excited', text: 'Excited and energetic' },
        { value: 'relaxed', text: 'Relaxed and chill' },
        { value: 'thoughtful', text: 'Thoughtful and deep' },
        { value: 'fun', text: 'Fun and lighthearted' }
      ]
    },
    {
      id: 'genre',
      question: "What type of movie sounds good?",
      options: [
        { value: 'action', text: 'Action & Adventure' },
        { value: 'comedy', text: 'Comedy & Fun' },
        { value: 'drama', text: 'Drama & Deep Stories' },
        { value: 'scifi', text: 'Sci-Fi & Fantasy' },
        { value: 'horror', text: 'Horror & Thriller' },
        { value: 'romance', text: 'Romance & Love Stories' }
      ]
    },
    {
      id: 'description',
      question: "Describe the perfect movie for you tonight",
      type: 'text',
      placeholder: 'e.g., "A thrilling movie with great plot twists and amazing cinematography" or "Something light and funny to help me relax"'
    }
  ]

  const handleStartQuiz = () => {
    const answers = {}
    for (let i = 0; i < groupSize; i++) {
      answers[i] = {}
    }
    setMemberAnswers(answers)
    setCurrentStep('quiz')
    setCurrentMember(0)
  }

  const handleAnswerChange = (questionId, value) => {
    setMemberAnswers(prev => ({
      ...prev,
      [currentMember]: {
        ...prev[currentMember],
        [questionId]: value
      }
    }))
  }

  const handleNextMember = () => {
    if (currentMember < groupSize - 1) {
      setCurrentMember(currentMember + 1)
    } else {
      getRecommendations()
    }
  }

  const getRecommendations = async () => {
    setLoading(true)
    setError('')
    
    try {
      const answers = Object.values(memberAnswers).map((member, index) => {
        let description = `Person ${index + 1} wants ${member.mood} ${member.genre} movies`;
        
        // Add their descriptive text if provided
        if (member.description && member.description.trim()) {
          description += `. They specifically describe their ideal movie as: "${member.description.trim()}"`;
        }
        
        return {
          member: index + 1,
          description
        };
      })

      console.log('🚀 Making API request to:', `${API_URL}/api/recommend`);
      console.log('📝 Request payload:', { answers });

      const response = await fetch(`${API_URL}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      })

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Failed to get recommendations: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      console.log('✅ Response data:', data);
      setRecommendations(data.recommendations || [])
      setCurrentStep('results')
    } catch (err) {
      console.error('💥 Fetch error:', err);
      setError(`Failed to get recommendations: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const resetApp = () => {
    setCurrentStep('groupSize')
    setGroupSize(1)
    setCurrentMember(0)
    setMemberAnswers({})
    setRecommendations([])
    setError('')
  }

  if (currentStep === 'groupSize') {
    return (
      <div className="app">
        <div className="container">
          <header>
            <h1>🎬 Movie Night</h1>
            <p>Find the perfect movie for your group</p>
          </header>
          
          <div className="group-size-section">
            <h2>How many people are watching?</h2>
            <div className="size-selector">
              <input
                type="range"
                min="1"
                max="10"
                value={groupSize}
                onChange={(e) => setGroupSize(parseInt(e.target.value))}
                className="slider"
              />
              <div className="size-display">
                <span className="size-number">{groupSize}</span>
                <span className="size-text">{groupSize === 1 ? 'person' : 'people'}</span>
              </div>
            </div>
            <button onClick={handleStartQuiz} className="start-btn">
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === 'quiz') {
    const progress = ((currentMember + 1) / groupSize) * 100
    const isLastMember = currentMember === groupSize - 1
    const canProceed = memberAnswers[currentMember]?.mood && memberAnswers[currentMember]?.genre

    return (
      <div className="app">
        <div className="container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          
          <div className="quiz-header">
            <h2>Person {currentMember + 1} of {groupSize}</h2>
            <p>Answer these quick questions</p>
          </div>

          <div className="questions">
            {questions.map(question => (
              <div key={question.id} className="question">
                <h3>{question.question}</h3>
                
                {question.type === 'text' ? (
                  // Text input question
                  <div className="text-input-container">
                    <textarea
                      className="text-input"
                      placeholder={question.placeholder}
                      value={memberAnswers[currentMember]?.[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      rows={3}
                    />
                  </div>
                ) : (
                  // Multiple choice question
                  <div className="options">
                    {question.options.map(option => (
                      <label key={option.value} className="option">
                        <input
                          type="radio"
                          name={question.id}
                          value={option.value}
                          checked={memberAnswers[currentMember]?.[question.id] === option.value}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        />
                        <span className="option-text">{option.text}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="quiz-navigation">
            <button onClick={resetApp} className="back-btn">
              Start Over
            </button>
            <button 
              onClick={handleNextMember} 
              disabled={!canProceed || loading}
              className="next-btn"
            >
              {loading ? 'Getting Recommendations...' : isLastMember ? 'Get Movies' : 'Next Person'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === 'results') {
    return (
      <div className="app">
        <div className="container">
          <header>
            <h1>🎯 Perfect Matches</h1>
            <p>Movies recommended for your group of {groupSize}</p>
          </header>

          {error && (
            <div className="error">{error}</div>
          )}

          {recommendations.length > 0 ? (
            <div className="movies">
              {recommendations.map((movie, index) => (
                <div key={movie.id} className="movie">
                  <div className="movie-rank">#{index + 1}</div>
                  {movie.poster_url && (
                    <img src={movie.poster_url} alt={movie.title} className="movie-poster" />
                  )}
                  <div className="movie-info">
                    <h3>{movie.title}</h3>
                    {movie.vote_average && (
                      <div className="rating">⭐ {movie.vote_average}/10</div>
                    )}
                    <p>{movie.description}</p>
                    <div className="match">
                      Group Match: {Math.round(movie.similarity * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">No recommendations found</div>
          )}

          <button onClick={resetApp} className="reset-btn">
            Start Over
          </button>
        </div>
      </div>
    )
  }
}

export default App
