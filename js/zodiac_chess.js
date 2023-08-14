class ZodiacChess {
    constructor() {
        this.createMsgBox();
        this.board = new Board(this);
        this.redBoard = new OtherBoard(this, 'red');
        this.blueBoard = new OtherBoard(this, 'blue');
        this.turn = 'blue';
        this.setGame = false;
        this.setUnits();
        this.renderMsgBox(`<span style="color: ${this.turn}">${this.turn}</span> turn`);
    }

    restart() {
        this.board.board.forEach(row => {
            row.forEach(cell => {
                cell.unit = null;
                cell.team = null;
            })
        })
        this.setUnits();
        this.setGame = false;
        this.turn = 'blue';
        this.renderMsgBox(`<span style="color: ${this.turn}">${this.turn}</span> turn`);
        this.deleteRestartBtn();
    }

    createMsgBox() {
        let msgBox = document.createElement('div');
        msgBox.classList.add('msg-box');
        document.body.prepend(msgBox);
    }

    renderMsgBox(msg) {
        let msgBox = document.querySelector('.msg-box');
        msgBox.innerHTML = msg;
    }

    createRestartBtn() {
        let restartBtn = document.createElement('button');
        restartBtn.classList.add('restart-btn');
        restartBtn.innerText = 'Restart';
        restartBtn.addEventListener('click', e => {
            this.restart();
        });
        document.body.append(restartBtn);
    }
    
    deleteRestartBtn() {
        let restartBtn = document.querySelector('.restart-btn');
        restartBtn.remove();
    }

    setUnits() {
        const redTeam = [
            [0,0, new Minister()],
            [0,1, new King()],
            [0,2, new General()],
            [1,1, new Pawn()]
        ];
        redTeam.forEach((unit, index) => {
            this.board.board[unit[0]][unit[1]].unit = unit[2] || new Pawn();
            this.board.board[unit[0]][unit[1]].team = 'red';
        });

        const blueTeam = [
            [3,0, new General()],
            [3,1, new King()],
            [3,2, new Minister()],
            [2,1, new Pawn()]
        ];
        blueTeam.forEach((unit, index) => {
            this.board.board[unit[0]][unit[1]].unit = unit[2] || new Pawn();
            this.board.board[unit[0]][unit[1]].team = 'blue';
        });
        this.board.render();
    }
}

class OtherBoard {
    constructor(zodiacChess, team) {
        this.game = zodiacChess;
        this.team = team;
        this.el = null;
        this.board = [];
        this.move = false;
        this.board.selectedCell = null;
        this.createBoard();
    }

    createBoard() {
        let board = document.createElement('div');
        board.classList.add('other-board');
        board.classList.add(this.team);
        for(let i = 0; i < 4; i++){
            let cell = document.createElement('div');
            cell.classList.add('cell');
            board.appendChild(cell);
            container.appendChild(board);
        }

        this.el = board;
    }

    render() {
        this.board = this.board.map((cell, index) => {
            return new OtherCell(this, cell, index);
        });
        this.board.forEach(cell => {
            cell.render();
        });
    }
}

class OtherCell {
    constructor(board, cell, index) {
        this.board = board;
        if(cell.unit.char === '侯'){
            cell.unit = new Pawn();
        }
        this.unit = cell.unit;
        this.team = this.board.team;
        this.el = board.el.children[index];
        this.init();
    }

    init() {
        this.el.addEventListener('click', e => {
            if(this.board.game.setGame) return;
            if(this.team !== this.board.game.turn) return;
            this.board.game.board.revibeMode = true;
            this.board.board.forEach(cell => {
                cell.el.classList.remove('selected');
            })
            this.el.classList.add('selected');
            this.board.selectedCell = this;
            this.board.game.board.selectedCell = this;
            this.board.game.board.move = true;
            this.board.game.board.board.forEach(row => {
                row.forEach(cell => {
                    if(!cell.unit){
                        if(this.team === 'blue'){
                            if(cell.position.y !== 0){
                                cell.el.classList.add('can-move');
                            }
                        }
                        if(this.team === 'red'){
                            if(cell.position.y !== 3){
                                cell.el.classList.add('can-move');
                            }
                        }
                    }else{
                        cell.el.classList.remove('selected');
                        cell.el.classList.remove('can-move');
                        cell.el.classList.remove('can-kill');
                    }
                })
            })
        });
    }

