const BOARD_SIZE = 8;
const CHECKERS_AMOUNT = 12;
const IMG_SIZE = 40;

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

const boardModel = Array.from(Array(BOARD_SIZE),
  () => Array(BOARD_SIZE),
);
let checkers = [];
let isPromptModeEnabled = false;

const onCellClick = (rowIndex, colIndex) => {
  const cellModel = boardModel[rowIndex][colIndex];

  if (!isWhite(cellModel) && !isBlack(cellModel)) {
    return;
  }

  if (isPromptModeEnabled && cellModel.state === CELL_STATE.PROMPT) {
    disablePromptMode();
  } else if (!isPromptModeEnabled && cellModel.state !== CELL_STATE.PROMPT) {
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
      };
    }
  }
};

const renderChecker = (row, col) => {
  const checker = checkers[row][col];
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
      break;
    }
    case CELL_STATE.PROMPT: {
      checker.style.backgroundColor = COLORS.ACTIVE_CHECKER;
      break;
    }
    case CELL_STATE.AVAILABLE: {
      checker.style.backgroundColor = COLORS.AVAILABLE_FIELD;
      break;
    }
    case CELL_STATE.REQUIRED: {
      checker.style.backgroundColor = COLORS.REQUIRED_FIELD;
      break;
    }
  }
};

const renderAllCheckers = () => {
  if (!checkers.length) {
    return;
  }

  checkers.forEach((row, rowIndex) => {
    row.forEach((checker, colIndex) => {
      renderChecker(rowIndex, colIndex);
    });
  });
};

const init = () => {
  const CELLS_SELECTOR = '.game tr:not(:first-child):not(:last-child) td:not(:first-child):not(:last-child)';
  checkers = Array.from(document.querySelectorAll(CELLS_SELECTOR))
    .reduce((acc, cell, index) => {
      const row = Math.floor(index / BOARD_SIZE);
      acc[row] = acc[row] || [];
      acc[row].push(cell);
      return acc;
    }, Array(BOARD_SIZE));

  setDefaultArrangement();

  checkers.forEach((row, rowIndex) => {
    row.forEach((checker, colIndex) => {
      checker.addEventListener('click', () => onCellClick(rowIndex, colIndex));

      renderChecker(rowIndex, colIndex);
    });
  });
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

const calculateTurnsForKing = (row, col, checkOrder) => {
  const directions = {
    topLeft: {
      isMet: false,
      available: true,
    },
    topRight: {
      isMet: false,
      available: true,
    },
    bottomLeft: {
      isMet: false,
      available: true,
    },
    bottomRight: {
      isMet: false,
      available: true,
    },
  };

  const calcDirection = (model, direction) => {
    if (checkOrder(model)) {
      direction.isMet = true;
    } else if (isEmpty(model)) {
      model.state = direction.isMet
        ? CELL_STATE.REQUIRED
        : CELL_STATE.AVAILABLE;
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

const enablePromptMode = (row, col) => {
  const checkerModel = boardModel[row][col];
  checkerModel.state = CELL_STATE.PROMPT;

  isPromptModeEnabled = true;

  if (isWhite(checkerModel)) {
    if (row - 1 >= 0 && col - 1 >= 0) {
      const avModel = boardModel[row - 1][col - 1];

      if (isBlack(avModel) && (row - 2 >= 0 && col - 2 >= 0)) {
        boardModel[row - 2][col - 2].state = CELL_STATE.REQUIRED;
      } else if (isEmpty(avModel)) {
        avModel.state = CELL_STATE.AVAILABLE;
      }
    }
    if (row - 1 >= 0 && col + 1 < BOARD_SIZE) {
      const avModel = boardModel[row - 1][col + 1];

      if (isBlack(avModel) && (row - 2 >= 0 && col + 2 < BOARD_SIZE)) {
        boardModel[row - 2][col + 2].state = CELL_STATE.REQUIRED;
      } else if (isEmpty(avModel)) {
        avModel.state = CELL_STATE.AVAILABLE;
      }
    }

    // check for the king
    if (checkerModel.type === CELL_TYPES.WHITE_KING) {
      calculateTurnsForKing(row, col, isBlack);
    }
  } else if (isBlack(checkerModel)) {
    if (row + 1 < BOARD_SIZE && col - 1 >= 0) {
      const avModel = boardModel[row + 1][col - 1];

      if (isWhite(avModel) && (row + 2 < BOARD_SIZE && col - 2 >= 0)) {
        boardModel[row + 2][col - 2].state = CELL_STATE.REQUIRED;
      } else if (isEmpty(avModel)) {
        avModel.state = CELL_STATE.AVAILABLE;
      }
    }

    if (row + 1 < BOARD_SIZE && col + 1 < BOARD_SIZE) {
      const avModel = boardModel[row + 1][col + 1];

      if (isWhite(avModel) && (row + 2 < BOARD_SIZE && col + 2 < BOARD_SIZE)) {
        boardModel[row + 2][col + 2].state = CELL_STATE.REQUIRED;
      } else if (isEmpty(avModel)) {
        avModel.state = CELL_STATE.AVAILABLE;
      }
    }

    // check for the king
    if (checkerModel.type === CELL_TYPES.BLACK_KING) {
      calculateTurnsForKing(row, col, isWhite);
    }
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


// actions

const onStartClick = () => {
  isPromptModeEnabled = false;

  setDefaultArrangement();
  renderAllCheckers();
};

const onExampleClick = () => {
  isPromptModeEnabled = false;

  initBoard();

  boardModel[4][5].type = CELL_TYPES.WHITE_DEFAULT;
  boardModel[4][7].type = CELL_TYPES.WHITE_DEFAULT;

  boardModel[0][1].type = CELL_TYPES.BLACK_DEFAULT;
  boardModel[7][2].type = CELL_TYPES.BLACK_KING;
  boardModel[3][2].type = CELL_TYPES.BLACK_DEFAULT;
  boardModel[1][2].type = CELL_TYPES.BLACK_DEFAULT;
  boardModel[1][4].type = CELL_TYPES.BLACK_DEFAULT;
  boardModel[2][7].type = CELL_TYPES.BLACK_DEFAULT;

  renderAllCheckers();
};

init();
