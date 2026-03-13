/**
 * app.js: JS code for the ADK Bidi-streaming demo app.
 */

/**
 * WebSocket handling
 */

// Connect the server with a WebSocket connection
let userId = "demo-user-" + Math.random().toString(36).substring(7);
let sessionId = "demo-session-" + Math.random().toString(36).substring(7);
let websocket = null;
let is_audio = false;

// DOM Elements for User/Session configuration
const userIdInput = document.getElementById("userIdInput");
const sessionIdInput = document.getElementById("sessionIdInput");
const newSessionBtn = document.getElementById("newSessionBtn");

// Initialize inputs
userIdInput.value = userId;
sessionIdInput.value = sessionId;

function updateConnectionConfig() {
  userId = userIdInput.value.trim() || "demo-user";
  sessionId = sessionIdInput.value.trim() || sessionId; // Keep existing if empty? Or generate new?

  if (websocket && websocket.readyState === WebSocket.OPEN) {
    addSystemMessage("Reconnecting with updated user/session...");
    websocket.close();
  } else {
    connectWebsocket();
  }
}

function generateNewSession() {
  sessionId = "demo-session-" + Math.random().toString(36).substring(7);
  sessionIdInput.value = sessionId;
  updateConnectionConfig();
}

userIdInput.addEventListener("change", updateConnectionConfig);
sessionIdInput.addEventListener("change", updateConnectionConfig);
newSessionBtn.addEventListener("click", generateNewSession);

// Get checkbox elements for RunConfig options
const enableProactivityCheckbox = document.getElementById("enableProactivity");
const enableAffectiveDialogCheckbox = document.getElementById("enableAffectiveDialog");

// Reconnect WebSocket when RunConfig options change
function handleRunConfigChange() {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    addSystemMessage("Reconnecting with updated settings...");
    addConsoleEntry('outgoing', 'Reconnecting due to settings change', {
      proactivity: enableProactivityCheckbox.checked,
      affective_dialog: enableAffectiveDialogCheckbox.checked
    }, '🔄', 'system');
    websocket.close();
    // connectWebsocket() will be called by onclose handler after delay
  }
}

// Add change listeners to RunConfig checkboxes
enableProactivityCheckbox.addEventListener("change", handleRunConfigChange);
enableAffectiveDialogCheckbox.addEventListener("change", handleRunConfigChange);

// Build WebSocket URL with RunConfig options as query parameters
function getWebSocketUrl() {
  // Use wss:// for HTTPS pages, ws:// for HTTP (localhost development)
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const baseUrl = wsProtocol + "//" + window.location.host + "/ws/" + userId + "/" + sessionId;
  const params = new URLSearchParams();

  // Add proactivity option if checked
  if (enableProactivityCheckbox && enableProactivityCheckbox.checked) {
    params.append("proactivity", "true");
  } else {
    params.append("proactivity", "false");
  }

  // Add affective dialog option if checked
  if (enableAffectiveDialogCheckbox && enableAffectiveDialogCheckbox.checked) {
    params.append("affective_dialog", "true");
  } else {
    params.append("affective_dialog", "false");
  }

  const queryString = params.toString();
  return queryString ? baseUrl + "?" + queryString : baseUrl;
}

// Get DOM elements
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("message");
const messagesDiv = document.getElementById("messages");
const statusIndicator = document.getElementById("statusIndicator");
const statusText = document.getElementById("statusText");
const consoleContent = document.getElementById("consoleContent");
const clearConsoleBtn = document.getElementById("clearConsole");

// Filter Elements
const filterDropdownBtn = document.getElementById("filterDropdownBtn");
const filterDropdownContent = document.getElementById("filterDropdownContent");
const filterCheckboxes = {
  'type-text': document.getElementById("filterText"),
  'type-audio': document.getElementById("filterAudio"),
  'type-tool': document.getElementById("filterTools"),
  'type-system': document.getElementById("filterSystem"),
  'type-error': document.getElementById("filterError")
};

let currentMessageId = null;
let currentBubbleElement = null;
let currentInputTranscriptionId = null;
let currentInputTranscriptionElement = null;
let currentOutputTranscriptionId = null;
let currentOutputTranscriptionElement = null;
let inputTranscriptionFinished = false; // Track if input transcription is complete for this turn

// Filter Logic
function toggleFilterDropdown() {
  filterDropdownContent.classList.toggle("show");
  // Update button arrow direction
  const icon = filterDropdownBtn.querySelector(".filter-icon");
  icon.style.transform = filterDropdownContent.classList.contains("show") ? "rotate(180deg)" : "rotate(0deg)";
}

// Close dropdown when clicking outside
window.addEventListener("click", function (event) {
  if (!event.target.matches('.filter-btn') && !event.target.closest('.filter-dropdown')) {
    if (filterDropdownContent.classList.contains('show')) {
      filterDropdownContent.classList.remove('show');
      const icon = filterDropdownBtn.querySelector(".filter-icon");
      icon.style.transform = "rotate(0deg)";
    }
  }
});

filterDropdownBtn.addEventListener("click", toggleFilterDropdown);

function isTypeFiltered(type) {
  const checkbox = filterCheckboxes[type];
  return checkbox ? !checkbox.checked : false;
}

function updateFilters() {
  for (const [type, checkbox] of Object.entries(filterCheckboxes)) {
    const elements = document.querySelectorAll(`.console-entry.${type}`);
    elements.forEach(el => {
      if (checkbox.checked) {
        el.classList.remove('hidden-by-filter');
      } else {
        el.classList.add('hidden-by-filter');
      }
    });
  }
}

