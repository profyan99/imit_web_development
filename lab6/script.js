const BOARD_SIZE = 8;
const CHECKERS_AMOUNT = 12;
const IMG_SIZE = 40;

const TEAM_TYPES = {
  WHITE: 'white',
  BLACK: 'black'
};
const TURN_TYPES = {
  QUIET: 'quite',
  CAPTURE: 'capture',
};
const CELL_TYPES = {
  BLACK_KING: 'BK',
  BLACK_DEFAULT: 'BD',
  WHITE_KING: 'WK',
  WHITE_DEFAULT: 'WD',
  EMPTY: 'E',
};
const CELL_STATE = {
  DEFAULT: 'default',
  PROMPT: 'prompt',
  AVAILABLE: 'available',
  REQUIRED: 'required',
};
const CHECKER_IMAGES = {
  [CELL_TYPES.BLACK_DEFAULT]: './img/black_default.png',
  [CELL_TYPES.BLACK_KING]: './img/black_king.png',
  [CELL_TYPES.WHITE_DEFAULT]: './img/white_default.png',
  [CELL_TYPES.WHITE_KING]: './img/white_king.png',
};
const COLORS = {
  ACTIVE_CHECKER: '#e7e566',
  AVAILABLE_FIELD: '#83bf69',
  REQUIRED_FIELD: '#b76060',
};
const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

let boardModel = Array.from(Array(BOARD_SIZE),
  () => Array(BOARD_SIZE),
);
let savedBoardModel = null;
let isPromptModeEnabled = false;
let isTurnOver = false;
let turnsTable = [];
let availableTurnModels = [];
let requiredTurnCheckers = [];
let turnModel = null;
let sourceModel = null;
let currentTeam = null;
let turnCount = 0;
let winner = null;

let checkerEls = [];
let currentTurnEl = null;
let turnsTableEl = null;
let endTurnButton = null;
let cancelTurnButton = null;
let parseTurnsButton = null;
let turnsTextAreaEl = null;
let turnsErrorTextEl = null;

const onCellClick = (rowIndex, colIndex) => {
  const cellModel = boardModel[rowIndex][colIndex];

  if (isPromptModeEnabled) {
    if (cellModel.state === CELL_STATE.PROMPT) {
      disablePromptMode();
      renderAllCheckers();

      return -3;
    }

    if (cellModel.team) {
      throw new Error('Не ваша шашка');
    }

    return handleTurn(cellModel);
  } else if (!isPromptModeEnabled && !isTurnOver
    && cellModel.team === currentTeam
    && (!requiredTurnCheckers.length || requiredTurnCheckers.includes(cellModel))) {
    enablePromptMode(rowIndex, colIndex);
    renderAllCheckers();

    return -1;
  }

  return -2;
};

const setDefaultArrangement = () => {
  const rowsAmount = CHECKERS_AMOUNT / (BOARD_SIZE / 2);

  const isNeedToFillCell = (row, col) => {
    return row % 2 === 1 && col % 2 === 0
      || row % 2 === 0 && col % 2 === 1;
  };

  initBoard();
  changeTurn();

  // fill the blacks
  for (let row = 0; row < rowsAmount; row++) {
    for (let col = 0; col < boardModel[row].length; col++) {
      if (isNeedToFillCell(row, col)) {
        boardModel[row][col].type = CELL_TYPES.BLACK_DEFAULT;
        boardModel[row][col].team = TEAM_TYPES.BLACK;
      } else {
        boardModel[row][col].type = CELL_TYPES.EMPTY;
      }
    }
  }

  // fill the whites
  for (let row = boardModel.length - rowsAmount; row < boardModel.length; row++) {
    for (let col = 0; col < boardModel[row].length; col++) {
      if (isNeedToFillCell(row, col)) {
        boardModel[row][col].type = CELL_TYPES.WHITE_DEFAULT;
        boardModel[row][col].team = TEAM_TYPES.WHITE;
      } else {
        boardModel[row][col].type = CELL_TYPES.EMPTY;
      }
    }
  }
};

