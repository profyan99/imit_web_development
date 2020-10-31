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

let boardModel = Array.from(Array(BOARD_SIZE),
  () => Array(BOARD_SIZE),
);
let savedBoardModel = null;
let isPromptModeEnabled = false;
let isTurnOver = false;
let turnsTable = [];
let availableTurnModels = [];
let turnModel = null;
let sourceModel = null;
let currentTeam = null;
let turnCount = 0;

let checkerEls = [];
let currentTurnEl = null;
let turnsTableEl = null;
let endTurnButton = null;
let cancelTurnButton = null;

const onCellClick = (rowIndex, colIndex) => {
  const cellModel = boardModel[rowIndex][colIndex];

  if (isPromptModeEnabled) {
    if (cellModel.state === CELL_STATE.PROMPT) {
      disablePromptMode();
      return;
    }

    if (isWhite(cellModel) || isBlack(cellModel)) {
      return;
    }

    handleTurn(cellModel);
  } else if (!isPromptModeEnabled && !isTurnOver
    && (isWhite(cellModel) && currentTeam === TEAM_TYPES.WHITE
      || isBlack(cellModel) && currentTeam === TEAM_TYPES.BLACK)) {
    enablePromptMode(rowIndex, colIndex);
  }
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
      boardModel[row][col].type =
        isNeedToFillCell(row, col) && CELL_TYPES.BLACK_DEFAULT || CELL_TYPES.EMPTY;
    }
  }

  // fill the whites
  for (let row = boardModel.length - rowsAmount; row < boardModel.length; row++) {
    for (let col = 0; col < boardModel[row].length; col++) {
      boardModel[row][col].type =
        isNeedToFillCell(row, col) && CELL_TYPES.WHITE_DEFAULT || CELL_TYPES.EMPTY;
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
  const teamName = currentTeam === TEAM_TYPES.BLACK
    ? 'черные'
    : 'белые';
  currentTurnEl.textContent = `Ходят ${teamName}`;
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
      checker.addEventListener('click', () => onCellClick(rowIndex, colIndex));
    });
  });

  currentTurnEl = document.getElementById('current-turn');
  turnsTableEl = document.getElementById('turns-table');
  endTurnButton = document.getElementById('button__end_turn');
  cancelTurnButton = document.getElementById('button__cancel_turn');

  renderAllCheckers();
};

const isWhite = (checker) => {
  return checker.type === CELL_TYPES.WHITE_DEFAULT ||
    checker.type === CELL_TYPES.WHITE_KING;
};

const isBlack = (checker) => {
  return checker.type === CELL_TYPES.BLACK_DEFAULT ||
    checker.type === CELL_TYPES.BLACK_KING;
};

const isEmpty = (checker) => {
  return checker.type === CELL_TYPES.EMPTY;
};