// Add listeners to filter checkboxes
for (const checkbox of Object.values(filterCheckboxes)) {
  checkbox.addEventListener("change", updateFilters);
}

// Helper function to clean spaces between CJK characters
// Removes spaces between Japanese/Chinese/Korean characters while preserving spaces around Latin text
function cleanCJKSpaces(text) {
  // CJK Unicode ranges: Hiragana, Katakana, Kanji, CJK Unified Ideographs, Fullwidth forms
  const cjkPattern = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\uff00-\uffef]/;

  // Remove spaces between two CJK characters
  return text.replace(/(\S)\s+(?=\S)/g, (match, char1) => {
    // Get the character after the space(s)
    const nextCharMatch = text.match(new RegExp(char1 + '\\s+(.)', 'g'));
    if (nextCharMatch && nextCharMatch.length > 0) {
      const char2 = nextCharMatch[0].slice(-1);
      // If both characters are CJK, remove the space
      if (cjkPattern.test(char1) && cjkPattern.test(char2)) {
        return char1;
      }
    }
    return match;
  });
}

// Console logging functionality
function formatTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
}

function addConsoleEntry(type, content, data = null, emoji = null, author = null, isAudio = false) {
  // Determine type for filtering
  let filterType = 'type-system'; // Default

  if (type === 'error') {
    filterType = 'type-error';
  } else if (content.startsWith('Audio Response') || (data && data.content && data.content.parts && data.content.parts.some(p => p.inlineData))) {
    filterType = 'type-audio';
  } else if (content.startsWith('Tool Call') || content.startsWith('Tool Response') || content.startsWith('Code Execution') || content.startsWith('Executable Code')) {
    filterType = 'type-tool';
  } else if (type === 'incoming' || type === 'outgoing') {
    // Other incoming/outgoing messages are likely text or general info
    filterType = 'type-text';
  }

  // Check if this type is currently filtered out
  const isFiltered = isTypeFiltered(filterType);

  const entry = document.createElement("div");
  entry.className = `console-entry ${type} ${filterType}`;
  if (isFiltered) {
    entry.classList.add('hidden-by-filter');
  }

  const header = document.createElement("div");
  header.className = "console-entry-header";

  const leftSection = document.createElement("div");
  leftSection.className = "console-entry-left";

  // Add emoji icon if provided
  if (emoji) {
    const emojiIcon = document.createElement("span");
    emojiIcon.className = "console-entry-emoji";
    emojiIcon.textContent = emoji;
    leftSection.appendChild(emojiIcon);
  }

  // Add expand/collapse icon
  const expandIcon = document.createElement("span");
  expandIcon.className = "console-expand-icon";
  expandIcon.textContent = data ? "▶" : "";

  const typeLabel = document.createElement("span");
  typeLabel.className = "console-entry-type";
  typeLabel.textContent = type === 'outgoing' ? '↑ Upstream' : type === 'incoming' ? '↓ Downstream' : '⚠ Error';

  leftSection.appendChild(expandIcon);
  leftSection.appendChild(typeLabel);

  // Add author badge if provided
  if (author) {
    const authorBadge = document.createElement("span");
    authorBadge.className = "console-entry-author";
    authorBadge.textContent = author;
    authorBadge.setAttribute('data-author', author);
    leftSection.appendChild(authorBadge);
  }

  const timestamp = document.createElement("span");
  timestamp.className = "console-entry-timestamp";
  timestamp.textContent = formatTimestamp();

  header.appendChild(leftSection);
  header.appendChild(timestamp);

  const contentDiv = document.createElement("div");
  contentDiv.className = "console-entry-content";
  contentDiv.textContent = content;

  entry.appendChild(header);
  entry.appendChild(contentDiv);

  // JSON details (hidden by default)
  let jsonDiv = null;
  if (data) {
    jsonDiv = document.createElement("div");
    jsonDiv.className = "console-entry-json collapsed";
    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(data, null, 2);
    jsonDiv.appendChild(pre);
    entry.appendChild(jsonDiv);

    // Make entry clickable if it has data
    entry.classList.add("expandable");

    // Toggle expand/collapse on click
    entry.addEventListener("click", () => {
      const isExpanded = !jsonDiv.classList.contains("collapsed");

      if (isExpanded) {
        // Collapse
        jsonDiv.classList.add("collapsed");
        expandIcon.textContent = "▶";
        entry.classList.remove("expanded");
      } else {
        // Expand
        jsonDiv.classList.remove("collapsed");
        expandIcon.textContent = "▼";
        entry.classList.add("expanded");
      }
    });
  }

  consoleContent.appendChild(entry);
  consoleContent.scrollTop = consoleContent.scrollHeight;
}

function clearConsole() {
  consoleContent.innerHTML = '';
}

// Clear console button handler
clearConsoleBtn.addEventListener('click', clearConsole);

// Update connection status UI
function updateConnectionStatus(connected) {
  if (connected) {
    statusIndicator.classList.remove("disconnected");
    statusText.textContent = "Connected";
  } else {
    statusIndicator.classList.add("disconnected");
    statusText.textContent = "Disconnected";
  }
}

