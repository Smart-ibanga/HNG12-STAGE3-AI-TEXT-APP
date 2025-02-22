import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [targetLang, setTargetLang] = useState('es');
  const messagesEndRef = useRef(null);
  const [charCount, setCharCount] = useState(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleAction = async (actionType) => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: inputText,
      result: '',
      detectedLang: '',
      timestamp: new Date().toLocaleTimeString(),
      status: 'processing',
      type: actionType
    };

    setMessages(prev => [...prev, newMessage]);
    
    try {
      const endpoint = actionType === 'translate' ? '/translate' : '/summarize';
      const response = await axios.post(`http://localhost:3001${endpoint}`, {
        text: inputText,
        targetLang
      });

      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? {
          ...msg,
          result: response.data.translatedText || response.data.summary,
          detectedLang: response.data.detectedLang,
          status: 'completed'
        } : msg
      ));
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { 
          ...msg, 
          status: 'error',
          error: error.response?.data?.error || `${actionType} failed`
        } : msg
      ));
    }
    
    setInputText('');
    setCharCount(0);
  };

  return (
    <div className="chat-container" role="main">
      <div className="chat-header">
        <h1 id="app-title">AI Text Processor</h1>
        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="lang-select"
          aria-label="Select target language"
        >
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      <div className="chat-messages" role="log" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className="message-container">
            <div className={`message-card ${message.type}`}>
              <div className="message-content">
                <p>{message.text}</p>
                {message.result && (
                  <div className="result-output">
                    <h3>{message.type === 'translate' ? 'Translation' : 'Summary'}</h3>
                    <p>{message.result}</p>
                    {message.detectedLang && (
                      <div className="language-info">
                        Detected: {LANGUAGES[message.detectedLang] || message.detectedLang}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="message-status">
                {message.status === 'processing' && (
                  <span className="processing">⏳ Processing...</span>
                )}
                {message.status === 'error' && (
                  <span className="error" role="alert">❌ {message.error}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} tabIndex={-1} aria-hidden="true" />
      </div>

      <div className="input-container">
        <textarea
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setCharCount(e.target.value.length);
          }}
          placeholder="Enter text to process..."
          aria-label="Text input field"
          maxLength={500}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAction('translate');
            }
          }}
        />
        <div className="action-controls">
          <div className="char-counter" aria-live="polite">
            {charCount}/500
          </div>
          <div className="action-buttons">
            <button
              className="translate-btn"
              onClick={() => handleAction('translate')}
              aria-label="Translate text"
              disabled={!inputText.trim()}
            >
              Translate
            </button>
            <button
              className="summarize-btn"
              onClick={() => handleAction('summarize')}
              aria-label="Summarize text"
              disabled={!inputText.trim() || inputText.length < 150}
            >
              Summarize
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  pt: 'Portuguese',
  ru: 'Russian',
  tr: 'Turkish'
};

export default App;