const calculateTurnsForKing = (row, col, checkOrder, availableTurnModels) => {
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
    if (checkOrder(model) && !direction.target) {
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

  if (isWhite(sourceModel)) {
    if (sourceModel.type === CELL_TYPES.WHITE_KING) {
      calculateTurnsForKing(row, col, isBlack, availableTurnModels);
    } else {
      if (row - 1 >= 0 && col - 1 >= 0) {
        const avModel = boardModel[row - 1][col - 1];

        if (isBlack(avModel) && (row - 2 >= 0 && col - 2 >= 0) && isEmpty(boardModel[row - 2][col - 2])) {
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

        if (isBlack(avModel) && (row - 2 >= 0 && col + 2 < BOARD_SIZE) && isEmpty(boardModel[row - 2][col + 2])) {
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

        if (isBlack(avModel) && (row + 2 < BOARD_SIZE && col - 2 >= 0) && isEmpty(boardModel[row + 2][col - 2])) {
          const trModel = boardModel[row + 2][col - 2];
          trModel.state = CELL_STATE.REQUIRED;
          trModel.target = avModel;
          availableTurnModels.push(trModel);
        }
      }

      if (row + 1 < BOARD_SIZE && col + 1 < BOARD_SIZE) {
        const avModel = boardModel[row + 1][col + 1];

        if (isBlack(avModel) && (row + 2 < BOARD_SIZE && col + 2 < BOARD_SIZE) && isEmpty(boardModel[row + 2][col + 2])) {
          const trModel = boardModel[row + 2][col + 2];
          trModel.state = CELL_STATE.REQUIRED;
          trModel.target = avModel;
          availableTurnModels.push(trModel);
        }
      }
    }
  } else if (isBlack(sourceModel)) {
    if (sourceModel.type === CELL_TYPES.BLACK_KING) {
      calculateTurnsForKing(row, col, isWhite, availableTurnModels);
    } else {
      if (row + 1 < BOARD_SIZE && col - 1 >= 0) {
        const avModel = boardModel[row + 1][col - 1];

        if (isWhite(avModel) && (row + 2 < BOARD_SIZE && col - 2 >= 0) && isEmpty(boardModel[row + 2][col - 2])) {
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

        if (isWhite(avModel) && (row + 2 < BOARD_SIZE && col + 2 < BOARD_SIZE) && isEmpty(boardModel[row + 2][col + 2])) {
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

        if (isWhite(avModel) && (row - 2 >= 0 && col - 2 >= 0) && isEmpty(boardModel[row - 2][col - 2])) {
          const trModel = boardModel[row - 2][col - 2];

          trModel.state = CELL_STATE.REQUIRED;
          trModel.target = avModel;
          availableTurnModels.push(trModel);
        }
      }

      if (row - 1 >= 0 && col + 1 < BOARD_SIZE) {
        const avModel = boardModel[row - 1][col + 1];

        if (isWhite(avModel) && (row - 2 >= 0 && col + 2 < BOARD_SIZE) && isEmpty(boardModel[row - 2][col + 2])) {
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

  renderAllCheckers();
};

const disablePromptMode = () => {
  for (let row = 0; row < boardModel.length; row++) {
    for (let col = 0; col < boardModel[row].length; col++) {
      boardModel[row][col].state = CELL_STATE.DEFAULT;
    }
  }
  isPromptModeEnabled = false;

  renderAllCheckers();
};

const changeTurn = () => {
  currentTeam = currentTeam === TEAM_TYPES.WHITE
    ? TEAM_TYPES.BLACK
    : TEAM_TYPES.WHITE;

  savedBoardModel = JSON.parse(JSON.stringify(boardModel));
};

const checkForTheKing = (model) => {
  if (isBlack(model) && model.row === BOARD_SIZE - 1) {
    model.type = CELL_TYPES.BLACK_KING;
  } else if (isWhite(model) && model.row === 0) {
    model.type = CELL_TYPES.WHITE_KING;
  }
};

const transformRowColToReadableForm = ({ row, col }) => {
  const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  return `${letters[col]}${BOARD_SIZE - row}`;
};

const handleTurn = (targetModel) => {
  if (isTurnOver) {
    return;
  }

  const availableTurn = availableTurnModels
    .find((model) => model.row === targetModel.row && model.col === targetModel.col);

  if (!availableTurn) {
    return;
  }

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

  if (availableTurn.target) {
    availableTurn.target.type = CELL_TYPES.EMPTY;
    availableTurn.target.state = CELL_STATE.DEFAULT;

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
};


// actions
const onStartClick = () => {
  setDefaultArrangement();
  renderAllCheckers();
};

const onExampleClick = () => {
  initBoard();

  boardModel[4][5].type = CELL_TYPES.WHITE_DEFAULT;
  boardModel[4][7].type = CELL_TYPES.WHITE_DEFAULT;

  boardModel[0][1].type = CELL_TYPES.BLACK_DEFAULT;
  boardModel[7][2].type = CELL_TYPES.BLACK_KING;
  boardModel[3][2].type = CELL_TYPES.BLACK_DEFAULT;
  boardModel[1][2].type = CELL_TYPES.BLACK_DEFAULT;
  boardModel[1][4].type = CELL_TYPES.BLACK_DEFAULT;
  boardModel[2][7].type = CELL_TYPES.BLACK_DEFAULT;

  changeTurn();
  renderAllCheckers();
};

const onEndTurnClick = () => {
  if (!isTurnOver) {
    return;
  }

  turnsTable[turnCount] = turnsTable[turnCount] || {};
  turnsTable[turnCount][currentTeam] = turnModel;

  if (turnsTable[turnCount][TEAM_TYPES.WHITE]
    && turnsTable[turnCount][TEAM_TYPES.BLACK]) {
    turnCount++;
  }

  turnModel = null;
  isTurnOver = false;

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

  renderAllCheckers();
};

init();