const initBoard = () => {
  for (let row = 0; row < boardModel.length; row++) {
    for (let col = 0; col < boardModel[row].length; col++) {
      boardModel[row][col] = {
        type: CELL_TYPES.EMPTY,
        state: CELL_STATE.DEFAULT,
        row,
        col,
      };
    }
  }

  isPromptModeEnabled = false;
  currentTeam = null;
  turnsTable = [];
  availableTurnModels = [];
  sourceModel = null;
  turnCount = 0;
  turnModel = null;
  isTurnOver = false;
  winner = null;
};

const renderChecker = (row, col) => {
  const checker = checkerEls[row][col];
  const checkerModel = boardModel[row][col];
  const { type, state, defaultBackground } = checkerModel;

  if (type !== CELL_TYPES.EMPTY) {
    const existedImg = checker.firstChild;

    if (existedImg) {
      existedImg.src = CHECKER_IMAGES[type];
    } else {
      const img = document.createElement('img');
      img.src = CHECKER_IMAGES[type];
      img.width = IMG_SIZE;
      checker.appendChild(img);
    }
  } else {
    checker.innerHTML = '';
  }

  switch (state) {
    case CELL_STATE.DEFAULT: {
      checker.style.backgroundColor = null;
      checker.style.cursor = 'default';
      break;
    }
    case CELL_STATE.PROMPT: {
      checker.style.backgroundColor = COLORS.ACTIVE_CHECKER;
      break;
    }
    case CELL_STATE.AVAILABLE: {
      checker.style.backgroundColor = COLORS.AVAILABLE_FIELD;
      checker.style.cursor = 'pointer';
      break;
    }
    case CELL_STATE.REQUIRED: {
      checker.style.backgroundColor = COLORS.REQUIRED_FIELD;
      checker.style.cursor = 'pointer';
      break;
    }
  }
};

const getTurnFormatted = ({ places, type } = {}) => {
  const separator = {
    [TURN_TYPES.CAPTURE]: ':',
    [TURN_TYPES.QUIET]: '-',
  }[type];

  return places.reduce((acc, place) => {
    if (!acc.includes(place)) {
      acc.push(place);
    }
    return acc;
  }, []).join(separator);
};

const renderTurnsTable = () => {
  turnsTableEl.innerHTML = turnsTable
    .reduce((acc, turn, index) => {
      acc += (`${index + 1}. ${getTurnFormatted(turn[TEAM_TYPES.WHITE])}`);
      if (turn[TEAM_TYPES.BLACK]) {
        acc += (` ${getTurnFormatted(turn[TEAM_TYPES.BLACK])}<br>`);
      }
      return acc;
    }, '');
};

const renderActions = () => {
  const displayStatus = turnModel
    ? ''
    : 'none';

  endTurnButton.style.display = displayStatus;
  cancelTurnButton.style.display = displayStatus;
};

const renderTurnInfo = () => {
  const getTeamName = (team) => team === TEAM_TYPES.BLACK
    ? 'черные'
    : 'белые';

  let text;
  if (winner) {
    text = `Выиграли ${getTeamName(winner)}`;
  } else {
    text = `Ходят ${getTeamName(currentTeam)}`;
  }

  currentTurnEl.textContent = text;
};

const renderAllCheckers = () => {
  checkerEls.length && checkerEls.forEach((row, rowIndex) => {
    row.forEach((checker, colIndex) => {
      renderChecker(rowIndex, colIndex);
    });
  });

  currentTurnEl && renderTurnInfo();
  turnsTableEl && renderTurnsTable();
  endTurnButton && cancelTurnButton && renderActions();
};

const init = () => {
  const CELLS_SELECTOR = '.game tr:not(:first-child):not(:last-child) td:not(:first-child):not(:last-child)';
  checkerEls = Array.from(document.querySelectorAll(CELLS_SELECTOR))
    .reduce((acc, cell, index) => {
      const row = Math.floor(index / BOARD_SIZE);
      acc[row] = acc[row] || [];
      acc[row].push(cell);
      return acc;
    }, Array(BOARD_SIZE));

  setDefaultArrangement();

  checkerEls.forEach((row, rowIndex) => {
    row.forEach((checker, colIndex) => {
      checker.addEventListener('click', () => {
        try {
          onCellClick(rowIndex, colIndex);
        } catch (e) {
          console.log(e);
        }
      });
    });
  });

  currentTurnEl = document.getElementById('current-turn');
  turnsTableEl = document.getElementById('turns-table');
  endTurnButton = document.getElementById('button__end_turn');
  cancelTurnButton = document.getElementById('button__cancel_turn');
  parseTurnsButton = document.getElementById('button__parse_turns');
  turnsTextAreaEl = document.getElementById('textarea_turns');
  turnsErrorTextEl = document.getElementById('text_turns-error');

  renderAllCheckers();
};

