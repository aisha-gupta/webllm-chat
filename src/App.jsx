import { useEffect, useState } from "react";
import * as webllm from "@mlc-ai/web-llm";
import "./app.scss";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "system",
      content: "You are a helpful assistant that helps people find information.",
    }
  ]);
  const [engine, setEngine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [progress, setProgress] = useState("");

  useEffect(() => {
    const model = "Phi-3-mini-4k-instruct-q4f16_1-MLC";
    
    // For even faster response, try this smaller model:
    // const model = "TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC";
    
    webllm
      .CreateMLCEngine(model, {
        initProgressCallback: (info) => {
          console.log("Model loading progress:", info);
          setProgress(`Loading: ${(info.progress * 100).toFixed(1)}%`);
        },
      })
      .then((engine) => {
        setEngine(engine);
        setInitializing(false);
        setProgress("");
        console.log("WebLLM initialized successfully!");
      })
      .catch((err) => {
        console.error("WebLLM failed to initialize:", err);
        setInitializing(false);
        alert("Model failed to load. Try a smaller model or check your internet.");
      });
  }, []);

  async function sendMessageToLlm() {
    if (!input.trim() || loading || !engine) return;

    const userMessage = {
      role: "user",
      content: input,
    };

    // Update UI immediately with user message
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Create a proper messages array for the API
      const chatHistory = [...messages, userMessage];
      
      const reply = await engine.chat.completions.create({
        messages: chatHistory,
        stream: false, // Set to true if you want streaming
        max_tokens: 500, // Limit response length for faster replies
      });

      const assistantMessage = {
        role: "assistant",
        content: reply.choices[0].message.content,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error("Error getting response:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  // Quick reply suggestions
  const quickReplies = [
    "Hello!",
    "What can you do?",
    "Tell me a joke",
    "Help me with coding"
  ];

  return (
    <main>
      <section>
        <div className="conversation-area">
          {initializing && (
            <div className="loading-overlay">
              <div className="loading-text">{progress}</div>
              <div className="loading-subtitle">This may take a few minutes...</div>
            </div>
          )}
          
          <div className="messages">
            {messages.filter(message => message.role !== "system").map((message, index) => (
              <div className={`message ${message.role}`} key={index}>
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="message assistant loading">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Reply Buttons */}
          {!initializing && messages.length <= 2 && (
            <div className="quick-replies">
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  className="quick-reply-btn"
                  onClick={() => {
                    setInput(reply);
                    setTimeout(() => sendMessageToLlm(), 100);
                  }}
                  disabled={loading}
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          <div className="input-area">
            <input 
              onChange={(e) => setInput(e.target.value)}
              value={input}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessageToLlm();
                }
              }}
              type="text" 
              placeholder="Message LLM" 
              disabled={loading || initializing}
            />
            <button 
              onClick={sendMessageToLlm}
              disabled={loading || initializing || !input.trim()}
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;