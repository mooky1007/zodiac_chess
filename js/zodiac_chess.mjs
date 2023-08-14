import { get, ref, child, set, onValue, push } from 'https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js';

const removeTagForString = (str) => {
    return str.replace(/(<([^>]+)>)/gi, '');
};

export class ZodiacChess {
    constructor(data, db) {
        this.db = db;
        this.user = new Date().getTime().toString();
        this.userColor = '';

        this.gameStatus = true;
        this.gameId = data?.gameId || '0001';
        this.createMsgBox();
        this.board = new Board(this);
        this.redBoard = new OtherBoard(this, 'red');
        this.blueBoard = new OtherBoard(this, 'blue');
        this.turn = 'red';
        this.setGame = false;
        this.turnTimer = null;
        this.time = data?.time || 30000;
        this.gameTime = data?.time || 30000;
        this.createTimer();
        this.setUnits();

        get(child(ref(this.db), `game/${this.gameId}/users`))
            .then((snapshot) => {
                const data = snapshot.val();
                console.log(data);
                if (!data?.blue) {
                    set(ref(this.db, `game/${this.gameId}/users/blue`), this.user);
                    this.userColor = 'blue';
                    console.log(this.user);
                    console.log(this.userColor);
                    return;
                }

                if (!data?.red) {
                    set(ref(this.db, `game/${this.gameId}/users/red`), this.user);
                    this.userColor = 'red';
                    console.log(this.user);
                    console.log(this.userColor);
                    return;
                }

                alert('Game is full');
            })
            .catch((error) => {
                console.error(error);
            });

        onValue(ref(db, `/game/${this.gameId}/users`), (snapshot) => {
            const data = snapshot.val();
            if(data?.blue && data?.red) {
                this.turnChange();
            }
        });

        onValue(ref(db, `/game/${this.gameId}/time`), (snapshot) => {
            const data = snapshot.val();
            if (this.userColor !== 'blue') {
                this.time = data;
                this.timer.innerHTML = `${Math.floor(this.time / 1000)}s`;
                if (this.time <= 0) {
                    this.checkWin(this.turn === 'blue' ? 'red' : 'blue');
                }
            }
        });

        onValue(ref(db, `/game/${this.gameId}/turn`), (snapshot) => {
            const data = snapshot.val();
            this.turn = data;
            this.renderMsgBox(`<span style="color: ${this.turn}">${this.turn.charAt(0).toLocaleUpperCase()}${this.turn.slice(1)}</span> turn`);
        });

        onValue(ref(db, `/game/${this.gameId}/winner`), (snapshot) => {
            const data = snapshot.val();
            if(data) {
                this.timer.innerHTML = `0s`;
                this.checkWin(data);
            }else {
                this.restart();
            }
        });

        //브라우저 창을 닫았을 때
        window.addEventListener('beforeunload', (e) => {
            if (this.userColor) {
                set(ref(this.db, `game/${this.gameId}/users/${this.userColor}`), null);
            }
        });
    }

    restart() {
        set(ref(this.db, `game/${this.gameId}/log`), []);
        set(ref(this.db, `game/${this.gameId}/winner`), null);
        this.board.board.forEach((row) => {
            row.forEach((cell) => {
                cell.unit = null;
                cell.team = null;
            });
        });
        this.setUnits();
        this.setGame = false;
        this.turn = 'blue';
        set(ref(this.db, `game/${this.gameId}/turn`), 'blue');
        this.turnChange();
        this.deleteRestartBtn();
        this.blueBoard.board = [];
        this.redBoard.board = [];
        this.blueBoard.render();
        this.redBoard.render();
    }

    createMsgBox() {
        let msgBox = document.createElement('div');
        msgBox.classList.add('msg-box');
        document.body.prepend(msgBox);
    }

    createTimer() {
        let timer = document.createElement('div');
        timer.classList.add('timer');
        document.body.prepend(timer);

        this.timer = timer;
    }

    renderMsgBox(msg) {
        let msgBox = document.querySelector('.msg-box');
        msgBox.innerHTML = msg;
    }