const isEmpty = (checker) => {
  return checker.type === CELL_TYPES.EMPTY;
};

const calculateTurnsForKing = (row, col, team, availableTurnModels) => {
  const directions = {
    topLeft: {
      target: null,
      available: true,
    },
    topRight: {
      target: null,
      available: true,
    },
    bottomLeft: {
      target: null,
      available: true,
    },
    bottomRight: {
      target: null,
      available: true,
    },
  };

  const calcDirection = (model, direction) => {
    if (model.team === team && !direction.target) {
      direction.target = model;
    } else if (isEmpty(model)) {
      model.state = direction.target
        ? CELL_STATE.REQUIRED
        : CELL_STATE.AVAILABLE;
      model.target = direction.target;
      availableTurnModels.push(model);
    } else {
      direction.available = false;
    }
  };

  for (let curRow = row - 1; curRow >= 0; curRow--) {
    const rowDiff = Math.abs(row - curRow);

    // top left
    if (col - rowDiff >= 0 && directions.topLeft.available) {
      calcDirection(boardModel[curRow][col - rowDiff], directions.topLeft);
    }

    // top right
    if (col + rowDiff < BOARD_SIZE && directions.topRight.available) {
      calcDirection(boardModel[curRow][col + rowDiff], directions.topRight);
    }
  }

  for (let curRow = row + 1; curRow < BOARD_SIZE; curRow++) {
    const rowDiff = Math.abs(row - curRow);

    // bottom left
    if (col - rowDiff >= 0 && directions.bottomLeft.available) {
      calcDirection(boardModel[curRow][col - rowDiff], directions.bottomLeft);
    }

    // bottom right
    if (col + rowDiff < BOARD_SIZE && directions.bottomRight.available) {
      calcDirection(boardModel[curRow][col + rowDiff], directions.bottomRight);
    }
  }
};

const isRequiredTurnExist = () => availableTurnModels.length
  && availableTurnModels.some((model) => model.state === CELL_STATE.REQUIRED);

