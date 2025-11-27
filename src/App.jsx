import React, { useEffect, useRef, useState } from "react";

const ERROR_MESSAGES = [
  "Ew! Come back when youre the right person!",
  "This was not meant for you!",
  "I have a girl! And I'm not sorry!",
  "Bitch! Getouttahere..."
];

const QUESTIONS = [
  { round: 1, prompt: "What was the capital of the Ottoman Empire?", options: ["Instabul", "Constantinople", "Ankara", "Sofia"], correctIndex: 0 },
  { round: 1, prompt: "With what ingredient would you NOT make French Toast?", options: ["bread", "eggs", "beans", "milk"], correctIndex: 2 },
  { round: 1, prompt: "What is the field of study where scientists wanted to find a way to turn everything into gold?", options: ["Potery", "Alchemy", "Psychics", "Chemistry"], correctIndex: 1 },
  { round: 2, prompt: "What is the next big amount of flowers picked for you are we about to reach?", options: ["97", "400", "300", "125"], correctIndex: 2 },
  { round: 2, prompt: "Who makes the best mug cakes in the world?", options: ["Nobody! The fuk?", "You", "Your mom", "Your baby boy"], correctIndex: 3 },
  { round: 2, prompt: "For how many months have we know each other?", options: ["11", "12", "9", "10"], correctIndex: 0 },
  { round: 3, prompt: "If I gave you my hand, would you hold it, Roaa? Would you feel safe on my arms, baby girl? Would you give me a chance and let me make you happy?", options: ["No", "Yes"], correctIndex: 1 }
];

