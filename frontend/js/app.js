/**
 * app.js: JS code for the Voice-First Volvo Assistant.
 */

import { startAudioPlayerWorklet } from "./audio-player.js";
import { startAudioRecorderWorklet } from "./audio-recorder.js";

// -- Configuration --
const userId = "demo-user";
const sessionId = "demo-session-" + Math.random().toString(36).substring(7);
let websocket = null;
let isAudioEnabled = false;
let audioPlayerNode;
let audioPlayerContext;
let audioRecorderNode;
let audioRecorderContext;
let micStream;

// -- DOM Elements --
const visualizerCore = document.getElementById("visualizerCore");
const captionsArea = document.getElementById("captionsArea");
const statusIndicator = document.getElementById("statusIndicator");
const micButton = document.getElementById("micButton");
const keyboardButton = document.getElementById("keyboardButton");
const mainInterface = document.querySelector(".voice-interface");
const inlineMessageForm = document.getElementById("inlineMessageForm");
const inlineMessageInput = document.getElementById("inlineMessageInput");
const closeKeyboardBtn = document.getElementById("closeKeyboard"); // May be null now, but we'll check

// -- State --
let state = {
  listening: false,
  speaking: false,
  connected: false,
}

// -- Initialization --

function init() {
  updateStatus("Disconnected");
  micButton.addEventListener("click", toggleMic);
  // keyboardButton.addEventListener("click", toggleKeyboard); // Hidden/unused

  if (inlineMessageForm) {
    inlineMessageForm.addEventListener("submit", handleTextSubmit);
  }

  // Auto-connect on load so user can type immediately
  connect();

  // Push-to-Talk Logic
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && document.activeElement !== inlineMessageInput) {
      if (!isAudioEnabled) {
        startAudioSubSystem();
        updateStatus("Listening (PTT)");
      }
    }
  });

  document.addEventListener("keyup", (e) => {
    if (e.code === "Space" && document.activeElement !== inlineMessageInput) {
      if (isAudioEnabled) {
        stopAudioSubSystem();
        updateStatus("Muted");
      }
    }
  });
}

// -- WebSocket Handling --

function getWebSocketUrl() {
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const baseUrl = wsProtocol + "//" + window.location.host + "/ws/" + userId + "/" + sessionId;

  // Settings removed, default or config-based?
  // We'll leave URLSearchParams empty for now or maybe hardcode defaults if needed.
  // User removed settings button so they can't toggle them.
  // We can assume they want defaults.

  return baseUrl;
}

function connect() {
  if (websocket && websocket.readyState === WebSocket.OPEN) return;

  updateStatus("Connecting...");
  const url = getWebSocketUrl();
  websocket = new WebSocket(url);

  websocket.onopen = () => {
    console.log("Connected");
    updateStatus("Idle");
    state.connected = true;

    // If audio was requested, start it now
    if (isAudioEnabled) {
      startAudioSubSystem();
    }
  };

  websocket.onclose = () => {
    console.log("Disconnected");
    updateStatus("Disconnected");
    state.connected = false;
    resetVisualizer();
    // Auto reconnect?
    setTimeout(connect, 3000);
  };

  websocket.onmessage = (event) => {
    const adkEvent = JSON.parse(event.data);
    handleAdkEvent(adkEvent);
  };
}

function handleAdkEvent(event) {
  // 1. Handle Audio Output (Speaking)
  if (event.content && event.content.parts) {
    for (const part of event.content.parts) {
      if (part.inlineData && part.inlineData.mimeType.startsWith("audio/pcm")) {
        if (audioPlayerNode) {
          audioPlayerNode.port.postMessage(base64ToArray(part.inlineData.data));
          setSpeaking(true);

          // Reset speaking state after a timeout (approximation)
          // Better way: audio processor sends event when buffer empty, but simple timeout works for visualizer
          if (window.speakingTimeout) clearTimeout(window.speakingTimeout);
          window.speakingTimeout = setTimeout(() => setSpeaking(false), 2000); // Rough fallback
        }
      }
    }
  }

  // 2. Handle Transcriptions (Captions)
  // Only show complete sentences (batching) as requested
  if (event.inputTranscription && event.inputTranscription.text && event.inputTranscription.finished) {
    showCaption(event.inputTranscription.text, true); // isUser = true
  }

  if (event.outputTranscription && event.outputTranscription.text && (event.outputTranscription.finished || event.content)) {
    // For output, we show if finished OR if we have content (audio/text) associated, 
    // but to strictly follow "complete sentence" we should stick to finished.
    // However, models might chunk output. Let's stick to 'finished' for safety as requested.
    // There is a risk of silence during generation if we only wait for finished.
    if (event.outputTranscription.finished) {
      showCaption(event.outputTranscription.text, false); // isUser = false
    }
  }

  // 3. Handle Turn Complete (End of speaking)
  if (event.turnComplete) {
    setSpeaking(false);
    setListening(true); // Expecting input now?
  }

  // 4. Handle Interrupted
  if (event.interrupted) {
    setSpeaking(false);
    if (audioPlayerNode) audioPlayerNode.port.postMessage({ command: "endOfAudio" });
    showCaption("(Interrupted)", true);
  }
}

