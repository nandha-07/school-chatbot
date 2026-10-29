require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Groq setup
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// System instruction for school context
const SYSTEM_PROMPT = `You are "SchoolBuddy", a friendly and helpful AI assistant for school students.
Your role:
- Help students with homework, concepts, and study tips across all subjects (Math, Science, English, History, etc.)
- Explain things in a simple, easy-to-understand way suitable for school students.
- Be encouraging and positive. Use emojis occasionally to keep it fun! 🎓📚
- If a student asks something inappropriate or off-topic, gently guide them back to academics.
- Keep answers concise but thorough. Use examples when helpful.
- You can also help with study schedules, exam preparation tips, and project ideas.
Remember: You are talking to school students, so keep language age-appropriate and supportive.`;

// Store chat sessions (in-memory, per session)
const chatSessions = new Map();

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get or create session history
    if (!chatSessions.has(sessionId)) {
      chatSessions.set(sessionId, []);
    }
    const history = chatSessions.get(sessionId);

    // Build messages array
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: message },
    ];

    const chatCompletion = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    // Save to history
    history.push(
      { role: "user", content: message },
      { role: "assistant", content: reply }
    );

    console.log("✅ Response generated");
    res.json({ reply });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Something went wrong. Please try again!" });
  }
});

// Clear session
app.post("/api/clear", (req, res) => {
  const { sessionId } = req.body;
  if (sessionId && chatSessions.has(sessionId)) {
    chatSessions.delete(sessionId);
  }
  res.json({ message: "Chat cleared!" });
});

app.listen(PORT, () => {
  console.log(`🏫 SchoolBuddy server running at http://localhost:${PORT}`);
});