export default function App() {
  // modal states
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [initialModalOpen, setInitialModalOpen] = useState(false);

  // wheel state
  const [showWheel, setShowWheel] = useState(false);

  // name flow
  const [welcomeStage, setWelcomeStage] = useState("idle"); // idle, wheel, askName, started
  const [nameInput, setNameInput] = useState("");
  const [nameAttempts, setNameAttempts] = useState(0);
  const [nameError, setNameError] = useState("");

  // game
  const [currentIndex, setCurrentIndex] = useState(null);
  const [lives, setLives] = useState(3);
  const [messages, setMessages] = useState([]);
  const [gameStatus, setGameStatus] = useState("idle"); // idle, playing, won, lost

  // ephemeral messages inside modal
  const [answering, setAnswering] = useState(false);

  // audio refs
  const mainAudioRef = useRef(null);
  const wrongAudioRef = useRef(null);
  const lostAudioRef = useRef(null);
  const correctAudioRef = useRef(null);
  const loveAudioRef = useRef(null);

  useEffect(() => {
    try { mainAudioRef.current = new Audio("/mainsong.mp3"); mainAudioRef.current.loop = true; } catch (e) { mainAudioRef.current = null; }
    try { wrongAudioRef.current = new Audio("/wrong.wav"); } catch(e){ wrongAudioRef.current = null; }
    try { lostAudioRef.current = new Audio("/bro.mp3"); } catch(e){ lostAudioRef.current = null; }
    try { correctAudioRef.current = new Audio("/correct.wav"); } catch(e){ correctAudioRef.current = null; }
    try { loveAudioRef.current = new Audio("/love.mp3"); } catch(e){ loveAudioRef.current = null; }

    // Show initial modal if not seen before
    const seenInitial = localStorage.getItem("seenInitialModal");
    if (!seenInitial) setInitialModalOpen(true);
  }, []);

  function playIf(ref) { try { if (!ref || !ref.current) return; ref.current.currentTime = 0; ref.current.play().catch(()=>{}); } catch(e){} }
  function stopIf(ref) { try { if (!ref || !ref.current) return; ref.current.pause(); ref.current.currentTime = 0; } catch(e){} }

  function startGame() {
    setWelcomeStage("started");
    setCurrentIndex(0);
    setLives(3);
    setGameStatus("playing");
    playIf(mainAudioRef);
  }

  function submitName(e) {
    e.preventDefault();
    const value = nameInput.trim();
    if (/^roaa$/i.test(value)) {
      setNameError("");
      setTimeout(() => startGame(), 200);
    } else {
      const attempts = nameAttempts + 1;
      setNameAttempts(attempts);
      const msg = ERROR_MESSAGES[Math.min(attempts - 1, ERROR_MESSAGES.length - 1)];
      setNameError(msg);
      setMessages([]);
      setTimeout(() => setNameError(""), 2600);
    }
  }

  async function chooseAnswer(optionIndex) {
    if (currentIndex === null || answering) return;
    setAnswering(true);

    const q = QUESTIONS[currentIndex];
    const correct = optionIndex === q.correctIndex;

    if (correct) {
      playIf(correctAudioRef);
      setMessages(prev => [...prev, "Correct!"]);
      setTimeout(() => {
        setMessages(prev => prev.slice(1));
        const nextIndex = currentIndex + 1;
        if (nextIndex >= QUESTIONS.length) {
          // WIN
          setGameStatus("won");
          stopIf(mainAudioRef);
          playIf(loveAudioRef);
          setCurrentIndex(null);
          setMessages([]);
        } else {
          setCurrentIndex(nextIndex);
        }
        setAnswering(false);
      }, 700);
    } else {
      playIf(wrongAudioRef);
      const newLives = Math.max(0, lives - 1);
      setLives(newLives);
      setMessages(prev => [...prev, "Wrong!"]);
      setTimeout(() => setMessages(prev => prev.slice(1)), 1400);

      if (newLives <= 0) {
        setTimeout(() => {
          stopIf(mainAudioRef);
          playIf(lostAudioRef);
          setGameStatus("lost");
          setCurrentIndex(null);
          setMessages([]);
        }, 600);
      }
      setTimeout(() => setAnswering(false), 800);
    }
  }

  function handlePulsingStartClick() {
    setGameModalOpen(true);
    setShowWheel(true);
    setWelcomeStage("wheel");
    setNameInput("");
    setNameAttempts(0);
    setNameError("");
    setMessages([]);
    setLives(3);
    setGameStatus("idle");
    setTimeout(() => {
      setShowWheel(false);
      setWelcomeStage("askName");
    }, 3000);
  }

  function closeGame() {
    setGameModalOpen(false);
    setShowWheel(false);
    setWelcomeStage("idle");
    setNameInput("");
    setNameAttempts(0);
    setCurrentIndex(null);
    setLives(3);
    setMessages([]);
    setAnswering(false);
    setGameStatus("idle");
    stopIf(mainAudioRef);
    stopIf(loveAudioRef);
  }

  function closeInitialModal() {
    setInitialModalOpen(false);
    localStorage.setItem("seenInitialModal", "true");
    playIf(mainAudioRef);
  }

  useEffect(() => {
    document.documentElement.style.overflow = (gameModalOpen || infoModalOpen || initialModalOpen) ? "hidden" : "";
  }, [gameModalOpen, infoModalOpen, initialModalOpen]);

  function renderQuestion() {
    if (currentIndex === null) {
      if (gameStatus === "lost") {
        return (
          <div className="end-screen">
            <img src="/lose.gif" alt="lose" className="end-gif" />
            <h3>Oh no, baby, you lost. Try again!</h3>
            <button className="btn" onClick={closeGame}>Close</button>
          </div>
        );
      }
      if (gameStatus === "won") {
        return (
          <div className="end-screen">
            <img src="/love.png" alt="love" className="love-img" />
            <h3>Congratulations! You won</h3>
            <p className="final-msg">An infinite supply of love for you, my Baby Pearl!</p>
            <button className="btn" onClick={closeGame}>*kiss on cheek*</button>
          </div>
        );
      }
      return null;
    }

    const q = QUESTIONS[currentIndex];
    const roundLabel = `Round ${q.round}`;
    return (
      <div className="question-wrap">
        <div className="round-pill">{roundLabel}</div>
        <h3 className="prompt">{q.prompt}</h3>
        <div className="options">
          {q.options.map((opt, i) => (
            <button
              key={i}
              className="option-btn"
              onClick={() => chooseAnswer(i)}
              disabled={answering}
            >
              <span className="option-letter">{String.fromCharCode(65 + i)}:</span> {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="title">The game show!</div>
          <div className="top-actions">
            <i className="fa fa-heart fa-lg top-heart pulse" onClick={() => setInfoModalOpen(true)} title="Info" />
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="bg-holder">
          <a href="/dedication.png" target="_blank"><img src="/background.gif" alt="background" className="bg-gif" />
        </a></div>

        <section className="start-section">
          <button className="start-btn glare" onClick={handlePulsingStartClick}>
            <span>Let's Start The Game!</span>
          </button>
        </section>
      </main>

      {/* Initial Welcome Modal */}
      {initialModalOpen && (
        <div className="modal-overlay">
          <div className="modal transparent" style={{ textAlign: "center" }}>
            <h2>Welcome!</h2>
            <p>Enjoy the game with some background music 🎵</p>
            <button className="btn" onClick={closeInitialModal}>Start</button>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {infoModalOpen && (
        <div className="modal-overlay" onClick={() => setInfoModalOpen(false)}>
          <div className="modal transparent" onClick={(e) => e.stopPropagation()}>
            <h2>Hey there, my baby girl!</h2>
            <p>I've made this special page for a special edition of ourt little game. You said no more working on the website for you but... you didn't say which one! Hope you enjoy ;D</p>
            <button className="btn" onClick={() => setInfoModalOpen(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Game Modal */}
      {gameModalOpen && (
        <div className="modal-overlay" onClick={closeGame}>
          <div className="modal game-modal transparent" onClick={(e) => e.stopPropagation()}>
            {showWheel && (
              <div className="wheel-wrap">
                <img src="/wheel.gif" alt="wheel" className="wheel-gif" />
              </div>
            )}

            {welcomeStage === "askName" && !showWheel && (
              <div className="name-panel">
                <h2>Welcome! Should we start the game?</h2>
                <form onSubmit={submitName} className="name-form">
                  <input
                    className="name-input"
                    placeholder="..."
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    required
                    autoFocus
                  />
                  <button className="btn" type="submit">Submit</button>
                </form>
                {nameError && <div className="name-error">{nameError}</div>}
                <div className="hint">Type your name to begin!</div>
              </div>
            )}

            {welcomeStage === "started" && <div className="game-panel">{renderQuestion()}</div>}

            {welcomeStage === "started" && (
              <div className="modal-lives" aria-hidden={false}>
                {Array.from({ length: 3 }).map((_, i) => {
                  const alive = i < lives;
                  return <i key={i} className={`fa fa-heart ${alive ? "pulse" : "dead"}`} aria-hidden="true" />;
                })}
              </div>
            )}

            <div className="messages">
              {messages.slice(-2).map((m, i) => <div key={i} className="msg">{m}</div>)}
            </div>

            <button className="close-x" onClick={closeGame}><i className="fa fa-times" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