    createRestartBtn() {
        this.deleteRestartBtn();
        let restartBtn = document.createElement('button');
        restartBtn.classList.add('restart-btn');
        restartBtn.innerText = 'Restart';
        restartBtn.addEventListener('click', (e) => {
            this.restart();
        });
        document.body.append(restartBtn);
    }

    deleteRestartBtn() {
        document.body.querySelectorAll('.restart-btn').forEach((btn) => {
            btn.remove();
        });
    }

    setUnits() {
        const redTeam = [
            [0, 0, new Minister()],
            [0, 1, new King()],
            [0, 2, new General()],
            [1, 1, new Pawn()],
        ];

        redTeam.forEach((unit, index) => {
            this.board.board[unit[0]][unit[1]].unit = unit[2] || new Pawn();
            this.board.board[unit[0]][unit[1]].team = 'red';
        });

        const blueTeam = [
            [3, 0, new General()],
            [3, 1, new King()],
            [3, 2, new Minister()],
            [2, 1, new Pawn()],
        ];

        blueTeam.forEach((unit, index) => {
            this.board.board[unit[0]][unit[1]].unit = unit[2] || new Pawn();
            this.board.board[unit[0]][unit[1]].team = 'blue';
        });
        this.board.render();
    }

    turnChange() {
        if (!this.setGame) {
            this.turn = this.turn === 'blue' ? 'red' : 'blue';
            this.renderMsgBox(`<span style="color: ${this.turn}">${this.turn.charAt(0).toLocaleUpperCase()}${this.turn.slice(1)}</span> turn`);

            set(ref(this.db, `game/${this.gameId}/turn`), this.turn);

            if (this.userColor === 'blue') {
                clearInterval(this.turnTimer);
                this.time = this.gameTime;
                set(ref(this.db, `game/${this.gameId}/time`), this.time);
                this.timer.innerHTML = `${Math.floor(this.time / 1000)}s`;
                this.turnTimer = setInterval(() => {
                    set(ref(this.db, `game/${this.gameId}/time`), this.time);
                    this.time -= 1000;
                    this.timer.innerHTML = `${Math.floor(this.time / 1000)}s`;
                    if (this.time <= 0) {
                        this.checkWin(this.turn === 'blue' ? 'red' : 'blue');
                    }
                }, 1000);
            }
        }
    }

    checkWin(winner) {
        this.addLog(`<span style="font-weight: 700; color: ${winner}">${winner.charAt(0).toLocaleUpperCase()}${winner.slice(1)}</span> Win`);
        this.setGame = true;
        clearTimeout(this.turnTimer);
        set(ref(this.db, `game/${this.gameId}/time`), this.gameTime);
        set(ref(this.db, `game/${this.gameId}/winner`), winner);
        this.gameStatus = false;
        this.renderMsgBox(`<span style="color: ${winner}">${winner.charAt(0).toLocaleUpperCase()}${winner.slice(1)}</span> win`);
        this.createRestartBtn();
    }

    addLog(logText) {
        const log = document.createElement('li');
        log.innerHTML = logText;
        log_container.appendChild(log);

        const newLog = push(ref(this.db, `game/${this.gameId}/log`));
        set(newLog, removeTagForString(logText));
    }
}

class OtherBoard {
    constructor(zodiacChess, team) {
        this.db = zodiacChess.db;
        this.game = zodiacChess;
        this.team = team;
        this.el = null;
        this.board = [];
        this.move = false;
        this.board.selectedCell = null;
        this.createBoard();
        
        set(ref(this.db, `game/${this.game.gameId}/${this.game.userColor}Board`), this.board);
    }

    createBoard() {
        let board = document.createElement('div');
        board.classList.add('other-board');
        board.classList.add(this.team);
        for (let i = 0; i < 6; i++) {
            let cell = document.createElement('div');
            cell.classList.add('cell');
            board.appendChild(cell);
            container.appendChild(board);
        }

        this.el = board;
    }

    render() {
        this.el.remove();
        this.createBoard();

        this.board = this.board.map((cell, index) => {
            return new OtherCell(this, cell, index);
        });
        this.board.forEach((cell) => {
            cell.render();
        });
        
        console.log(this.board.map(el => {
            return el.unit.char;
        }))
        // set(ref(this.db, `game/${this.game.gameId}/${this.game.userColor}Board`), this.board);
    }
}

