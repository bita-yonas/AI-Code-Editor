"use strict";
import theme from "./theme.js";
import { sourceEditor } from "./ide.js";

const API_URL = "http://localhost:3000/api/chat";

console.log("ai.js loaded");

const THREAD = [
  {
    role: "system",
    content:
      `You are an AI coding assistant integrated into Judge0 IDE. Help users write, debug, and optimize code.`.trim(),
  },
];

// Add these suggestions
const SUGGESTIONS = [
  "Explain this code",
  "How do I fix",
  "What does this error mean",
  "How can I optimize",
  "Debug this code",
  "Help me understand",
  "What's wrong with",
  "How to implement",
  "Best practices for",
  "Convert this code to",
];

// Add autocomplete styles
const autocompleteStyles = `
    .autocomplete-container {
        position: absolute;
        bottom: 100%;
        left: 0;
        right: 0;
        background: var(--chat-bg-color);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        margin-bottom: 8px;
        max-height: 200px;
        overflow-y: auto;
        display: none;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
    }

    .autocomplete-item {
        padding: 8px 16px;
        cursor: pointer;
        transition: background-color 0.2s;
        color: var(--ai-message-text);
    }

    .autocomplete-item:hover,
    .autocomplete-item.selected {
        background: var(--user-message-bg);
        color: var(--user-message-text);
    }

    #judge0-chat-form {
        position: relative;
    }
`;

async function callAI(messages) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error calling AI:", error);
    return "Sorry, I encountered an error processing your request.";
  }
}

function createMessageElement(content, isUser = false) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add(
    "chat-message",
    isUser ? "user-message" : "ai-message"
  );

  // Add avatar
  const avatar = document.createElement("div");
  avatar.classList.add("chat-avatar");
  avatar.innerHTML = isUser
    ? '<i class="user circle icon"></i>'
    : '<i class="robot icon"></i>';

  // Add message content
  const messageContent = document.createElement("div");
  messageContent.classList.add("message-content");

  if (isUser) {
    messageContent.innerText = content;
  } else {
    messageContent.innerHTML = DOMPurify.sanitize(marked.parse(content));
    // Add syntax highlighting to code blocks
    messageContent.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  }

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(messageContent);
  return messageDiv;
}

// Add custom CSS to the page
const style = document.createElement("style");
style.textContent = `
    #judge0-chat-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--chat-bg-color);
        border: none;
        margin: 0;
        padding: 0;
    }

    #judge0-chat-messages {
        flex-grow: 1;
        overflow-y: auto;
        padding: 1rem;
        scroll-behavior: smooth;
    }

    #judge0-chat-input-container {
        padding: 1rem;
        border-top: 1px solid var(--border-color);
        background: var(--chat-bg-color);
        margin: 0;
    }

    .chat-message {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        padding: 0.5rem;
        border-radius: 8px;
        animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .chat-avatar {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--avatar-bg);
        flex-shrink: 0;
    }

    .chat-avatar i {
        font-size: 1.5rem;
        color: var(--avatar-color);
    }

    .message-content {
        flex-grow: 1;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        background: var(--message-bg);
    }

    .user-message .message-content {
        background: var(--user-message-bg);
        color: var(--user-message-text);
    }

    .ai-message .message-content {
        background: var(--ai-message-bg);
        color: var(--ai-message-text);
        border: 1px solid var(--border-color);
    }

    #judge0-chat-form {
        position: relative;
        margin: 0;
        padding: 0;
    }

    #judge0-chat-user-input {
        width: 100% !important;
        padding: 0.8rem 3rem 0.8rem 1.2rem !important;
        border-radius: 20px !important;
        background: var(--input-bg) !important;
        color: var(--ai-message-text) !important;
        border: 1px solid var(--border-color) !important;
        font-size: 1rem !important;
        line-height: 1.5 !important;
        transition: all 0.2s ease-in-out !important;
    }

    #judge0-chat-user-input:focus {
        outline: none !important;
        border-color: var(--avatar-color) !important;
        box-shadow: 0 0 0 2px rgba(33, 133, 208, 0.2) !important;
    }

    #judge0-chat-form i.icon {
        position: absolute;
        right: 1.2rem;
        top: 50%;
        transform: translateY(-50%);
        cursor: pointer;
        color: var(--avatar-color);
        transition: all 0.2s ease;
        font-size: 1.2rem;
    }

    #judge0-chat-form:hover i.icon {
        transform: translateY(-50%) scale(1.1);
        color: var(--avatar-color);
    }

    #judge0-chat-form.loading i.icon {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: translateY(-50%) rotate(0deg); }
        to { transform: translateY(-50%) rotate(360deg); }
    }

    /* Code block styling */
    .message-content pre {
        background: var(--code-bg) !important;
        border-radius: 6px;
        padding: 1rem !important;
        margin: 0.5rem 0 !important;
    }

    .message-content code {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.9em;
    }

    /* Theme-specific variables */
    :root {
        --chat-bg-color: #f5f7f9;
        --border-color: #e0e0e0;
        --avatar-bg: #ffffff;
        --avatar-color: #2185d0;
        --message-bg: #ffffff;
        --user-message-bg: #007bff;
        --user-message-text: #ffffff;
        --ai-message-bg: #ffffff;
        --ai-message-text: #2d2d2d;
        --input-bg: #ffffff;
        --code-bg: #2d2d2d;
    }

    /* Dark theme */
    [data-theme="dark"] {
        --chat-bg-color: #1e1e1e;
        --border-color: #333333;
        --avatar-bg: #2d2d2d;
        --avatar-color: #4dabf7;
        --message-bg: #2d2d2d;
        --user-message-bg: #254052;
        --user-message-text: #ffffff;
        --ai-message-bg: #2d2d2d;
        --ai-message-text: #ffffff;
        --input-bg: #2d2d2d;
        --code-bg: #1e1e1e;
    }

    ${autocompleteStyles}
`;

