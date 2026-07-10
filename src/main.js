import "./style.css"

// Board configuration
const BOARD_SIZE = 5
const CELL_SIZE = 64
const CELL_GAP = 2

// Knight moves (L-shape: 2 squares in one direction, 1 perpendicular)
const KNIGHT_MOVES = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
]

// Correct solution coordinates (row, col) for 16 knights
// Each knight attacks exactly 2 others - verified by exhaustive search
// Board pattern:
// . N N N .
// N N . N N
// N . . . N
// N N . N N
// . N N N .
const SOLUTION_KNIGHTS = [
  [0, 1],
  [0, 2],
  [0, 3], // Top row
  [1, 0],
  [1, 1],
  [1, 3],
  [1, 4], // Row 1
  [2, 0],
  [2, 4], // Row 2 (just corners)
  [3, 0],
  [3, 1],
  [3, 3],
  [3, 4], // Row 3
  [4, 1],
  [4, 2],
  [4, 3], // Bottom row
]

// Game state
let board = []
let knightCount = 0
let pendingTimeouts = []

// DOM elements
const boardEl = document.getElementById("board")
const attackLinesEl = document.getElementById("attack-lines")
const knightCountEl = document.getElementById("knight-count")
const messageOverlay = document.getElementById("message-overlay")
const messageText = document.getElementById("message-text")
const messageIcon = document.getElementById("message-icon")
const messageTitle = document.getElementById("message-title")

// Initialize the game
function init() {
  createBoard()
  setupEventListeners()
}

// Create the chess board
function createBoard() {
  boardEl.innerHTML = ""
  board = []

  for (let row = 0; row < BOARD_SIZE; row++) {
    board[row] = []
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = document.createElement("div")
      cell.className = `cell ${(row + col) % 2 === 0 ? "light" : "dark"}`
      cell.dataset.row = row
      cell.dataset.col = col
      boardEl.appendChild(cell)
      board[row][col] = { element: cell, hasKnight: false }
    }
  }
}

// Setup event listeners
function setupEventListeners() {
  boardEl.addEventListener("click", handleCellClick)
  document.getElementById("btn-check").addEventListener("click", checkSolution)
  document
    .getElementById("btn-solution")
    .addEventListener("click", showSolution)
  document.getElementById("btn-clear").addEventListener("click", clearBoard)
  document
    .getElementById("btn-close-message")
    .addEventListener("click", closeMessage)
}

// Handle cell click - toggle knight
function handleCellClick(e) {
  const cell = e.target.closest(".cell")
  if (!cell) return

  const row = parseInt(cell.dataset.row)
  const col = parseInt(cell.dataset.col)

  if (board[row][col].hasKnight) {
    removeKnight(row, col)
  } else {
    placeKnight(row, col)
  }

  updateKnightCount()
  clearValidation()
}

// Place a knight on the board
function placeKnight(row, col) {
  board[row][col].hasKnight = true
  const knight = document.createElement("span")
  knight.className = "knight entering"
  knight.textContent = "♞"
  board[row][col].element.appendChild(knight)

  // Remove animation class after animation completes
  setTimeout(() => knight.classList.remove("entering"), 400)
}

// Remove a knight from the board
function removeKnight(row, col) {
  board[row][col].hasKnight = false
  const knight = board[row][col].element.querySelector(".knight")
  if (knight) {
    knight.remove()
  }
}

// Update the knight counter display
function updateKnightCount() {
  knightCount = 0
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].hasKnight) knightCount++
    }
  }
  knightCountEl.textContent = knightCount
}

// Get all positions that a knight can attack
function getKnightAttacks(row, col) {
  const attacks = []
  for (const [dr, dc] of KNIGHT_MOVES) {
    const newRow = row + dr
    const newCol = col + dc
    if (
      newRow >= 0 &&
      newRow < BOARD_SIZE &&
      newCol >= 0 &&
      newCol < BOARD_SIZE
    ) {
      if (board[newRow][newCol].hasKnight) {
        attacks.push([newRow, newCol])
      }
    }
  }
  return attacks
}