class OtherCell {
    constructor(board, cell, index) {
        this.board = board;
        if (cell.unit.char === '侯') {
            cell.unit = new Pawn();
        }
        this.unit = cell.unit;
        this.team = this.board.team;
        this.el = board.el.children[index];
        this.init();
    }

    init() {
        this.el.addEventListener('click', (e) => {
            if (this.board.game.setGame) return;
            if (this.team !== this.board.game.turn) return;
            this.board.game.board.reviveMode = true;
            this.board.board.forEach((cell) => {
                cell.el.classList.remove('selected');
            });
            this.el.classList.add('selected');
            this.board.selectedCell = this;
            this.board.game.board.selectedCell = this;
            this.board.game.board.move = true;
            this.board.game.board.board.forEach((row) => {
                row.forEach((cell) => {
                    if (!cell.unit) {
                        if (this.team === 'blue') {
                            if (cell.position.y !== 0) {
                                cell.el.classList.add('can-move');
                            }
                        }
                        if (this.team === 'red') {
                            if (cell.position.y !== 3) {
                                cell.el.classList.add('can-move');
                            }
                        }
                    } else {
                        cell.el.classList.remove('selected');
                        cell.el.classList.remove('can-move');
                        cell.el.classList.remove('can-kill');
                    }
                });
            });
        });
    }

    render(cell, index) {
        if (this.unit?.char) {
            this.el.classList.remove('pawn');
            this.el.classList.remove('general');
            this.el.classList.remove('king');
            this.el.classList.remove('minister');
            this.el.classList.remove('marquis');

            this.el.classList.add(this.unit.enName)
            this.el.innerHTML = `<span class="unit">${this.unit.char}</span>`;
            this.el.classList.add(this.board.team);
        } else {
            this.el.classList.remove('red');
            this.el.classList.remove('blue');
            this.el.innerHTML = '';
        }
    }
}

class Board {
    constructor(zodiacChess) {
        this.game = zodiacChess;
        this.el = null;
        this.board = [];
        this.move = false;
        this.selectedCell = null;
        this.reviveMode = false;
        this.initBoard();
        this.createBoard();
    }
    initBoard() {
        for (let i = 0; i < 4; i++) {
            this.board[i] = [];
            for (let j = 0; j < 3; j++) {
                this.board[i][j] = new Cell(this);
                this.board[i][j].position.x = j;
                this.board[i][j].position.y = i;
            }
        }
    }

    createBoard() {
        let board = document.createElement('div');
        board.classList.add('board');
        for (let i = 0; i < 4; i++) {
            let areaName = String.fromCharCode(65 + i);
            let row = document.createElement('div');
            row.classList.add('row');
            for (let j = 0; j < 3; j++) {
                let cell = document.createElement('div');
                cell.classList.add('cell');
                cell.setAttribute('data-area-name', `${areaName}${j + 1}`);
                this.board[i][j].el = cell;
                row.appendChild(cell);
            }
            board.appendChild(row);
        }
        container.appendChild(board);

        this.el = board;
        this.update();
    }

    update() {
        this.board.forEach((row) => {
            row.forEach((cell) => {
                cell.init();
            });
        });
    }

    render() {
        this.board.forEach((row) => {
            row.forEach((cell) => {
                if (cell.unit) {
                    cell.unit.cell = cell;
                }
                cell.render();
            });
        });
    }
}

class Cell {
    constructor(board) {
        this.board = board;
        this.position = {
            x: null,
            y: null,
        };
        this.unit = null;
        this.team = null;
        this.el = null;
    }

