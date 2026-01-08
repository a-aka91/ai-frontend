import { useState } from 'react';
import './App.css';

function App() {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const startListening = () => {
      // Check if browser supports it
      if (!("webkitSpeechRecognition" in window)) {
        alert("Browser not supported! Try Chrome or Edge.");
        return;
      }

      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = "ar-MA"; // Moroccan Arabic! (Or 'en-US')
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(transcript); // Put the text in the box
        // Optional: Auto-submit immediately
        // handleSubmit({ preventDefault: () => {} })
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    };
    const speak = (text) => {
      // Stop any previous talking
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ar-SA"; // Arabic (or 'en-US' if you prefer)
      utterance.rate = 1; // Speed: 1 is normal

      window.speechSynthesis.speak(utterance);
    };
    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!prompt) return;

      setIsLoading(true);
      setResponse(""); // Clear previous response

      try {
        // THE MOMENT OF TRUTH: Talking to Python
        const res = await fetch("http://127.0.0.1:8000/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: prompt }),
        });

        // --- NEW STREAMING LOGIC ---
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode the binary chunk to text
          const chunk = decoder.decode(value, { stream: true });

          // Update state cumulatively (React will re-render for every chunk)
          setResponse((prev) => prev + chunk);
          fullResponse += chunk;
        }
        // ---------------------------

        speak(fullResponse);
      } catch (error) {
        console.error("Error:", error);
        setResponse(
          "Error connecting to the Brain 🧠. Is the Python server running?"
        );
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
        <h1>🤖 AI Agent Interface</h1>

        <form onSubmit={handleSubmit}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask your agent something..."
            rows={4}
            style={{ width: "100%", padding: "10px", fontSize: "16px" }}
          />
          <br />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            <button
              type="button" // Important: preventing form submit
              onClick={startListening}
              style={{ backgroundColor: isListening ? "red" : "#4CAF50" }}
            >
              {isListening ? "👂 Listening..." : "🎤 Mic"}
            </button>

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Thinking..." : "Send"}
            </button>
          </div>
        </form>

        {response && (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              background: "#f0f0f0",
              borderRadius: "8px",
              textAlign: "left",
            }}
          >
            <strong>Agent says:</strong>
            <p style={{ whiteSpace: "pre-wrap" }}>{response}</p>
          </div>
        )}
      </div>
    );
}

export default App;