    render(cell, index) {
        if(this.unit?.char){
            this.el.innerHTML = `<span class="unit">${this.unit.char}</span>`
            this.el.classList.add(this.board.team);
        }else{
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
        this.board.selectedCell = null;
        this.revibeMode = false;
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
            let row = document.createElement('div');
            row.classList.add('row');
            for (let j = 0; j < 3; j++) {
                let cell = document.createElement('div');
                cell.classList.add('cell');
                this.board[i][j].el = cell;
                if(i === 0){
                    cell.style.background = 'rgba(255,0,0,0.1)';
                }
                if(i === 3){
                    cell.style.background = 'rgba(0,0,255,0.1)';
                }
                row.appendChild(cell);
            }
            board.appendChild(row);
        }
        container.appendChild(board);

        this.el = board;
        this.update();
    }

    update() {
        this.board.forEach(row => {
            row.forEach(cell => {
                cell.init();
            })
        })
    }

    render() {
        this.board.forEach(row => {
            row.forEach(cell => {
                if(cell.unit){
                    cell.unit.cell = cell;
                }
                cell.render();
            })
        })
    }
}

class Cell {
    constructor(board) {
        this.board = board;
        this.position = {
            x: null,
            y: null
        }
        this.unit = null;
        this.team = null;
        this.el = null;
    }

    init() {
        this.el.addEventListener('click', e => {
            if(this.board.game.setGame) return;
            if(this.board.move && this.el.classList.contains('can-move') || this.el.classList.contains('can-kill')){
                const targetChar = this?.unit?.char;
                const curTeam = this?.board?.selectedCell?.team;
                if(this.team !== this.board.selectedCell.team && this.unit){
                    if(this.team === 'blue'){
                        this.board.game.redBoard.board.push(this);
                        this.board.game.redBoard.render();
                    }
                    if(this.team === 'red'){
                        this.board.game.blueBoard.board.push(this);
                        this.board.game.blueBoard.render();
                    }
                }
                this.unit = this.board.selectedCell.unit;
                this.team = this.board.selectedCell.team;
                this.unit.position.x = this.position.x;
                this.unit.position.y = this.position.y;
                this.unit.selected = false;
                this.el.classList.remove('selected');
                this.board.move = false;
                this.render();

                this.board.selectedCell.unit = null;
                this.board.selectedCell.team = null;
                this.board.selectedCell.render();

                this.board.board.forEach(row => {
                    row.forEach(cell => {
                        cell.el.classList.remove('selected');
                        cell.el.classList.remove('can-move');
                        cell.el.classList.remove('can-kill');
                    })
                })

                this.board.game.redBoard.el.querySelectorAll('.cell').forEach(cell => {
                    cell.classList.remove('selected');
                    cell.classList.remove('can-move');
                    cell.classList.remove('can-kill');
                })

                this.board.game.blueBoard.el.querySelectorAll('.cell').forEach(cell => {
                    cell.classList.remove('selected');
                    cell.classList.remove('can-move');
                    cell.classList.remove('can-kill');
                })

                if(this.board.revibeMode){
                    this.board.revibeMode = false;
                    this.board.game.blueBoard.board = this.board.game.blueBoard.board.filter(cell => {
                        return cell !== this.board.game.blueBoard.selectedCell;
                    });

                    this.board.game.redBoard.board = this.board.game.redBoard.board.filter(cell => {
                        return cell !== this.board.game.redBoard.selectedCell;
                    });
                }

                this.board.selectedCell = null;

                this.board.game.turn = this.team === 'blue' ? 'red' : 'blue';
                this.board.game.renderMsgBox(`<span style="color: ${this.board.game.turn}">${this.board.game.turn}</span> turn`);
                if(targetChar === '王'){
                    this.board.game.renderMsgBox(`<span style="color: ${curTeam}">${curTeam}</span> win`);
                    this.board.game.setGame = true;
                    this.board.game.createRestartBtn();
                    return;
                }

                this.board.game.board.board.forEach(row => {
                    row.forEach(cell => {
                        if(cell.unit?.char === '王'){
                            cell.unit.update(cell.position);
                        }
                    })
                })
                return;
            }

            this.board.board.forEach(row => {
                row.forEach(cell => {
                    cell.el.classList.remove('selected');
                    cell.el.classList.remove('can-move');
                    cell.el.classList.remove('can-kill');
                })
            })

            if(this.board.game.turn !== this.team){
                return;
            }

            if(this.unit){
                this.board.move = true;
                this.unit.movePosition.forEach(movePosition => {
                    let x = this.position.x + movePosition.x;
                    let y = this.position.y + (movePosition.y * (this.board.game.turn === 'red' ? -1 : 1));
                    if(this.board.board[y] && this.board.board[y][x]){
                        if(!this.board.board[y][x].unit){
                            this.board.board[y][x].el.classList.add('can-move');
                        }else{
                            this.board.board[y][x].team !== this.team && this.board.board[y][x].el.classList.add('can-kill');
                        }
                    }
                })

                this.el.classList.add('selected');
                this.unit.selected = true;
                this.board.selectedCell = this;
                this.board.render();
            }
        });
    }