// Create a message bubble element
function createMessageBubble(text, isUser, isPartial = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user" : "agent"}`;

  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "bubble";

  const textP = document.createElement("p");
  textP.className = "bubble-text";
  textP.textContent = text;

  // Add typing indicator for partial messages
  if (isPartial && !isUser) {
    const typingSpan = document.createElement("span");
    typingSpan.className = "typing-indicator";
    textP.appendChild(typingSpan);
  }

  bubbleDiv.appendChild(textP);
  messageDiv.appendChild(bubbleDiv);

  return messageDiv;
}

// Create an image message bubble element
function createImageBubble(imageDataUrl, isUser) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user" : "agent"}`;

  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "bubble image-bubble";

  const img = document.createElement("img");
  img.src = imageDataUrl;
  img.className = "bubble-image";
  img.alt = "Captured image";

  bubbleDiv.appendChild(img);
  messageDiv.appendChild(bubbleDiv);

  return messageDiv;
}

// Update existing message bubble text
function updateMessageBubble(element, text, isPartial = false) {
  const textElement = element.querySelector(".bubble-text");

  // Remove existing typing indicator
  const existingIndicator = textElement.querySelector(".typing-indicator");
  if (existingIndicator) {
    existingIndicator.remove();
  }

  textElement.textContent = text;

  // Add typing indicator for partial messages
  if (isPartial) {
    const typingSpan = document.createElement("span");
    typingSpan.className = "typing-indicator";
    textElement.appendChild(typingSpan);
  }
}

// Add a system message
function addSystemMessage(text) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "system-message";
  messageDiv.textContent = text;
  messagesDiv.appendChild(messageDiv);
  scrollToBottom();
}

