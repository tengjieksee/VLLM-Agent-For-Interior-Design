require('dotenv').config(); // Load environment variables
const express = require('express');
const session = require('express-session');
const { Groq } = require('groq-sdk');
const fetch = require('node-fetch'); // Add fetch for image API
const app = express();
const PORT = 3000;

// Initialize Groq client
const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
});

// Middleware setup
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_strong_session_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize conversation history
function initConversation() {
  return [
    {
      role: "system",
      content: `You are a world-class interior designer. Be creative, professional, and helpful. Keep responses concise but informative.
      
      IMPORTANT: 
      - When the user requests a visual representation (e.g., "draw", "sketch", "show me", "visualize"), 
        you MUST generate an image by starting your response with [DRAW: <detailed_prompt>]
      - The prompt must be highly detailed (50+ words) including style, colors, perspective, and key elements
      - After the image token, provide your regular text response
      - Example: [DRAW: A modern minimalist living room with floor-to-ceiling windows overlooking a city skyline at sunset...] Here's a visualization of your space...`
    }
  ];
}

// ====== MODIFIED SECTION START ======
// Custom root route with two-column layout
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Interior Design Assistant</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
          height: 100vh;
          display: flex;
          overflow: hidden;
        }
        
        /* Left pane - black background */
        #left-pane {
          width: 50%;
          background: #000; /* Solid black */
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        .logo {
          color: white;
          font-size: 2.5rem;
          font-weight: 300;
          text-align: center;
          padding: 20px;
          z-index: 2;
        }
        
        .name_author {
          color: white;
          font-size: 1.0rem;
          font-weight: 300;
          text-align: center;
          padding: 20px;
          z-index: 2;
        }
        
        #design-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        #design-image {
          max-width: 90%;
          max-height: 90%;
          object-fit: contain;
          transition: opacity 0.3s;
        }
        
        /* Right pane - chat interface */
        #right-pane {
          width: 50%;
          display: flex;
          flex-direction: column;
          background: #f8f9fa;
          padding: 20px;
        }
        
        .chat-header {
          text-align: center;
          padding: 15px 0;
          border-bottom: 1px solid #eee;
          margin-bottom: 20px;
        }
        
        .chat-header h1 {
          color: #333;
          font-weight: 500;
        }
        
        #messages {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          margin-bottom: 20px;
          border-radius: 10px;
          background: white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        
        .message {
          padding: 12px 15px;
          margin: 8px 0;
          border-radius: 18px;
          max-width: 80%;
          line-height: 1.4;
        }
        
        .user {
          background: #e3f2fd;
          margin-left: auto;
          border-bottom-right-radius: 5px;
        }
        
        .assistant {
          background: #f1f8e9;
          margin-right: auto;
          border-bottom-left-radius: 5px;
        }
        
        .image-container {
          margin-top: 8px;
          border-radius: 8px;
          overflow: hidden;
          background: #f0f0f0;
        }
        
        .image-container img {
          width: 100%;
          display: block;
        }
        
        #input-area {
          display: flex;
          gap: 10px;
        }
        
        #user-input {
          flex: 1;
          padding: 14px;
          border: 1px solid #ddd;
          border-radius: 25px;
          font-size: 16px;
          outline: none;
          transition: border-color 0.3s;
        }
        
        #user-input:focus {
          border-color: #4285f4;
        }
        
        #send {
          padding: 0 25px;
          background: #4285f4;
          color: white;
          border: none;
          border-radius: 25px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
        }
        
        #send:hover {
          background: #3367d6;
        }
        
        .reset-btn {
          background: #f44336;
          margin-top: 10px;
          width: 100%;
        }
        
        .reset-btn:hover {
          background: #d32f2f;
        }
      </style>
    </head>
    <body>
      <!-- Left half: Black background with image canvas -->
      <div id="left-pane">
        <div id="design-canvas">
          <img id="design-image" src="" alt="Design visualization" style="display: none;">
          <div class="logo" id="initial-logo">Interior Design Studio</div>
          <div class="name_author">by Teng Jiek See</div>
        </div>
      </div>
      
      <!-- Right half: Chat interface -->
      <div id="right-pane">
        <div class="chat-header">
          <h1>AI Interior Designer</h1>
        </div>
        
        <div id="messages"></div>
        
        <div id="input-area">
          <input type="text" id="user-input" placeholder="Describe your design needs...">
          <button id="send">Send</button>
        </div>
        
        <button class="reset-btn" id="reset">New Conversation</button>
      </div>

      <script>
        document.addEventListener('DOMContentLoaded', () => {
          const messagesDiv = document.getElementById('messages');
          const userInput = document.getElementById('user-input');
          const sendButton = document.getElementById('send');
          const resetButton = document.getElementById('reset');
          const designImage = document.getElementById('design-image');
          const initialLogo = document.getElementById('initial-logo');

          // Add message to chat window
          function addMessage(content, isUser, imageUrl = null) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message');
            messageDiv.classList.add(isUser ? 'user' : 'assistant');
            
            // Add text content
            const textDiv = document.createElement('div');
            textDiv.textContent = content;
            messageDiv.appendChild(textDiv);
            
            // Add image if provided
            if (imageUrl) {
              const imgContainer = document.createElement('div');
              imgContainer.classList.add('image-container');
              
              const img = document.createElement('img');
              img.src = imageUrl;
              img.alt = "Design visualization";
              
              imgContainer.appendChild(img);
              messageDiv.appendChild(imgContainer);
            }
            
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
          }

          // Update left pane with new design
          function updateDesign(imageUrl) {
            if (imageUrl) {
              // Hide logo, show image
              initialLogo.style.display = 'none';
              designImage.style.display = 'block';
              designImage.src = imageUrl;
              designImage.style.opacity = 0;
              
              // Fade in new image
              setTimeout(() => {
                designImage.style.opacity = 1;
              }, 50);
            } else {
              // Reset to initial state
              designImage.style.display = 'none';
              initialLogo.style.display = 'block';
            }
          }

          // Send message to server
          async function sendMessage() {
            const message = userInput.value.trim();
            if (!message) return;

            // Display user message immediately
            addMessage(message, true);
            userInput.value = '';
            userInput.disabled = true;
            sendButton.disabled = true;

            try {
              const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
              });

              const data = await response.json();
              
              if (data.response) {
                // Update left pane if image was generated
                if (data.image) {
                  updateDesign(data.image);
                }
                
                // Display assistant response
                addMessage(data.response, false, data.image);
              } else if (data.error) {
                addMessage('Error: ' + (data.details || 'Failed to get response'), false);
              }
            } catch (error) {
              addMessage('Network error. Please check your connection.', false);
              console.error('Fetch error:', error);
            } finally {
              userInput.disabled = false;
              sendButton.disabled = false;
              userInput.focus();
            }
          }

          // Reset conversation
          async function resetConversation() {
            try {
              await fetch('/reset', { method: 'POST' });
              messagesDiv.innerHTML = '';
              updateDesign(null);
              addMessage("New conversation started! How can I help with your interior design today?", false);
            } catch (error) {
              addMessage("Error resetting conversation. Please refresh the page.", false);
            }
          }

          // Event listeners
          sendButton.addEventListener('click', sendMessage);
          resetButton.addEventListener('click', resetConversation);
          
          userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
          });

          // Initial welcome message
          addMessage("Hello! I'm your AI interior designer. How can I help with your space today?", false);
        });
      </script>
    </body>
    </html>
  `);
});
// ====== MODIFIED SECTION END ======

// ====== NEW IMAGE GENERATION FUNCTION ======
async function generateImage(prompt) {
  const url = 'https://gateway.pixazo.ai/flux-1-schnell/v1/getData';
  const data = {
    prompt: prompt,
    num_steps: 4,
    seed: Math.floor(Math.random() * 10000), // Random seed for variety
    height: 512,
    width: 512
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Ocp-Apim-Subscription-Key': process.env.PIXAZO_API_KEY
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Pixazo API error: ${response.status}`);
    }

    const result = await response.json();
    return result.output;
  } catch (error) {
    console.error('Image generation failed:', error);
    throw error;
  }
}