    render() {
        if(this.unit?.char){
            this.el.innerHTML = `<span class="unit">${this.unit.char}</span>`;
            this.el.classList.remove('red');
            this.el.classList.remove('blue');
            this.el.classList.add(this.team);
        }else{
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
            y: null
        };
    }

    update() {

    }
}

class General extends Unit {
    constructor() {
        super();
        this.char = "將";
        this.movePosition = [
            {x: 0, y: -1},
            {x: 1, y: 0},
            {x: -1, y: 0},
            {x: 0, y: 1}
        ]
    }
}

class Minister extends Unit {
    constructor() {
        super();
        this.char = "相";
        this.movePosition = [
            {x: -1, y: -1},
            {x: 1, y: -1},
            {x: -1, y: 1},
            {x: 1, y: 1}
        ]
    }
}

class King extends Unit {
    constructor() {
        super();
        this.lastCounter = 0;
        this.char = "王";
        this.movePosition = [
            {x: -1, y: -1},
            {x: 0, y: -1},
            {x: -1, y: 1},
            {x: -1, y: 0},
            {x: 1, y: 0},
            {x: 1, y: -1},
            {x: 0, y: 1},
            {x: 1, y: 1},
        ]
    }

    update(position) {
        if(this.cell.team === 'blue'){
            if(position.y === 0){
                if(this.lastCounter === 2){
                    this.cell.board.game.renderMsgBox(`<span style="color: ${this.cell.team}">${this.cell.team}</span> win`); // `blue win
                    this.board.game.setGame = true;
                    this.cell.board.game.createRestartBtn();
                    this.cell.board.game.setGame = true;
                }
                this.lastCounter++;
            }else{
                this.lastCounter = 0;
            }
        }
        if(this.cell.team === 'red'){
            if(position.y === 3){
                if(this.lastCounter === 2){
                    this.cell.board.game.renderMsgBox(`<span style="color: ${this.cell.team}">${this.cell.team}</span> win`); // `red win
                    this.board.game.setGame = true;
                    this.cell.board.game.createRestartBtn();
                    this.cell.board.game.setGame = true;
                }
                this.lastCounter++;
            }
        }
    }
}

class Pawn extends Unit {
    constructor() {
        super();
        this.char = "子";
        this.movePosition = [
            {x: 0, y: -1}
        ];
    }

    update(position) {
        if(this?.cell?.team === 'blue'){
            if(position.y === 0){
                this.cell.unit = new Marquis();
                this.cell.board.render();
            }
        }
        if(this?.cell?.team === 'red'){
            if(position.y === 3){
                this.cell.unit = new Marquis();
                this.cell.board.render();
            }
        } 
    }
}

class Marquis extends Unit {
    constructor() {
        super();
        this.char = "侯";
        this.movePosition = [
            {x: -1, y: -1},
            {x: 0, y: -1},
            {x: -1, y: 0},
            {x: 1, y: 0},
            {x: 1, y: -1},
            {x: 0, y: 1},
        ]
    }
}