// Scroll to bottom of messages
function scrollToBottom() {
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Sanitize event data for console display (replace large audio data with summary)
function sanitizeEventForDisplay(event) {
  // Deep clone the event object
  const sanitized = JSON.parse(JSON.stringify(event));

  // Check for audio data in content.parts
  if (sanitized.content && sanitized.content.parts) {
    sanitized.content.parts = sanitized.content.parts.map(part => {
      if (part.inlineData && part.inlineData.data) {
        // Calculate byte size (base64 string length / 4 * 3, roughly)
        const byteSize = Math.floor(part.inlineData.data.length * 0.75);
        return {
          ...part,
          inlineData: {
            ...part.inlineData,
            data: `(${byteSize.toLocaleString()} bytes)`
          }
        };
      }
      return part;
    });
  }

  return sanitized;
}

// WebSocket handlers
function connectWebsocket() {
  // Connect websocket
  const ws_url = getWebSocketUrl();
  websocket = new WebSocket(ws_url);

  // Handle connection open
  websocket.onopen = function () {
    console.log("WebSocket connection opened.");
    updateConnectionStatus(true);
    addSystemMessage("Connected to ADK streaming server");

    // Log to console
    addConsoleEntry('incoming', 'WebSocket Connected', {
      userId: userId,
      sessionId: sessionId,
      url: ws_url
    }, '🔌', 'system');

    // Enable the Send button
    document.getElementById("sendButton").disabled = false;
    addSubmitHandler();
  };

  // Handle incoming messages
  websocket.onmessage = function (event) {
    // Parse the incoming ADK Event
    const adkEvent = JSON.parse(event.data);
    console.log("[AGENT TO CLIENT] ", adkEvent);

    // Log to console panel
    let eventSummary = 'Event';
    let eventEmoji = '📨'; // Default emoji
    const author = adkEvent.author || 'system';

    if (adkEvent.turnComplete) {
      eventSummary = 'Turn Complete';
      eventEmoji = '✅';
    } else if (adkEvent.interrupted) {
      eventSummary = 'Interrupted';
      eventEmoji = '⏸️';
    } else if (adkEvent.inputTranscription) {
      // Show transcription text in summary
      const transcriptionText = adkEvent.inputTranscription.text || '';
      const truncated = transcriptionText.length > 60
        ? transcriptionText.substring(0, 60) + '...'
        : transcriptionText;
      eventSummary = `Input Transcription: "${truncated}"`;
      eventEmoji = '📝';
    } else if (adkEvent.outputTranscription) {
      // Show transcription text in summary
      const transcriptionText = adkEvent.outputTranscription.text || '';
      const truncated = transcriptionText.length > 60
        ? transcriptionText.substring(0, 60) + '...'
        : transcriptionText;
      eventSummary = `Output Transcription: "${truncated}"`;
      eventEmoji = '📝';
    } else if (adkEvent.usageMetadata) {
      // Show token usage information
      const usage = adkEvent.usageMetadata;
      const promptTokens = usage.promptTokenCount || 0;
      const responseTokens = usage.candidatesTokenCount || 0;
      const totalTokens = usage.totalTokenCount || 0;
      eventSummary = `Token Usage: ${totalTokens.toLocaleString()} total (${promptTokens.toLocaleString()} prompt + ${responseTokens.toLocaleString()} response)`;
      eventEmoji = '📊';
    } else if (adkEvent.content && adkEvent.content.parts) {
      const hasText = adkEvent.content.parts.some(p => p.text);
      const hasAudio = adkEvent.content.parts.some(p => p.inlineData);
      const hasExecutableCode = adkEvent.content.parts.some(p => p.executableCode);
      const hasCodeExecutionResult = adkEvent.content.parts.some(p => p.codeExecutionResult);

      if (hasExecutableCode) {
        // Show executable code
        const codePart = adkEvent.content.parts.find(p => p.executableCode);
        if (codePart && codePart.executableCode) {
          const code = codePart.executableCode.code || '';
          const language = codePart.executableCode.language || 'unknown';
          const truncated = code.length > 60
            ? code.substring(0, 60).replace(/\n/g, ' ') + '...'
            : code.replace(/\n/g, ' ');
          eventSummary = `Executable Code (${language}): ${truncated}`;
          eventEmoji = '💻';
        }
      }

      if (hasCodeExecutionResult) {
        // Show code execution result
        const resultPart = adkEvent.content.parts.find(p => p.codeExecutionResult);
        if (resultPart && resultPart.codeExecutionResult) {
          const outcome = resultPart.codeExecutionResult.outcome || 'UNKNOWN';
          const output = resultPart.codeExecutionResult.output || '';
          const truncatedOutput = output.length > 60
            ? output.substring(0, 60).replace(/\n/g, ' ') + '...'
            : output.replace(/\n/g, ' ');
          eventSummary = `Code Execution Result (${outcome}): ${truncatedOutput}`;
          eventEmoji = outcome === 'OUTCOME_OK' ? '✅' : '❌';
        }
      }

      if (hasText) {
        // Show text preview in summary
        const textPart = adkEvent.content.parts.find(p => p.text);
        if (textPart && textPart.text) {
          const text = textPart.text;
          const truncated = text.length > 80
            ? text.substring(0, 80) + '...'
            : text;
          eventSummary = `Text: "${truncated}"`;
          eventEmoji = '💭';
        } else {
          eventSummary = 'Text Response';
          eventEmoji = '💭';
        }
      }

      if (hasAudio) {
        // Extract audio info for summary
        const audioPart = adkEvent.content.parts.find(p => p.inlineData);
        if (audioPart && audioPart.inlineData) {
          const mimeType = audioPart.inlineData.mimeType || 'unknown';
          const dataLength = audioPart.inlineData.data ? audioPart.inlineData.data.length : 0;
          // Base64 string length / 4 * 3 gives approximate bytes
          const byteSize = Math.floor(dataLength * 0.75);
          eventSummary = `Audio Response: ${mimeType} (${byteSize.toLocaleString()} bytes)`;
          eventEmoji = '🔊';
        } else {
          eventSummary = 'Audio Response';
          eventEmoji = '🔊';
        }

        // Log audio event with isAudio flag (filtered by checkbox)
        const sanitizedEvent = sanitizeEventForDisplay(adkEvent);
        addConsoleEntry('incoming', eventSummary, sanitizedEvent, eventEmoji, author, true);
      }

      // Check for function calls
      const hasFunctionCall = adkEvent.content.parts.some(p => p.functionCall);
      if (hasFunctionCall) {
        const callPart = adkEvent.content.parts.find(p => p.functionCall);
        if (callPart && callPart.functionCall) {
          const name = callPart.functionCall.name;
          const args = JSON.stringify(callPart.functionCall.args);
          const truncatedArgs = args.length > 50 ? args.substring(0, 50) + '...' : args;
          eventSummary = `Tool Call: ${name}(${truncatedArgs})`;
          eventEmoji = '🔧';
        }
      }

      // Check for function responses
      const hasFunctionResponse = adkEvent.content.parts.some(p => p.functionResponse);
      if (hasFunctionResponse) {
        const responsePart = adkEvent.content.parts.find(p => p.functionResponse);
        if (responsePart && responsePart.functionResponse) {
          const name = responsePart.functionResponse.name;
          // output is usually a dict/object
          const response = JSON.stringify(responsePart.functionResponse.response);
          const truncatedResponse = response.length > 50 ? response.substring(0, 50) + '...' : response;
          eventSummary = `Tool Response: ${name} -> ${truncatedResponse}`;
          eventEmoji = '🔙';
        }
      }
    }

    // Create a sanitized version for console display (replace large audio data with summary)
    // Skip if already logged as audio event above
    const isAudioOnlyEvent = adkEvent.content && adkEvent.content.parts &&
      adkEvent.content.parts.some(p => p.inlineData) &&
      !adkEvent.content.parts.some(p => p.text) &&
      !adkEvent.content.parts.some(p => p.functionCall) &&
      !adkEvent.content.parts.some(p => p.functionResponse);
    if (!isAudioOnlyEvent) {
      const sanitizedEvent = sanitizeEventForDisplay(adkEvent);
      addConsoleEntry('incoming', eventSummary, sanitizedEvent, eventEmoji, author);
    }

    // Handle turn complete event
    if (adkEvent.turnComplete === true) {
      // Remove typing indicator from current message
      if (currentBubbleElement) {
        const textElement = currentBubbleElement.querySelector(".bubble-text");
        const typingIndicator = textElement.querySelector(".typing-indicator");
        if (typingIndicator) {
          typingIndicator.remove();
        }
      }
      // Remove typing indicator from current output transcription
      if (currentOutputTranscriptionElement) {
        const textElement = currentOutputTranscriptionElement.querySelector(".bubble-text");
        const typingIndicator = textElement.querySelector(".typing-indicator");
        if (typingIndicator) {
          typingIndicator.remove();
        }
      }
      currentMessageId = null;
      currentBubbleElement = null;
      currentOutputTranscriptionId = null;
      currentOutputTranscriptionElement = null;
      inputTranscriptionFinished = false; // Reset for next turn
      return;
    }

    // Handle interrupted event
    if (adkEvent.interrupted === true) {
      // Stop audio playback if it's playing
      if (audioPlayerNode) {
        audioPlayerNode.port.postMessage({ command: "endOfAudio" });
      }

      // Keep the partial message but mark it as interrupted
      if (currentBubbleElement) {
        const textElement = currentBubbleElement.querySelector(".bubble-text");

        // Remove typing indicator
        const typingIndicator = textElement.querySelector(".typing-indicator");
        if (typingIndicator) {
          typingIndicator.remove();
        }

        // Add interrupted marker
        currentBubbleElement.classList.add("interrupted");
      }

      // Keep the partial output transcription but mark it as interrupted
      if (currentOutputTranscriptionElement) {
        const textElement = currentOutputTranscriptionElement.querySelector(".bubble-text");

        // Remove typing indicator
        const typingIndicator = textElement.querySelector(".typing-indicator");
        if (typingIndicator) {
          typingIndicator.remove();
        }

        // Add interrupted marker
        currentOutputTranscriptionElement.classList.add("interrupted");
      }

      // Reset state so new content creates a new bubble
      currentMessageId = null;
      currentBubbleElement = null;
      currentOutputTranscriptionId = null;
      currentOutputTranscriptionElement = null;
      inputTranscriptionFinished = false; // Reset for next turn
      return;
    }

    // Handle input transcription (user's spoken words)
    if (adkEvent.inputTranscription && adkEvent.inputTranscription.text) {
      const transcriptionText = adkEvent.inputTranscription.text;
      const isFinished = adkEvent.inputTranscription.finished;

      if (transcriptionText) {
        // Ignore late-arriving transcriptions after we've finished for this turn
        if (inputTranscriptionFinished) {
          return;
        }

        if (currentInputTranscriptionId == null) {
          // Create new transcription bubble
          currentInputTranscriptionId = Math.random().toString(36).substring(7);
          // Clean spaces between CJK characters
          const cleanedText = cleanCJKSpaces(transcriptionText);
          currentInputTranscriptionElement = createMessageBubble(cleanedText, true, !isFinished);
          currentInputTranscriptionElement.id = currentInputTranscriptionId;

          // Add a special class to indicate it's a transcription
          currentInputTranscriptionElement.classList.add("transcription");

          messagesDiv.appendChild(currentInputTranscriptionElement);
        } else {
          // Update existing transcription bubble only if model hasn't started responding
          // This prevents late partial transcriptions from overwriting complete ones
          if (currentOutputTranscriptionId == null && currentMessageId == null) {
            if (isFinished) {
              // Final transcription contains the complete text, replace entirely
              const cleanedText = cleanCJKSpaces(transcriptionText);
              updateMessageBubble(currentInputTranscriptionElement, cleanedText, false);
            } else {
              // Partial transcription - append to existing text
              const existingText = currentInputTranscriptionElement.querySelector(".bubble-text").textContent;
              // Remove typing indicator if present
              const cleanText = existingText.replace(/\.\.\.$/, '');
              // Clean spaces between CJK characters before updating
              const accumulatedText = cleanCJKSpaces(cleanText + transcriptionText);
              updateMessageBubble(currentInputTranscriptionElement, accumulatedText, true);
            }
          }
        }

        // If transcription is finished, reset the state and mark as complete
        if (isFinished) {
          currentInputTranscriptionId = null;
          currentInputTranscriptionElement = null;
          inputTranscriptionFinished = true; // Prevent duplicate bubbles from late events
        }

        scrollToBottom();
      }
    }

    // Handle output transcription (model's spoken words)
    if (adkEvent.outputTranscription && adkEvent.outputTranscription.text) {
      const transcriptionText = adkEvent.outputTranscription.text;
      const isFinished = adkEvent.outputTranscription.finished;

      if (transcriptionText) {
        // Finalize any active input transcription when server starts responding
        if (currentInputTranscriptionId != null && currentOutputTranscriptionId == null) {
          // This is the first output transcription - finalize input transcription
          const textElement = currentInputTranscriptionElement.querySelector(".bubble-text");
          const typingIndicator = textElement.querySelector(".typing-indicator");
          if (typingIndicator) {
            typingIndicator.remove();
          }
          // Reset input transcription state so next user input creates new balloon
          currentInputTranscriptionId = null;
          currentInputTranscriptionElement = null;
          inputTranscriptionFinished = true; // Prevent duplicate bubbles from late events
        }

        if (currentOutputTranscriptionId == null) {
          // Create new transcription bubble for agent
          currentOutputTranscriptionId = Math.random().toString(36).substring(7);
          currentOutputTranscriptionElement = createMessageBubble(transcriptionText, false, !isFinished);
          currentOutputTranscriptionElement.id = currentOutputTranscriptionId;

          // Add a special class to indicate it's a transcription
          currentOutputTranscriptionElement.classList.add("transcription");

          messagesDiv.appendChild(currentOutputTranscriptionElement);
        } else {
          // Update existing transcription bubble
          if (isFinished) {
            // Final transcription contains the complete text, replace entirely
            updateMessageBubble(currentOutputTranscriptionElement, transcriptionText, false);
          } else {
            // Partial transcription - append to existing text
            const existingText = currentOutputTranscriptionElement.querySelector(".bubble-text").textContent;
            // Remove typing indicator if present
            const cleanText = existingText.replace(/\.\.\.$/, '');
            updateMessageBubble(currentOutputTranscriptionElement, cleanText + transcriptionText, true);
          }
        }

        // If transcription is finished, reset the state
        if (isFinished) {
          currentOutputTranscriptionId = null;
          currentOutputTranscriptionElement = null;
        }

        scrollToBottom();
      }
    }

    // Handle content events (text or audio)
    if (adkEvent.content && adkEvent.content.parts) {
      const parts = adkEvent.content.parts;

      // Finalize any active input transcription when server starts responding with content
      if (currentInputTranscriptionId != null && currentMessageId == null && currentOutputTranscriptionId == null) {
        // This is the first content event - finalize input transcription
        const textElement = currentInputTranscriptionElement.querySelector(".bubble-text");
        const typingIndicator = textElement.querySelector(".typing-indicator");
        if (typingIndicator) {
          typingIndicator.remove();
        }
        // Reset input transcription state so next user input creates new balloon
        currentInputTranscriptionId = null;
        currentInputTranscriptionElement = null;
        inputTranscriptionFinished = true; // Prevent duplicate bubbles
      }

      for (const part of parts) {
        // Handle inline data (audio)
        if (part.inlineData) {
          const mimeType = part.inlineData.mimeType;
          const data = part.inlineData.data;

          if (mimeType && mimeType.startsWith("audio/pcm") && audioPlayerNode) {
            audioPlayerNode.port.postMessage(base64ToArray(data));
          }
        }

        // Handle text
        if (part.text) {
          const text = part.text;
          // If we have an active input transcription, finalize it now
          if (currentInputTranscriptionElement) {
            const textElement = currentInputTranscriptionElement.querySelector(".bubble-text");
            const typingIndicator = textElement.querySelector(".typing-indicator");
            if (typingIndicator) {
              typingIndicator.remove();
            }
            currentInputTranscriptionId = null;
            currentInputTranscriptionElement = null;
            inputTranscriptionFinished = true;
          }

          if (currentMessageId == null) {
            // Create new message bubble
            currentMessageId = Math.random().toString(36).substring(7);
            currentBubbleElement = createMessageBubble(text, false, true);
            currentBubbleElement.id = currentMessageId;
            messagesDiv.appendChild(currentBubbleElement);
          } else {
            // Append to existing message
            if (currentBubbleElement) {
              const textElement = currentBubbleElement.querySelector(".bubble-text");
              const existingText = textElement.innerText; // Use innerText to get text without hidden elements
              // Remove typing indicator logic is handled in updateMessageBubble
              updateMessageBubble(currentBubbleElement, existingText + text, true);
            }
          }
          scrollToBottom();
        }

        // Handle function response (UI Actions)
        if (part.functionResponse) {
          const response = part.functionResponse.response;
          if (response && response.ui_action) {
            const uiAction = response.ui_action;
            // Check for display_component or carousel_card (used by different tools)
            const isDisplayAction = uiAction.action === 'display_component';
            if (isDisplayAction) {
              const componentName = uiAction.component_name;

              if (componentName === 'maps_view') {
                const messageDiv = document.createElement("div");
                messageDiv.className = "message agent";
                const bubbleDiv = document.createElement("div");
                bubbleDiv.className = "bubble component-bubble";
                bubbleDiv.innerHTML = `
                  <div class="component-content maps-view">
                    <h4 style="margin-top: 0; margin-bottom: 8px; color: var(--primary-color);">📍 Retailer Found</h4>
                    <p style="margin: 4px 0;"><strong>Name:</strong> ${uiAction.data.retailer_name}</p>
                    <p style="margin: 4px 0;"><strong>Address:</strong> ${uiAction.data.address}</p>
                  </div>
                `;
                messageDiv.appendChild(bubbleDiv);
                messagesDiv.appendChild(messageDiv);
                scrollToBottom();
              } else if (componentName === 'test_drive_confirmation') {
                const messageDiv = document.createElement("div");
                messageDiv.className = "message agent";
                const bubbleDiv = document.createElement("div");
                bubbleDiv.className = "bubble component-bubble";
                bubbleDiv.innerHTML = `
                  <div class="component-content test-drive">
                    <h4 style="margin-top: 0; margin-bottom: 8px; color: var(--primary-color);">✅ Test Drive Booked!</h4>
                    <p style="margin: 4px 0;"><strong>Name:</strong> ${uiAction.data.user_name}</p>
                    <p style="margin: 4px 0;"><strong>Email:</strong> ${uiAction.data.user_email}</p>
                    <p style="margin: 4px 0;"><strong>Retailer:</strong> ${uiAction.data.retailer_name}</p>
                    <p style="margin: 4px 0;"><strong>Address:</strong> ${uiAction.data.retailer_address}</p>
                    <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${uiAction.data.date} at ${uiAction.data.time}</p>
                    <hr style="margin: 8px 0; border: 0; border-top: 1px solid #ddd;">
                    <p style="margin: 4px 0; font-size: 0.9em; color: #555;"><em>Preferences:</em> Height: ${uiAction.data.preferences.height}, Music: ${uiAction.data.preferences.music}, Light: ${uiAction.data.preferences.light}</p>
                  </div>
                `;
                messageDiv.appendChild(bubbleDiv);
                messagesDiv.appendChild(messageDiv);
                scrollToBottom();
              } else if (componentName === 'exterior' && uiAction.data.selected_color) {
                const colorData = uiAction.data.selected_color;
                const messageDiv = document.createElement("div");
                messageDiv.className = "message agent";
                const bubbleDiv = document.createElement("div");
                bubbleDiv.className = "bubble component-bubble";

                let gradientHtml = '';
                if (colorData.gradient_stops && colorData.gradient_stops.length > 0) {
                  const stops = colorData.gradient_stops.map(s => {
                    const pct = Math.round(s.position * 100);
                    return `rgba(${s.r}, ${s.g}, ${s.b}, ${s.a ?? 1}) ${pct}%`;
                  }).join(', ');
                  gradientHtml = `
                    <div style="
                      width: 100%;
                      height: 80px;
                      border-radius: 8px;
                      background: linear-gradient(to right, ${stops});
                      margin-bottom: 8px;
                      border: 1px solid #ddd;
                    "></div>
                  `;
                }

                bubbleDiv.innerHTML = `
                  <div class="component-content">
                    <h4 style="margin-top: 0; margin-bottom: 8px; color: var(--primary-color);">🎨 Exterior Color</h4>
                    ${gradientHtml}
                    <p style="margin: 4px 0;"><strong>${colorData.display_name || colorData.id}</strong></p>
                  </div>
                `;
                messageDiv.appendChild(bubbleDiv);
                messagesDiv.appendChild(messageDiv);
                scrollToBottom();
              } else {
                const images = uiAction.data.images || (uiAction.data.image_url ? [uiAction.data.image_url] : []);

                if (images.length > 0) {
                  console.log("Rendering images from UI Action:", images);

                  const messageDiv = document.createElement("div");
                  messageDiv.className = "message agent";

                  const bubbleDiv = document.createElement("div");
                  bubbleDiv.className = "bubble image-bubble";
                  // Allow bubble to expand for multiple images if needed, though max-width 70% still applies
                  if (images.length > 1) {
                    bubbleDiv.style.maxWidth = "85%"; // Give more space for carousel
                  }

                  // Container for images (carousel if multiple)
                  const imageContainer = document.createElement("div");
                  if (images.length > 1) {
                    imageContainer.className = "multi-image-container";
                  } else {
                    // Single image style
                    imageContainer.style.display = "block";
                  }

                  images.forEach(url => {
                    const img = document.createElement("img");
                    img.src = url;
                    img.className = "bubble-image";
                    img.alt = uiAction.data.alt_text || "Car Configuration Image";
                    imageContainer.appendChild(img);
                  });

                  bubbleDiv.appendChild(imageContainer);

                  // Add caption if available
                  if (uiAction.data.caption || uiAction.data.title) {
                    const captionDiv = document.createElement("div");
                    captionDiv.className = "bubble-caption";
                    captionDiv.textContent = uiAction.data.caption || uiAction.data.title;
                    captionDiv.style.fontSize = "0.8em";
                    captionDiv.style.color = "#666";
                    captionDiv.style.marginTop = "8px";
                    captionDiv.style.textAlign = "center";
                    bubbleDiv.appendChild(captionDiv);
                  }

                  messageDiv.appendChild(bubbleDiv);
                  messagesDiv.appendChild(messageDiv);
                  scrollToBottom();
                }
              }
            }
          }
        }
        // Scroll down to the bottom of the messagesDiv
        scrollToBottom();
      }
    }
  };

  // Handle connection close
  websocket.onclose = function () {
    console.log("WebSocket connection closed.");
    updateConnectionStatus(false);
    document.getElementById("sendButton").disabled = true;
    addSystemMessage("Connection closed. Reconnecting in 5 seconds...");

    // Log to console
    addConsoleEntry('error', 'WebSocket Disconnected', {
      status: 'Connection closed',
      reconnecting: true,
      reconnectDelay: '5 seconds'
    }, '🔌', 'system');

    setTimeout(function () {
      console.log("Reconnecting...");

      // Log reconnection attempt to console
      addConsoleEntry('outgoing', 'Reconnecting to ADK server...', {
        userId: userId,
        sessionId: sessionId
      }, '🔄', 'system');

      connectWebsocket();
    }, 5000);
  };

  websocket.onerror = function (e) {
    console.log("WebSocket error: ", e);
    updateConnectionStatus(false);

    // Log to console
    addConsoleEntry('error', 'WebSocket Error', {
      error: e.type,
      message: 'Connection error occurred'
    }, '⚠️', 'system');
  };
}
connectWebsocket();

// Add submit handler to the form
function addSubmitHandler() {
  messageForm.onsubmit = function (e) {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message) {
      // Add user message bubble
      const userBubble = createMessageBubble(message, true, false);
      messagesDiv.appendChild(userBubble);
      scrollToBottom();

      // Clear input
      messageInput.value = "";

      // Send message to server
      sendMessage(message);
      console.log("[CLIENT TO AGENT] " + message);
    }
    return false;
  };
}