// Chat endpoint with memory and image generation
app.post('/chat', async (req, res) => {
  try {
    // Initialize conversation history if not exists
    if (!req.session.conversation) {
      req.session.conversation = initConversation();
    }

    const userMessage = req.body.message?.trim();
    
    if (!userMessage) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Add user message to conversation
    req.session.conversation.push({
      role: "user",
      content: userMessage
    });

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: req.session.conversation,
      model: "openai/gpt-oss-20b", // Using a better model for instruction following
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.9,
      stream: false
    });

    // Get and store assistant response
    let botResponse = chatCompletion.choices[0].message.content;
    
    // Check if response contains image generation request
    let imageUrl = null;
    const drawRegex = /\[DRAW:\s*(.*?)\]/;
    const drawMatch = botResponse.match(drawRegex);
    
    if (drawMatch) {
      const imagePrompt = drawMatch[1].trim();
      
      try {
        // Generate image
        imageUrl = await generateImage(imagePrompt);
        
        // Clean up the response (remove the [DRAW] token)
        botResponse = botResponse.replace(drawRegex, '').trim();
      } catch (error) {
        // Fallback if image generation fails
        botResponse = `⚠️ Could not generate image: ${error.message}\n\n${botResponse}`;
      }
    }

    // Add assistant response to conversation (without the [DRAW] token)
    req.session.conversation.push({
      role: "assistant",
      content: botResponse
    });

    // Trim conversation if too long (keep last 10 messages + system)
    if (req.session.conversation.length > 12) {
      req.session.conversation = [
        req.session.conversation[0], // Keep system message
        ...req.session.conversation.slice(-11)
      ];
    }

    // Send response with optional image
    res.json({ 
      response: botResponse,
      image: imageUrl 
    });

  } catch (error) {
    console.error('Groq API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to process request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
    
    // Reset conversation on error to prevent corrupted state
    req.session.conversation = initConversation();
  }
});

// Reset conversation endpoint
app.post('/reset', (req, res) => {
  req.session.conversation = initConversation();
  res.json({ status: 'Conversation reset' });
});

// Static files middleware MOVED TO END
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Open your browser and go to: http://localhost:3000');
  console.log('\x1b[33m%s\x1b[0m', '⚠️  Remember to set GROQ_API_KEY and PIXAZO_API_KEY in .env file!');
});