document.head.appendChild(style);

document.addEventListener("DOMContentLoaded", function () {
  const chatForm = document.getElementById("judge0-chat-form");
  const userInput = document.getElementById("judge0-chat-user-input");
  const messagesContainer = document.getElementById("judge0-chat-messages");

  // Add placeholder message
  const welcomeMessage = createMessageElement(
    "Hi! I'm your coding assistant. How can I help you today?",
    false
  );
  messagesContainer.appendChild(welcomeMessage);

  // Create autocomplete container
  const autocompleteContainer = document.createElement("div");
  autocompleteContainer.className = "autocomplete-container";
  chatForm.appendChild(autocompleteContainer);

  console.log("Autocomplete container created:", autocompleteContainer);

  // Function to get AI-generated suggestions
  async function getAISuggestions(userInput) {
    try {
      console.log("Getting AI suggestions for:", userInput);
      const currentCode = sourceEditor.getValue();
      const language = sourceEditor.getModel().getLanguageId();

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a coding assistant. Generate 5 relevant question suggestions based on the user's input and code context. Respond with ONLY an array of strings, nothing else.",
            },
            {
              role: "user",
              content: `
Code context:
\`\`\`${language}
${currentCode}
\`\`\`

User is typing: ${userInput}

Generate 5 relevant question suggestions.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("AI Response:", data);
      return JSON.parse(data.response); // Expecting an array of strings
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      return []; // Return empty array if there's an error
    }
  }

  // Debounce function to prevent too many API calls
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Update the input handler to use AI suggestions
  userInput.addEventListener(
    "input",
    debounce(async () => {
      console.log("Input event triggered");
      const value = userInput.value.trim();
      if (value.length < 2) {
        console.log("Input too short");
        autocompleteContainer.style.display = "none";
        return;
      }

      console.log("Getting suggestions...");
      const suggestions = await getAISuggestions(value);
      console.log("Received suggestions:", suggestions);

      if (suggestions.length === 0) {
        console.log("No suggestions received");
        autocompleteContainer.style.display = "none";
        return;
      }

      autocompleteContainer.innerHTML = suggestions
        .map(
          (suggestion, index) => `
            <div class="autocomplete-item" data-index="${index}">
                ${suggestion}
            </div>
        `
        )
        .join("");

      console.log("Showing suggestions");
      autocompleteContainer.style.display = "block";
    }, 300)
  ); // Reduced debounce time for more responsive suggestions

  // Handle clicks on suggestions
  autocompleteContainer.addEventListener("click", (e) => {
    const item = e.target.closest(".autocomplete-item");
    if (item) {
      userInput.value = item.textContent.trim();
      autocompleteContainer.style.display = "none";
      userInput.focus();
    }
  });

  // Hide suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (!autocompleteContainer.contains(e.target) && e.target !== userInput) {
      autocompleteContainer.style.display = "none";
    }
  });

  chatForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const userInputValue = userInput.value.trim();
    if (userInputValue === "") return;

    // Disable input and show loading
    userInput.disabled = true;
    chatForm.classList.add("loading");

    // Add user message
    const userMessage = createMessageElement(userInputValue, true);
    messagesContainer.appendChild(userMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Clear input
    userInput.value = "";

    // Add to thread with code context
    THREAD.push({
      role: "user",
      content: `
Code context:
\`\`\`
${sourceEditor.getValue()}
\`\`\`

User message: ${userInputValue}
`.trim(),
    });

    // Get AI response
    const aiResponseValue = await callAI(THREAD);
    THREAD.push({
      role: "assistant",
      content: aiResponseValue,
    });

    // Display AI response
    const aiMessage = createMessageElement(aiResponseValue, false);
    messagesContainer.appendChild(aiMessage);

    // Re-enable input and scroll
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    userInput.disabled = false;
    chatForm.classList.remove("loading");
    userInput.focus();
  });

  // Function to find bugs in the user's code
  async function findBugsInCode() {
    try {
      console.log("Finding bugs in the code...");
      const currentCode = sourceEditor.getValue();
      const language = sourceEditor.getModel().getLanguageId();

      console.log("Current code:", currentCode);
      console.log("Language:", language);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a coding assistant. Analyze the provided code and identify any potential bugs or issues. Respond with a list of bugs or issues found, formatted as plain text with each bug on a new line.",
            },
            {
              role: "user",
              content: `
Code context:
\`\`\`${language}
${currentCode}
\`\`\`

Identify any potential bugs or issues in the code.`,
            },
          ],
        }),
      });

      console.log("Request sent to API");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Bug Finder Response:", data);

      // Clean up the response by removing markdown-style backticks
      const cleanResponse = data.response.replace(/```(?:\w+)?\n?/g, "");
      const bugs = cleanResponse
        .split("\n")
        .filter((line) => line.trim() !== "");
      return bugs;
    } catch (error) {
      console.error("Error finding bugs:", error);
      return [
        "Sorry, I encountered an error while trying to find bugs in your code.",
      ]; // Return error message if there's an error
    }
  }

  // Function to display bug report
  async function displayBugReport() {
    console.log("Display Bug Report triggered");
    const bugs = await findBugsInCode();
    const bugReportContainer = document.getElementById("bug-report-container");
    if (bugReportContainer) {
      bugReportContainer.innerHTML =
        "<h3>Bug Report:</h3><ul>" +
        bugs.map((bug) => `<li>${bug}</li>`).join("") +
        "</ul>";
      console.log("Bug report displayed");
    } else {
      console.error("Bug report container not found");
    }
  }

  // Add a button to trigger bug finding
  const bugFinderButton = document.createElement("button");
  bugFinderButton.textContent = "Find Bugs";
  bugFinderButton.className = "ui button";
  chatForm.appendChild(bugFinderButton);

  bugFinderButton.addEventListener("click", displayBugReport);

  // Tab switching logic
  const tabItems = document.querySelectorAll(".ui.menu .item");
  const tabSegments = document.querySelectorAll(".ui.tab.segment");

  tabItems.forEach((item) => {
    item.addEventListener("click", function () {
      const tabName = this.getAttribute("data-tab");
      tabItems.forEach((i) => i.classList.remove("active"));
      tabSegments.forEach((segment) => segment.classList.remove("active"));

      this.classList.add("active");
      document
        .querySelector(`.ui.tab.segment[data-tab="${tabName}"]`)
        .classList.add("active");
    });
  });

  // Use event delegation on the Bug Finder tab content container
  const bugFinderSegment = document.querySelector(
    '.ui.tab.segment[data-tab="bug-finder"]'
  );
  if (bugFinderSegment) {
    bugFinderSegment.addEventListener("click", function (e) {
      if (e.target && e.target.id === "find-bugs-button") {
        console.log("Find Bugs button clicked");
        displayBugReport();
      }
    });
  } else {
    console.error("Bug Finder segment not found");
  }

  console.log("Event listeners for Bug Finder are set up.");
});

// Keyboard shortcuts
document.addEventListener("keydown", function (e) {
  if (e.metaKey || e.ctrlKey) {
    if (e.key === "p") {
      e.preventDefault();
      document.getElementById("judge0-chat-user-input").focus();
    }
  }
});
