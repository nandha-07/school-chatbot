// Session management
const sessionId = "session_" + Math.random().toString(36).substring(2, 15);

// DOM elements
const chatArea = document.getElementById("chatArea");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// Auto-resize textarea
function autoResize(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

// Handle Enter key
function handleKeyDown(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// Quick subject buttons
function askSubject(subject) {
  const prompts = {
    Math: "Can you help me with math? I'd like to learn some key concepts!",
    Science:
      "Can you help me understand science better? What are some cool topics?",
    English:
      "Can you help me improve my English? Any grammar or writing tips?",
    History:
      "Can you tell me about an interesting historical event?",
    Geography:
      "Can you help me learn about geography? Tell me something interesting!",
    "Study Tips":
      "What are some effective study tips for students?",
  };
  messageInput.value = prompts[subject] || `Help me with ${subject}`;
  sendMessage();
}

// Simple markdown parser
function parseMarkdown(text) {
  let html = text;

  // Code blocks
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, "<pre><code>$2</code></pre>");

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Headers
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Unordered lists
  html = html.replace(/^\* (.+)$/gm, "<li>$1</li>");
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");

  // Line breaks
  html = html.replace(/\n/g, "<br>");

  return html;
}

// Remove welcome card
function removeWelcome() {
  const welcome = document.querySelector(".welcome-card");
  if (welcome) {
    welcome.style.animation = "fadeIn 0.3s ease reverse";
    setTimeout(() => welcome.remove(), 280);
  }
}

// Add message to chat
function addMessage(content, type) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = type === "bot" ? "🎓" : "👩‍🎓";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  if (type === "bot") {
    bubble.innerHTML = parseMarkdown(content);
  } else {
    bubble.textContent = content;
  }

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(bubble);
  chatArea.appendChild(messageDiv);

  scrollToBottom();
}

// Show typing indicator
function showTyping() {
  const typingDiv = document.createElement("div");
  typingDiv.className = "typing-indicator";
  typingDiv.id = "typingIndicator";

  typingDiv.innerHTML = `
    <div class="avatar" style="background: linear-gradient(135deg, var(--primary), var(--accent))">🎓</div>
    <div class="typing-dots">
      <span></span><span></span><span></span>
    </div>
  `;

  chatArea.appendChild(typingDiv);
  scrollToBottom();
}

// Remove typing indicator
function hideTyping() {
  const typing = document.getElementById("typingIndicator");
  if (typing) typing.remove();
}

// Scroll to bottom
function scrollToBottom() {
  chatArea.scrollTop = chatArea.scrollHeight;
}

// Send message
async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  // Remove welcome card
  removeWelcome();

  // Add user message
  addMessage(message, "user");

  // Clear input
  messageInput.value = "";
  messageInput.style.height = "auto";

  // Disable send
  sendBtn.disabled = true;

  // Show typing
  showTyping();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sessionId }),
    });

    const data = await response.json();

    hideTyping();

    if (data.reply) {
      addMessage(data.reply, "bot");
    } else {
      addMessage("Oops! Something went wrong. Please try again. 😅", "bot");
    }
  } catch (error) {
    hideTyping();
    addMessage(
      "Couldn't connect to the server. Make sure it's running! 🔌",
      "bot"
    );
  }

  sendBtn.disabled = false;
  messageInput.focus();
}

// Clear chat
async function clearChat() {
  try {
    await fetch("/api/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
  } catch (e) {
    // ignore
  }

  chatArea.innerHTML = `
    <div class="welcome-card">
      <div class="welcome-emoji">🏫</div>
      <h2>Welcome to SchoolBuddy!</h2>
      <p>I'm here to help you with your studies. Ask me anything about:</p>
      <div class="subject-tags">
        <span class="tag" onclick="askSubject('Math')">🔢 Math</span>
        <span class="tag" onclick="askSubject('Science')">🔬 Science</span>
        <span class="tag" onclick="askSubject('English')">📝 English</span>
        <span class="tag" onclick="askSubject('History')">🏛️ History</span>
        <span class="tag" onclick="askSubject('Geography')">🌍 Geography</span>
        <span class="tag" onclick="askSubject('Study Tips')">💡 Study Tips</span>
      </div>
    </div>
  `;
}

// Focus input on load
messageInput.focus();