const enablePromptMode = (row, col) => {
  sourceModel = boardModel[row][col];
  sourceModel.state = CELL_STATE.PROMPT;

  isPromptModeEnabled = true;

  availableTurnModels = [];

  if (sourceModel.team === TEAM_TYPES.WHITE) {
    if (sourceModel.type === CELL_TYPES.WHITE_KING) {
      calculateTurnsForKing(row, col, TEAM_TYPES.BLACK, availableTurnModels);
    } else {
      if (row - 1 >= 0 && col - 1 >= 0) {
        const avModel = boardModel[row - 1][col - 1];

        if (avModel.team === TEAM_TYPES.BLACK
          && (row - 2 >= 0 && col - 2 >= 0)
          && isEmpty(boardModel[row - 2][col - 2])) {
          const trModel = boardModel[row - 2][col - 2];
          trModel.state = CELL_STATE.REQUIRED;
          trModel.target = avModel;
          availableTurnModels.push(trModel);
        } else if (isEmpty(avModel)) {
          avModel.state = CELL_STATE.AVAILABLE;
          availableTurnModels.push(avModel);
        }
      }

      if (row - 1 >= 0 && col + 1 < BOARD_SIZE) {
        const avModel = boardModel[row - 1][col + 1];

        if (avModel.team === TEAM_TYPES.BLACK
          && (row - 2 >= 0 && col + 2 < BOARD_SIZE)
          && isEmpty(boardModel[row - 2][col + 2])) {
          const trModel = boardModel[row - 2][col + 2];
          trModel.state = CELL_STATE.REQUIRED;
          trModel.target = avModel;
          availableTurnModels.push(trModel);
        } else if (isEmpty(avModel)) {
          avModel.state = CELL_STATE.AVAILABLE;
          availableTurnModels.push(avModel);
        }
      }

      if (row + 1 < BOARD_SIZE && col - 1 >= 0) {
        const avModel = boardModel[row + 1][col - 1];

        if (avModel.team === TEAM_TYPES.BLACK
          && (row + 2 < BOARD_SIZE && col - 2 >= 0)
          && isEmpty(boardModel[row + 2][col - 2])) {
          const trModel = boardModel[row + 2][col - 2];
          trModel.state = CELL_STATE.REQUIRED;
          trModel.target = avModel;
          availableTurnModels.push(trModel);
        }
      }

      if (row + 1 < BOARD_SIZE && col + 1 < BOARD_SIZE) {
        const avModel = boardModel[row + 1][col + 1];

        if (avModel.team === TEAM_TYPES.BLACK
          && (row + 2 < BOARD_SIZE && col + 2 < BOARD_SIZE)
          && isEmpty(boardModel[row + 2][col + 2])) {
          const trModel = boardModel[row + 2][col + 2];
          trModel.state = CELL_STATE.REQUIRED;
          trModel.target = avModel;
          availableTurnModels.push(trModel);
        }
      }
    }
  } else if (sourceModel.team === TEAM_TYPES.BLACK) {
    if (sourceModel.type === CELL_TYPES.BLACK_KING) {
      calculateTurnsForKing(row, col, TEAM_TYPES.WHITE, availableTurnModels);
    } else {
      if (row + 1 < BOARD_SIZE && col - 1 >= 0) {
        const avModel = boardModel[row + 1][col - 1];

        if (avModel.team === TEAM_TYPES.WHITE
          && (row + 2 < BOARD_SIZE && col - 2 >= 0)
          && isEmpty(boardModel[row + 2][col - 2])) {
          const trModel = boardModel[row + 2][col - 2];

          trModel.state = CELL_STATE.REQUIRED;
          trModel.target = avModel;
          availableTurnModels.push(trModel);
        } else if (isEmpty(avModel)) {
          avModel.state = CELL_STATE.AVAILABLE;
          availableTurnModels.push(avModel);
        }
      }

      if (row + 1 < BOARD_SIZE && col + 1 < BOARD_SIZE) {
        const avModel = boardModel[row + 1][col + 1];

        if (avModel.team === TEAM_TYPES.WHITE
          && (row + 2 < BOARD_SIZE && col + 2 < BOARD_SIZE)
          && isEmpty(boardModel[row + 2][col + 2])) {
          const trModel = boardModel[row + 2][col + 2];

          trModel.state = CELL_STATE.REQUIRED;
          trModel.target = avModel;
          availableTurnModels.push(trModel);
        } else if (isEmpty(avModel)) {
          avModel.state = CELL_STATE.AVAILABLE;
          availableTurnModels.push(avModel);
        }
      }

      if (row - 1 >= 0 && col - 1 >= 0) {
        const avModel = boardModel[row - 1][col - 1];

        if (avModel.team === TEAM_TYPES.WHITE
          && (row - 2 >= 0 && col - 2 >= 0)
          && isEmpty(boardModel[row - 2][col - 2])) {
          const trModel = boardModel[row - 2][col - 2];

          trModel.state = CELL_STATE.REQUIRED;
          trModel.target = avModel;
          availableTurnModels.push(trModel);
        }
      }

      if (row - 1 >= 0 && col + 1 < BOARD_SIZE) {
        const avModel = boardModel[row - 1][col + 1];

        if (avModel.team === TEAM_TYPES.WHITE
          && (row - 2 >= 0 && col + 2 < BOARD_SIZE)
          && isEmpty(boardModel[row - 2][col + 2])) {
          const trModel = boardModel[row - 2][col + 2];

          trModel.state = CELL_STATE.REQUIRED;
          trModel.target = avModel;
          availableTurnModels.push(trModel);
        }
      }
    }
  }

  if (isRequiredTurnExist()) {
    availableTurnModels = availableTurnModels.reduce((acc, model) => {
      if (model.state !== CELL_STATE.REQUIRED) {
        model.state = CELL_STATE.DEFAULT;
      } else {
        acc.push(model);
      }
      return acc;
    }, []);
  }
};