    init() {
        this.areaName = this.el.dataset.areaName;
        this.el.addEventListener('click', (e) => {
            if (this.board.game.setGame) return; // 게임이 끝나 있는 경우 클릭 무시
            if (this.board.game.userColor !== this.board.game.turn) return; // 턴이 아닌 팀의 셀을 클릭한 경우 무시

            if (this.board.move) {
                if (this.unit === this.board.selectedCell.unit) return; // 같은 유닛을 선택한 경우 무시

                if (this.el.classList.contains('can-move') && this.board.reviveMode) {
                    this.revive();
                    return;
                }

                if (this.el.classList.contains('can-move')) {
                    this.move();
                    return;
                }

                if (this.el.classList.contains('can-kill')) {
                    this.kill();
                    return;
                }

                if (this.board.game.turn !== this.team) return; // 턴이 아닌 팀의 셀을 클릭한 경우
                this.removeAllSelected();
                this.selected();
                return;
            }

            if (this.board.game.turn !== this.team) return; // 턴이 아닌 팀의 셀을 클릭한 경우

            this.removeAllSelected(); // 선택된 셀들 모두 선택 해제
            if (this.unit) this.selected(); // 유닛이 있는 경우
        });
    }

    removeAllSelected() {
        this.board.move = false;
        this.board.selectedCell = null;
        this.board.game.blueBoard.selectedCell = null;
        this.board.game.redBoard.selectedCell = null;

        this.board.board.forEach((row) => {
            row.forEach((cell) => {
                cell.el.classList.remove('selected');
                cell.el.classList.remove('can-move');
                cell.el.classList.remove('can-kill');
            });
        });

        this.board.game.redBoard.el.querySelectorAll('.cell').forEach((cell) => {
            cell.classList.remove('selected');
            cell.classList.remove('can-move');
            cell.classList.remove('can-kill');
        });

        this.board.game.blueBoard.el.querySelectorAll('.cell').forEach((cell) => {
            cell.classList.remove('selected');
            cell.classList.remove('can-move');
            cell.classList.remove('can-kill');
        });
    }

    selected() {
        this.board.move = true;
        this.unit.movePosition.forEach((movePosition) => {
            // 이동 가능한 셀들 표시
            let x = this.position.x + movePosition.x;
            let y = this.position.y + movePosition.y * (this.board.game.turn === 'red' ? -1 : 1); // 턴이 레드인 경우 y값을 반대로
            if (this.board.board[y] && this.board.board[y][x]) {
                if (!this.board.board[y][x].unit) {
                    this.board.board[y][x].el.classList.add('can-move'); // 내유닛 / 상대방 유닛이 없는 경우
                } else {
                    this.board.board[y][x].team !== this.team && this.board.board[y][x].el.classList.add('can-kill'); // 상대방 유닛이 있는 경우
                }
            }
        });

        this.el.classList.add('selected');
        this.unit.selected = true;
        this.board.selectedCell = this;
        this.board.render();
    }

    move() {
        let change = false;
        if (this.board.selectedCell.team === 'red' && this.board.selectedCell.unit.char === '子' && this.position.y === 3) {
            change = true;
        }

        if (this.board.selectedCell.team === 'blue' && this.board.selectedCell.unit.char === '子' && this.position.y === 0) {
            change = true;
        }

        this.board.game.addLog(
            `<span style=color:${this.board.selectedCell.team};>${this.board.selectedCell.unit.char}</span> ${this.board.selectedCell.areaName}→${
                this.areaName
            }${change ? ` <span style=color:${this.board.selectedCell.team};>侯</span> 전환` : ''}`
        );

        this.unit = this.board.selectedCell.unit;
        this.team = this.board.selectedCell.team;
        this.unit.position.x = this.position.x;
        this.unit.position.y = this.position.y;

        this.board.selectedCell.unit = null;
        this.board.selectedCell.team = null;

        this.board.render();

        this.board.game.turnChange();
        this.removeAllSelected();
    }

    kill() {
        if (this.team !== this.board.selectedCell.team && this.unit) {
            // 상대방 유닛을 죽인 경우

            this.board.game.addLog(
                `<span style=color:${this.board.selectedCell.team};>${this.board.selectedCell.unit.char}</span> ${this.board.selectedCell.areaName}→${this.areaName} (<span style=color:${this.team};>${this.unit.char}</span>x)`
            );

            if (this.unit.char === '王') {
                this.board.game.checkWin(this.board.selectedCell.team);
            }

            this.board.game.turnChange();

            if (this.team === 'blue') {
                this.board.game.redBoard.board.push(this);
                this.board.game.redBoard.render();
            }
            if (this.team === 'red') {
                this.board.game.blueBoard.board.push(this);
                this.board.game.blueBoard.render();
            }

            this.unit = this.board.selectedCell.unit;
            this.team = this.board.selectedCell.team;
            this.unit.position.x = this.position.x;
            this.unit.position.y = this.position.y;

            this.board.selectedCell.unit = null;
            this.board.selectedCell.team = null;

            this.board.render();

            this.removeAllSelected();
        }
    }

