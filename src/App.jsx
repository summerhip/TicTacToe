import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [reverseMode, setReverseMode] = useState(false);
  const [showTie, setShowTie] = useState(false);
  const [shake, setShake] = useState(false);
  const [isAIMode, setIsAIMode] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Start playing music when game starts
    if (gameStarted && audioRef.current) {
      audioRef.current
        .play()
        .catch((e) => console.log("Audio play failed:", e));
    }
  }, [gameStarted]);

  // Create arcade-style background music
  useEffect(() => {
    const audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();
    const notes = [262, 294, 330, 349, 392, 440, 494, 523]; // C major scale
    const melody = [0, 2, 4, 2, 0, 2, 4, 2, 4, 5, 7, 4, 5, 7];
    let currentNote = 0;
    let oscillator = null;
    let gainNode = null;
    let isPlaying = false;

    const playNote = () => {
      if (!gameStarted || !isPlaying) return;

      // Stop previous note
      if (oscillator) {
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          audioContext.currentTime + 0.1,
        );
        oscillator.stop(audioContext.currentTime + 0.1);
      }

      // Create new note
      oscillator = audioContext.createOscillator();
      gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(
        notes[melody[currentNote]],
        audioContext.currentTime,
      );

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.3,
      );

      oscillator.start(audioContext.currentTime);

      currentNote = (currentNote + 1) % melody.length;
    };

    if (gameStarted) {
      isPlaying = true;
      const interval = setInterval(playNote, 400);
      return () => {
        isPlaying = false;
        clearInterval(interval);
        if (oscillator) {
          try {
            oscillator.stop();
          } catch (e) {
            // Ignore if already stopped
          }
        }
      };
    }
  }, [gameStarted]);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (
        squares[a] &&
        squares[a] === squares[b] &&
        squares[a] === squares[c]
      ) {
        return squares[a];
      }
    }
    return null;
  };

  const handleClick = (index) => {
    if (board[index] || gameOver) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? "X" : "O";
    setBoard(newBoard);

    const threeInRow = calculateWinner(newBoard);
    if (threeInRow) {
      setGameOver(true);
      if (reverseMode) {
        // In reverse mode, getting 3 in a row means you LOSE
        // So the OTHER player wins
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      } else {
        // Normal mode: getting 3 in a row means you WIN
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
    } else if (!newBoard.includes(null)) {
      setGameOver(true);
      setShowTie(true);
      setShake(true);
      setTimeout(() => {
        setShowTie(false);
        setShake(false);
      }, 3000);
    } else {
      setIsXNext(!isXNext);
    }
  };

  const handleStartGame = (e) => {
    e.preventDefault();
    if (player1Name.trim() && (player2Name.trim() || isAIMode)) {
      if (isAIMode) {
        setPlayer2Name("BOT 🤖");
      }
      setGameStarted(true);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setGameOver(false);
    setShowConfetti(false);
    setShowTie(false);
    setShake(false);
  };

  // AI logic for smart moves
  const getAIMove = (currentBoard) => {
    const availableMoves = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((val) => val !== null);

    if (availableMoves.length === 0) return null;

    // Try to win
    for (let move of availableMoves) {
      const testBoard = [...currentBoard];
      testBoard[move] = "O";
      if (calculateWinner(testBoard) === "O") {
        return move;
      }
    }

    // Try to block player from winning
    for (let move of availableMoves) {
      const testBoard = [...currentBoard];
      testBoard[move] = "X";
      if (calculateWinner(testBoard) === "X") {
        return move;
      }
    }

    // Take center if available
    if (availableMoves.includes(4)) {
      return 4;
    }

    // Take a corner if available
    const corners = [0, 2, 6, 8].filter((c) => availableMoves.includes(c));
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    // Take any available move
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  };

  // AI makes moves automatically
  useEffect(() => {
    if (isAIMode && !isXNext && !gameOver && gameStarted) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove(board);
        if (aiMove !== null) {
          handleClick(aiMove);
        }
      }, 500); // Slight delay to make it feel more natural
      return () => clearTimeout(timer);
    }
  }, [isXNext, gameOver, gameStarted, isAIMode, board]);

  const toggleReverseMode = () => {
    setReverseMode(!reverseMode);
    resetGame();
  };

  const threeInRow = calculateWinner(board);
  const isDraw = !threeInRow && !board.includes(null);

  const getPlayerName = (symbol) => {
    return symbol === "X" ? player1Name : player2Name;
  };

  const currentPlayerName = isXNext ? player1Name : player2Name;

  let winner = null;
  if (threeInRow) {
    if (reverseMode) {
      // In reverse mode, getting 3 in a row means you LOSE
      winner = threeInRow === "X" ? "O" : "X";
    } else {
      // Normal mode
      winner = threeInRow;
    }
  }

  let status;
  if (winner) {
    status = `${getPlayerName(winner)} Wins! 🎉`;
  } else if (isDraw) {
    status = "It's a Draw! 🤝";
  } else {
    status = `${currentPlayerName}'s Turn (${isXNext ? "X" : "O"})`;
  }

  if (!gameStarted) {
    return (
      <div className="game">
        <h1>Tic Tac Toe</h1>
        <form className="name-form" onSubmit={handleStartGame}>
          <h2>Enter Player Names</h2>
          <div className="input-group">
            <label htmlFor="player1">Player 1 (X):</label>
            <input
              id="player1"
              type="text"
              value={player1Name}
              onChange={(e) => setPlayer1Name(e.target.value)}
              placeholder="Enter name"
              maxLength={20}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="player2">Player 2 (O):</label>
            <input
              id="player2"
              type="text"
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value)}
              placeholder="Enter name"
              maxLength={20}
              required={!isAIMode}
              disabled={isAIMode}
            />
          </div>
          <div className="ai-option">
            <label className="ai-checkbox">
              <input
                type="checkbox"
                checked={isAIMode}
                onChange={(e) => {
                  setIsAIMode(e.target.checked);
                  if (e.target.checked) {
                    setPlayer2Name("");
                  }
                }}
              />
              <span>🤖 Play against BOT</span>
            </label>
          </div>
          <button type="submit" className="start-button">
            Start Game
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={`game ${shake ? "shake" : ""}`}>
      <h1>Tic Tac Toe</h1>
      <button className="reverse-button" onClick={toggleReverseMode}>
        {reverseMode ? "🔄 REVERSE MODE" : "🎯 NORMAL MODE"}
      </button>
      {showTie && <div className="tie-announcement">🤝 TIE! 🤝</div>}
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
              }}
            ></div>
          ))}
        </div>
      )}
      {winner && showConfetti && (
        <div className="winner-announcement">
          🎊 {getPlayerName(winner)} Wins! 🎊
        </div>
      )}
      <div className="status">{status}</div>
      <div className="board">
        {board.map((value, index) => (
          <button
            key={index}
            className={`square ${value ? "filled" : ""}`}
            onClick={() => handleClick(index)}
          >
            {value}
          </button>
        ))}
      </div>
      <button className="reset-button" onClick={resetGame}>
        New Game
      </button>
      {reverseMode && (
        <p className="mode-description">
          ⚠️ Reverse Mode: Avoid getting 3 in a row!
        </p>
      )}
    </div>
  );
}

export default App;