const disablePromptMode = () => {
  for (let row = 0; row < boardModel.length; row++) {
    for (let col = 0; col < boardModel[row].length; col++) {
      boardModel[row][col].state = CELL_STATE.DEFAULT;
    }
  }
  isPromptModeEnabled = false;
};

const getTeamRequiredTurns = () => {
  requiredTurnCheckers = boardModel
    .reduce((acc, row) => {
      row
        .filter((cell) => cell.team === currentTeam)
        .forEach((cell) => {
          enablePromptMode(cell.row, cell.col);
          if (isRequiredTurnExist()) {
            acc.push(cell);
          }
          disablePromptMode();
        });
      return acc;
    }, []);
};

const changeTurn = () => {
  currentTeam = currentTeam === TEAM_TYPES.WHITE
    ? TEAM_TYPES.BLACK
    : TEAM_TYPES.WHITE;

  savedBoardModel = JSON.parse(JSON.stringify(boardModel));

  getTeamRequiredTurns();
};

const checkForTheKing = (model) => {
  if (model.team === TEAM_TYPES.BLACK && model.row === BOARD_SIZE - 1) {
    model.type = CELL_TYPES.BLACK_KING;
  } else if (model.team === TEAM_TYPES.WHITE && model.row === 0) {
    model.type = CELL_TYPES.WHITE_KING;
  }
};

const transformRowColToReadableForm = ({ row, col }) => {
  return `${letters[col]}${BOARD_SIZE - row}`;
};

const transformReadableFormToRowCol = (point) => {
  return {
    col: letters.indexOf(point.charAt(0)),
    row: BOARD_SIZE - parseInt(point.charAt(1)),
  };
};

const handleTurn = (targetModel) => {
  if (isTurnOver) {
    throw new Error('Ход уже закончен');
  }

  const availableTurn = availableTurnModels
    .find((model) => model.row === targetModel.row && model.col === targetModel.col);

  if (!availableTurn) {
    throw new Error('Нет доступных ходов');
  }

  let isCapture = Boolean(availableTurn.target);
  const { row, col } = targetModel;
  boardModel[row][col] = sourceModel;
  boardModel[sourceModel.row][sourceModel.col] = targetModel;

  targetModel.row = sourceModel.row;
  targetModel.col = sourceModel.col;
  sourceModel.row = row;
  sourceModel.col = col;

  disablePromptMode();

  turnModel = {
    places: [
      ...(turnModel && turnModel.places || []),
      transformRowColToReadableForm(targetModel),
      transformRowColToReadableForm(sourceModel),
    ],
    type: availableTurn.target
      ? TURN_TYPES.CAPTURE
      : TURN_TYPES.QUIET,
  };

  if (isCapture) {
    availableTurn.target.type = CELL_TYPES.EMPTY;
    availableTurn.target.state = CELL_STATE.DEFAULT;
    availableTurn.target.team = null;

    enablePromptMode(sourceModel.row, sourceModel.col);
    if (!isRequiredTurnExist()) {
      disablePromptMode();
      isTurnOver = true;
    }
  } else {
    isTurnOver = true;
  }

  checkForTheKing(sourceModel);

  renderAllCheckers();

  return isCapture ? 1 : 0;
};

const countTeamMembers = (team) => boardModel.reduce((acc, row) => {
  const teamMembers = row
    .filter((cell) => cell.team === team);
  return acc + (teamMembers || []).length;
}, 0);

const checkForWinner = () => {
  const whiteMembersAmount = countTeamMembers(TEAM_TYPES.WHITE);
  const blackMembersAmount = countTeamMembers(TEAM_TYPES.BLACK);

  if (!whiteMembersAmount) {
    winner = TEAM_TYPES.BLACK;
  } else if (!blackMembersAmount) {
    winner = TEAM_TYPES.WHITE;
  }
};