// Send a message to the server as JSON
function sendMessage(message) {
  if (websocket && websocket.readyState == WebSocket.OPEN) {
    const jsonMessage = JSON.stringify({
      type: "text",
      text: message
    });
    websocket.send(jsonMessage);

    // Log to console panel
    addConsoleEntry('outgoing', 'User Message: ' + message, null, '💬', 'user');
  }
}

// Decode Base64 data to Array
// Handles both standard base64 and base64url encoding
function base64ToArray(base64) {
  // Convert base64url to standard base64
  // Replace URL-safe characters: - with +, _ with /
  let standardBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  while (standardBase64.length % 4) {
    standardBase64 += '=';
  }

  const binaryString = window.atob(standardBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Camera handling
 */

const cameraButton = document.getElementById("cameraButton");
const cameraModal = document.getElementById("cameraModal");
const cameraPreview = document.getElementById("cameraPreview");
const closeCameraModal = document.getElementById("closeCameraModal");
const cancelCamera = document.getElementById("cancelCamera");
const captureImageBtn = document.getElementById("captureImage");

let cameraStream = null;

// Open camera modal and start preview
async function openCameraPreview() {
  try {
    // Request access to the user's webcam
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 768 },
        height: { ideal: 768 },
        facingMode: 'user'
      }
    });

    // Set the stream to the video element
    cameraPreview.srcObject = cameraStream;

    // Show the modal
    cameraModal.classList.add('show');

  } catch (error) {
    console.error('Error accessing camera:', error);
    addSystemMessage(`Failed to access camera: ${error.message}`);

    // Log to console
    addConsoleEntry('error', 'Camera access failed', {
      error: error.message,
      name: error.name
    }, '⚠️', 'system');
  }
}