// -- Audio Handling --

function startAudioSubSystem() {
  if (!audioPlayerContext) {
    startAudioPlayerWorklet().then(([node, ctx]) => {
      audioPlayerNode = node;
      audioPlayerContext = ctx;
    });
  }

  if (!audioRecorderContext) {
    startAudioRecorderWorklet((pcmData) => {
      if (websocket && websocket.readyState === WebSocket.OPEN && isAudioEnabled) {
        websocket.send(pcmData);
        setListening(true); // We are sending audio, so we are "listening/recording"

        // Reset listening state if silence? 
        // For visualizer, getting data means we hear something or at least mic is open.
      }
    }).then(([node, ctx, stream]) => {
      audioRecorderNode = node;
      audioRecorderContext = ctx;
      micStream = stream;
    });
  }

  isAudioEnabled = true;
  micButton.classList.add("active");
}

function stopAudioSubSystem() {
  // We typically don't "stop" the context, just stop sending/flag.
  isAudioEnabled = false;
  micButton.classList.remove("active");
  setListening(false);
}

function toggleMic() {
  if (!state.connected) {
    // If for some reason we aren't connected, connect first, then start audio
    connect();
    // We can't immediately start audio if we rely on onopen, but we can try setting a flag
    // or relying on the user clicking again if it takes too long.
    // However, usually we are connected by now.
  }

  if (isAudioEnabled) {
    stopAudioSubSystem();
    updateStatus("Muted");
  } else {
    // This requires a user gesture, which we have (click)
    startAudioSubSystem();
    updateStatus("Listening");
  }
}

// -- UI Logic --

function updateStatus(text) {
  if (statusIndicator) {
    statusIndicator.textContent = text;
  }
}

function setListening(active) {
  state.listening = active;
  if (active) {
    mainInterface.classList.add("is-listening");
    updateStatus("Listening...");
  } else {
    mainInterface.classList.remove("is-listening");
    updateStatus("Idle");
  }
}

function setSpeaking(active) {
  state.speaking = active;
  if (active) {
    mainInterface.classList.add("is-speaking");
    updateStatus("Agent Speaking...");
  } else {
    mainInterface.classList.remove("is-speaking");
    if (isAudioEnabled) updateStatus("Listening..."); // Back to listening
  }
}

function showCaption(text, isUser) {
  // Simple implementation: Update the single caption paragraph
  let p = captionsArea.querySelector("p");

  if (!p) {
    p = document.createElement("p");
    p.className = "caption-text";
    captionsArea.appendChild(p);
  }

  // Heuristic: Insert space between lowercase and uppercase if missing (e.g. "HelloThere" -> "Hello There")
  // Only applies if the text seems to be lacking spaces in standard sentence structure.
  let cleanText = text.replace(/([a-z])([A-Z])/g, '$1 $2');

  p.textContent = cleanText;
  p.classList.remove("placeholder");

  if (isUser) {
    p.style.color = "var(--text-secondary)";
  } else {
    p.style.color = "var(--text-primary)";
  }
}

function resetVisualizer() {
  mainInterface.classList.remove("is-listening");
  mainInterface.classList.remove("is-speaking");
}

function toggleKeyboard() {
  // No-op or maybe focus input?
  if (inlineMessageInput) inlineMessageInput.focus();
}

function handleTextSubmit(e) {
  e.preventDefault();
  const text = inlineMessageInput.value.trim();
  if (!text) return;

  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify({ type: "text", text: text }));
    inlineMessageInput.value = "";
    inlineMessageInput.focus(); // Keep focus for continuous typing
    showCaption(text, true);
  } else {
    connect(); // Reconnect if needed
    // Queue message? For now just connect.
  }
}

// -- Helpers --

function base64ToArray(base64) {
  let standardBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');
  while (standardBase64.length % 4) standardBase64 += '=';
  const binaryString = window.atob(standardBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Start
init();