const processTurn = (turn, isLast) => {
  const error = new Error(`Не удалось применить запись партии.<br>Ошибка в строке: ${turn}`);
  const turnParts = turn.split(/\s+/);

  if (turnParts.length <= 1 || !isLast && turnParts.length <= 2) {
    throw error;
  }

  const processCommandTurn = (commandTurn) => {
    const isQuietTurn = commandTurn.includes('-');
    const isCaptureTurn = commandTurn.includes(':');
    if (isQuietTurn && isCaptureTurn || !isQuietTurn && !isCaptureTurn) {
      throw error;
    }

    const points = commandTurn.split(isQuietTurn ? '-' : ':');
    if (points.length <= 1) {
      throw error;
    }

    try {
      points.forEach((point) => {
        const { row, col } = transformReadableFormToRowCol(point);
        const result = onCellClick(row, col);

        if (result === 1 && isQuietTurn
          || result === 0 && isCaptureTurn
          || result === -2
          || result === -3) {
          throw error;
        }
      });

      onEndTurnClick();
    } catch (e) {
      throw error;
    }
  };

  processCommandTurn(turnParts[1]);
  turnParts.length > 2 && processCommandTurn(turnParts[2]);
};

// actions
const onStartClick = () => {
  setDefaultArrangement();
  renderAllCheckers();
};

const onExampleClick = () => {
  initBoard();

  boardModel[4][5].type = CELL_TYPES.WHITE_DEFAULT;
  boardModel[4][5].team = TEAM_TYPES.WHITE;

  boardModel[4][7].type = CELL_TYPES.WHITE_DEFAULT;
  boardModel[4][7].team = TEAM_TYPES.WHITE;


  boardModel[0][1].type = CELL_TYPES.BLACK_DEFAULT;
  boardModel[0][1].team = TEAM_TYPES.BLACK;

  boardModel[7][2].type = CELL_TYPES.BLACK_KING;
  boardModel[7][2].team = TEAM_TYPES.BLACK;

  boardModel[3][2].type = CELL_TYPES.BLACK_DEFAULT;
  boardModel[3][2].team = TEAM_TYPES.BLACK;

  boardModel[1][2].type = CELL_TYPES.BLACK_DEFAULT;
  boardModel[1][2].team = TEAM_TYPES.BLACK;

  boardModel[1][4].type = CELL_TYPES.BLACK_DEFAULT;
  boardModel[1][4].team = TEAM_TYPES.BLACK;

  boardModel[2][7].type = CELL_TYPES.BLACK_DEFAULT;
  boardModel[2][7].team = TEAM_TYPES.BLACK;

  changeTurn();
  renderAllCheckers();
};

const onEndTurnClick = () => {
  if (!isTurnOver) {
    throw new Error('Вы должны обязательно срубить');
  }

  turnsTable[turnCount] = turnsTable[turnCount] || {};
  turnsTable[turnCount][currentTeam] = turnModel;

  if (turnsTable[turnCount][TEAM_TYPES.WHITE]
    && turnsTable[turnCount][TEAM_TYPES.BLACK]) {
    turnCount++;
  }

  turnModel = null;
  isTurnOver = false;

  checkForWinner();
  disablePromptMode();
  changeTurn();
  renderAllCheckers();
};

const onCancelTurnClick = () => {
  disablePromptMode();

  boardModel = JSON.parse(JSON.stringify(savedBoardModel));

  turnModel = null;
  availableTurnModels = [];
  sourceModel = null;
  isTurnOver = false;

  getTeamRequiredTurns();

  renderAllCheckers();
};

const parseTurns = () => {
  setDefaultArrangement();
  renderAllCheckers();
  turnsErrorTextEl.innerHTML = '';

  if (!turnsTextAreaEl || !turnsTextAreaEl.value) {
    turnsErrorTextEl.innerHTML = 'Введите запись партии';
    return;
  }

  const turns = turnsTextAreaEl.value.trim().split('\n');
  if (!turns.length) {
    turnsErrorTextEl.innerHTML = 'Каждый ход должен быть на новой строке';
    return;
  }
  try {
    turns.forEach((turn, index) => {
      processTurn(turn, index === turns.length - 1);
    });
  } catch (error) {
    setDefaultArrangement();
    renderAllCheckers();
    turnsErrorTextEl.innerHTML = error.message;
  }
};

init();