// Close camera modal and stop preview
function closeCameraPreview() {
  // Stop the camera stream
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  // Clear the video source
  cameraPreview.srcObject = null;

  // Hide the modal
  cameraModal.classList.remove('show');
}

// Capture image from the live preview
function captureImageFromPreview() {
  if (!cameraStream) {
    addSystemMessage('No camera stream available');
    return;
  }

  try {
    // Create canvas to capture the frame
    const canvas = document.createElement('canvas');
    canvas.width = cameraPreview.videoWidth;
    canvas.height = cameraPreview.videoHeight;
    const context = canvas.getContext('2d');

    // Draw current video frame to canvas
    context.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);

    // Convert canvas to data URL for display
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Display the captured image in the chat
    const imageBubble = createImageBubble(imageDataUrl, true);
    messagesDiv.appendChild(imageBubble);
    scrollToBottom();

    // Convert canvas to blob for sending to server
    canvas.toBlob((blob) => {
      // Convert blob to base64 for sending to server
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        sendImage(base64data);
      };
      reader.readAsDataURL(blob);

      // Log to console
      addConsoleEntry('outgoing', `Image captured: ${blob.size} bytes (JPEG)`, {
        size: blob.size,
        type: 'image/jpeg',
        dimensions: `${canvas.width}x${canvas.height}`
      }, '📷', 'user');
    }, 'image/jpeg', 0.85);

    // Close the camera modal
    closeCameraPreview();

  } catch (error) {
    console.error('Error capturing image:', error);
    addSystemMessage(`Failed to capture image: ${error.message}`);

    // Log to console
    addConsoleEntry('error', 'Image capture failed', {
      error: error.message,
      name: error.name
    }, '⚠️', 'system');
  }
}