    revive() {
        this.board.game.addLog(`${this.areaName}<span style=color:${this.board.selectedCell.team};>${this.board.selectedCell.unit.char}</span>打`);

        this.board.reviveMode = false;
        this.board.game.blueBoard.board = this.board.game.blueBoard.board.filter((cell) => {
            return cell !== this.board.game.blueBoard.selectedCell;
        });

        this.board.game.redBoard.board = this.board.game.redBoard.board.filter((cell) => {
            return cell !== this.board.game.redBoard.selectedCell;
        });

        this.board.game.blueBoard.render();
        this.board.game.redBoard.render();

        this.unit = this.board.selectedCell.unit;
        this.team = this.board.selectedCell.team;
        this.unit.position.x = this.position.x;
        this.unit.position.y = this.position.y;

        this.board.selectedCell.unit = null;
        this.board.selectedCell.team = null;

        this.board.render();

        this.board.game.turnChange();
        this.removeAllSelected();
    }

    render() {
        if (this.unit?.char) {
            this.el.classList.remove('pawn');
            this.el.classList.remove('general');
            this.el.classList.remove('king');
            this.el.classList.remove('minister');
            this.el.classList.remove('marquis');

            this.el.classList.add(this.unit.enName)
            this.el.innerHTML = `<span class="unit">${this.unit.char}</span>`;
            this.el.classList.remove('red');
            this.el.classList.remove('blue');
            this.el.classList.add(this.team);
        } else {
            this.el.innerHTML = '';
            this.el.classList.remove('red');
            this.el.classList.remove('blue');
        }

        this.unit?.update(this.position);
    }
}

class Unit {
    constructor(cell) {
        this.cell = cell;
        this.char = null;
        this.selected = false;
        this.position = {
            x: null,
            y: null,
        };
    }

    update() {}
}

class General extends Unit {
    constructor() {
        super();
        this.char = '將';
        this.enName = 'general';
        this.movePosition = [
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
        ];
    }
}

class Minister extends Unit {
    constructor() {
        super();
        this.char = '相';
        this.enName = 'minister';
        this.movePosition = [
            { x: -1, y: -1 },
            { x: 1, y: -1 },
            { x: -1, y: 1 },
            { x: 1, y: 1 },
        ];
    }
}

class King extends Unit {
    constructor() {
        super();
        this.lastCounter = 0;
        this.char = '王';
        this.enName = 'king';
        this.movePosition = [
            { x: -1, y: -1 },
            { x: 0, y: -1 },
            { x: -1, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: -1 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
        ];
    }

    update(position) {
        if (this.cell.team === 'blue') {
            if (position.y === 0) {
                if (this.lastCounter === 2) {
                    this.cell.board.game.checkWin(this.cell.team);
                }
                this.lastCounter++;
            } else {
                this.lastCounter = 0;
            }
        }
        if (this.cell.team === 'red') {
            if (position.y === 3) {
                if (this.lastCounter === 2) {
                    this.cell.board.game.checkWin(this.cell.team);
                }
                this.lastCounter++;
            }
        }
    }
}

class Pawn extends Unit {
    constructor() {
        super();
        this.char = '子';
        this.enName = 'pawn';
        this.movePosition = [{ x: 0, y: -1 }];
    }

    update(position) {
        if (this?.cell?.team === 'blue') {
            if (position.y === 0) {
                this.cell.unit = new Marquis();
                this.cell.board.render();
            }
        }
        if (this?.cell?.team === 'red') {
            if (position.y === 3) {
                this.cell.unit = new Marquis();
                this.cell.board.render();
            }
        }
    }
}

class Marquis extends Unit {
    constructor() {
        super();
        this.char = '侯';
        this.enName = 'marquis';
        this.movePosition = [
            { x: -1, y: -1 },
            { x: 0, y: -1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: -1 },
            { x: 0, y: 1 },
        ];
    }
}