// Validate the solution - check if all knights attack exactly 2 others
function validateKnights() {
  const results = []
  const knightPositions = []

  // Collect all knight positions
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].hasKnight) {
        knightPositions.push([row, col])
      }
    }
  }

  // Check each knight
  for (const [row, col] of knightPositions) {
    const attacks = getKnightAttacks(row, col)
    const isValid = attacks.length === 2
    results.push({ row, col, isValid, attackCount: attacks.length, attacks })
  }

  return results
}

// Draw attack lines between knights
function drawAttackLines(validationResults) {
  attackLinesEl.innerHTML = ""

  // Calculate board dimensions
  const totalWidth = BOARD_SIZE * CELL_SIZE + (BOARD_SIZE - 1) * CELL_GAP
  const totalHeight = BOARD_SIZE * CELL_SIZE + (BOARD_SIZE - 1) * CELL_GAP
  attackLinesEl.style.width = totalWidth + "px"
  attackLinesEl.style.height = totalHeight + "px"

  // Draw lines for each knight
  for (const { row, col, isValid, attacks } of validationResults) {
    const fromX = col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2
    const fromY = row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2

    for (const [toRow, toCol] of attacks) {
      const toX = toCol * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2
      const toY = toRow * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2

      const line = document.createElement("div")
      const dx = toX - fromX
      const dy = toY - fromY
      const length = Math.sqrt(dx * dx + dy * dy)
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI

      line.className = `attack-line ${isValid ? "valid" : "invalid"}`
      line.style.left = fromX + "px"
      line.style.top = fromY + "px"
      line.style.width = length + "px"
      line.style.transform = `rotate(${angle}deg)`

      attackLinesEl.appendChild(line)
    }
  }
}

// Check the solution
function checkSolution() {
  const results = validateKnights()
  drawAttackLines(results)

  let allValid = true
  const knightCount = results.length

  for (const { row, col, isValid, attackCount } of results) {
    const knight = board[row][col].element.querySelector(".knight")
    const cell = board[row][col].element

    if (isValid) {
      knight?.classList.add("valid")
      cell.classList.add("valid-cell")
    } else {
      knight?.classList.add("invalid")
      cell.classList.add("invalid-cell")
      allValid = false
    }
  }

  if (knightCount === 0) {
    showMessage("⚠️", "Увага!", "Спочатку поставте коней на дошку!")
  } else if (!allValid) {
    showMessage("❌", "Помилка!", "Не всі коні задовольняють умову.")
  } else if (knightCount === 16) {
    showMessage("🎉", "Вітаємо!", "Ви знайшли максимальне розв'язання задачі.")
  } else {
    showMessage(
      "✅",
      "Добре!",
      "Умову виконано, але це ще не максимальний результат. Спробуйте знайти краще розв'язання.",
    )
  }
}

// Clear validation styling
function clearValidation() {
  attackLinesEl.innerHTML = ""
  document.querySelectorAll(".knight").forEach((k) => {
    k.classList.remove("valid", "invalid")
  })
  document.querySelectorAll(".cell").forEach((c) => {
    c.classList.remove("valid-cell", "invalid-cell")
  })
}

// Show the correct solution
function showSolution() {
  clearBoard()

  // Animate placing knights one by one
  let delay = 0
  for (const [row, col] of SOLUTION_KNIGHTS) {
    const timeoutId = setTimeout(() => {
      placeKnight(row, col)
      updateKnightCount()
    }, delay)
    pendingTimeouts.push(timeoutId)
    delay += 80
  }

  // Validate after all knights are placed
  const checkTimeoutId = setTimeout(() => {
    checkSolution()
  }, delay + 100)
  pendingTimeouts.push(checkTimeoutId)
}

// Clear all pending timeouts
function clearPendingTimeouts() {
  for (const id of pendingTimeouts) {
    clearTimeout(id)
  }
  pendingTimeouts = []
}

// Clear the board
function clearBoard() {
  clearPendingTimeouts()
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col].hasKnight = false
      const knight = board[row][col].element.querySelector(".knight")
      if (knight) knight.remove()
    }
  }
  updateKnightCount()
  clearValidation()
}

// Show message overlay
function showMessage(icon, title, text) {
  messageIcon.textContent = icon
  messageTitle.textContent = title
  messageText.textContent = text
  messageOverlay.classList.add("show")
}

// Close message overlay
function closeMessage() {
  messageOverlay.classList.remove("show")
  clearBoard()
}

// Initialize the game when DOM is ready
init()