// Send image to server
function sendImage(base64Image) {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    const jsonMessage = JSON.stringify({
      type: "image",
      data: base64Image,
      mimeType: "image/jpeg"
    });
    websocket.send(jsonMessage);
    console.log("[CLIENT TO AGENT] Sent image");
  }
}

// Event listeners
cameraButton.addEventListener("click", openCameraPreview);
closeCameraModal.addEventListener("click", closeCameraPreview);
cancelCamera.addEventListener("click", closeCameraPreview);
captureImageBtn.addEventListener("click", captureImageFromPreview);

// Close modal when clicking outside of it
cameraModal.addEventListener("click", (event) => {
  if (event.target === cameraModal) {
    closeCameraPreview();
  }
});

/**
 * Audio handling
 */

let audioPlayerNode;
let audioPlayerContext;
let audioRecorderNode;
let audioRecorderContext;
let micStream;

// Import the audio worklets
import { startAudioPlayerWorklet } from "./audio-player.js";
import { startAudioRecorderWorklet } from "./audio-recorder.js";

// Start audio
function startAudio() {
  // Start audio output
  startAudioPlayerWorklet().then(([node, ctx]) => {
    audioPlayerNode = node;
    audioPlayerContext = ctx;
  });
  // Start audio input
  startAudioRecorderWorklet(audioRecorderHandler).then(
    ([node, ctx, stream]) => {
      audioRecorderNode = node;
      audioRecorderContext = ctx;
      micStream = stream;
    }
  );
}

// Start the audio only when the user clicked the button
// (due to the gesture requirement for the Web Audio API)
const startAudioButton = document.getElementById("startAudioButton");
startAudioButton.addEventListener("click", () => {
  startAudioButton.disabled = true;
  startAudio();
  is_audio = true;
  addSystemMessage("Audio mode enabled - you can now speak to the agent");

  // Log to console
  addConsoleEntry('outgoing', 'Audio Mode Enabled', {
    status: 'Audio worklets started',
    message: 'Microphone active - audio input will be sent to agent'
  }, '🎤', 'system');
});

// Audio recorder handler
function audioRecorderHandler(pcmData) {
  if (websocket && websocket.readyState === WebSocket.OPEN && is_audio) {
    // Send audio as binary WebSocket frame (more efficient than base64 JSON)
    websocket.send(pcmData);
    console.log("[CLIENT TO AGENT] Sent audio chunk: %s bytes", pcmData.byteLength);

    // Log to console panel (optional, can be noisy with frequent audio chunks)
    // addConsoleEntry('outgoing', `Audio chunk: ${pcmData.byteLength} bytes`);
  }
}

