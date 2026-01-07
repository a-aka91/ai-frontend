import { useState } from 'react';
import './App.css';

function App() {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt) return;

        setIsLoading(true);
        setResponse(''); // Clear previous response

        try {
            // THE MOMENT OF TRUTH: Talking to Python
            const res = await fetch(
              "https://ai-backend-api-k8o7.onrender.com/chat",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt: prompt }),
              }
            );

            // --- NEW STREAMING LOGIC ---
            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Decode the binary chunk to text
                const chunk = decoder.decode(value, { stream: true });

                // Update state cumulatively (React will re-render for every chunk)
                setResponse((prev) => prev + chunk);
            }
            // ---------------------------
        } catch (error) {
            console.error('Error:', error);
            setResponse(
                'Error connecting to the Brain 🧠. Is the Python server running?'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
            <h1>🤖 AI Agent Interface</h1>

            <form onSubmit={handleSubmit}>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask your agent something..."
                    rows={4}
                    style={{ width: '100%', padding: '10px', fontSize: '16px' }}
                />
                <br />
                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        marginTop: '10px',
                        padding: '10px 20px',
                        cursor: 'pointer',
                    }}
                >
                    {isLoading ? 'Thinking...' : 'Send to Python'}
                </button>
            </form>

            {response && (
                <div
                    style={{
                        marginTop: '20px',
                        padding: '15px',
                        background: '#f0f0f0',
                        borderRadius: '8px',
                        textAlign: 'left',
                    }}
                >
                    <strong>Agent says:</strong>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{response}</p>
                </div>
            )}
        </div>
    );
}

export default App;
