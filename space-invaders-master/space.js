let tileSize = 32;
let rows = 16;
let columns = 41;

let board;
let boardWidth = tileSize * columns; // 32 * 41
let boardHeight = tileSize * rows; // 32 * 16
let context;

//ship
let shipWidth = tileSize * 2;
let shipHeight = tileSize;
let shipX = tileSize * columns / 2 - tileSize;
let shipY = tileSize * rows - tileSize * 2;

let ship = {
    x: shipX,
    y: shipY,
    width: shipWidth,
    height: shipHeight
};

let shipImg;
let baseShipVelocityX = tileSize; //base ship moving speed
let shipVelocityX = baseShipVelocityX;

//aliens
let alienArray = [];
let alienWidth = tileSize * 2;
let alienHeight = tileSize;
let alienX = tileSize;
let alienY = tileSize;
let alienImg;

let alienCount = 0; //number of aliens to defeat
let baseAlienVelocityX = 1; //base alien moving speed
let alienVelocityX = baseAlienVelocityX;

//bullets
let bulletArray = [];
let baseBulletVelocityY = -10; //base bullet moving speed
let bulletVelocityY = baseBulletVelocityY;

let score = 0;
let gameOver = false;
let wonGame = false;
let currentLevel = 1;
let transitioning = false;

const levels = [
    { rows: 2, columns: 3, velocityX: 1 },
    { rows: 3, columns: 4, velocityX: 1.5 },
    { rows: 4, columns: 5, velocityX: 2 },
    { rows: 5, columns: 6, velocityX: 2.5 }
];

window.onload = function() {
    board = document.getElementById("board");
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d"); //used for drawing on the board

    //load images
    shipImg = new Image();
    shipImg.src = "./ship.png";
    shipImg.onload = function() {
        context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);
    }

    alienImg = new Image();
    alienImg.src = "./alien.png";
    loadLevel(currentLevel);

    requestAnimationFrame(update);
    document.addEventListener("mousemove", moveShip);
    document.addEventListener("mousedown", shoot);
}

function loadLevel(level) {
    let config = levels[level - 1];
    alienArray = [];
    bulletArray = [];
    alienCount = 0;
    alienVelocityX = config.velocityX;
    createAliens(config.rows, config.columns);
    adjustSpeeds(level);
}

function update() {
    requestAnimationFrame(update);

    if (gameOver) {
        context.fillStyle = "white";
        context.font = "32px courier";
        context.fillText("Game Over", boardWidth / 2 - 80, boardHeight / 2);
        context.fillText("Try Again", boardWidth / 2 - 60, boardHeight / 2 + 40);
        return;
    }

    if (wonGame) {
        context.fillStyle = "white";
        context.font = "32px courier";
        context.fillText("You Won!", boardWidth / 2 - 80, boardHeight / 2);
        return; // Only display "You Won!" and skip the next part
    }

    if (transitioning) {
        context.clearRect(0, 0, board.width, board.height);
        context.fillStyle = "white";
        context.font = "32px courier";
        context.fillText("Level " + currentLevel, boardWidth / 2 - 50, boardHeight / 2);
        return;
    }

    context.clearRect(0, 0, board.width, board.height);

    //ship
    context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);

    //alien
    for (let i = 0; i < alienArray.length; i++) {
        let alien = alienArray[i];
        if (alien.alive) {
            alien.x += alienVelocityX;

            //if alien touches the borders
            if (alien.x + alien.width >= board.width || alien.x <= 0) {
                alienVelocityX *= -1;
                alien.x += alienVelocityX * 2;

                //move all aliens up by one row
                for (let j = 0; j < alienArray.length; j++) {
                    alienArray[j].y += alienHeight;
                }
            }
            context.drawImage(alienImg, alien.x, alien.y, alien.width, alien.height);

            if (alien.y >= ship.y) {
                gameOver = true;
            }
        }
    }

    //bullets
    for (let i = 0; i < bulletArray.length; i++) {
        let bullet = bulletArray[i];
        bullet.y += bulletVelocityY;
        context.fillStyle = "white";
        context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        //bullet collision with aliens
        for (let j = 0; j < alienArray.length; j++) {
            let alien = alienArray[j];
            if (!bullet.used && alien.alive && detectCollision(bullet, alien)) {
                bullet.used = true;
                alien.alive = false;
                alienCount--;
                score += 100;
            }
        }
    }

    //clear bullets
    while (bulletArray.length > 0 && (bulletArray[0].used || bulletArray[0].y < 0)) {
        bulletArray.shift(); //removes the first element of the array
    }

    //next level
    if (alienCount == 0 && bulletArray.length === 0) {
        score += alienArray.length * 100; //bonus points :)
        currentLevel++;
        if (currentLevel > levels.length) {
            wonGame = true;
        } else {
            transitioning = true;
            setTimeout(() => {
                transitioning = false;
                loadLevel(currentLevel);
            }, 2000); // 2-second delay
        }
    }

    //score
    context.fillStyle = "white";
    context.font = "16px courier";
    context.fillText(score, 5, 20);
}

function moveShip(e) {
    if (gameOver || transitioning || wonGame) {
        return;
    }

    let rect = board.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;

    ship.x = mouseX - ship.width / 2; // center ship on mouse X position

    // constrain ship within board bounds
    if (ship.x < 0) {
        ship.x = 0;
    } else if (ship.x + ship.width > boardWidth) {
        ship.x = boardWidth - ship.width;
    }
}

function createAliens(rows, columns) {
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows; r++) {
            let alien = {
                img: alienImg,
                x: alienX + c * alienWidth,
                y: alienY + r * alienHeight,
                width: alienWidth,
                height: alienHeight,
                alive: true
            };
            alienArray.push(alien);
        }
    }
    alienCount = alienArray.length;
}

function shoot(e) {
    if (gameOver || transitioning || wonGame) {
        return;
    }

    // shoot on mouse click
    let rect = board.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;

    let bullet = {
        x: mouseX - tileSize / 16, // adjust bullet starting X position
        y: ship.y,
        width: tileSize / 8,
        height: tileSize / 2,
        used: false
    };
    bulletArray.push(bullet);
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}

function adjustSpeeds(level) {
    // Adjust ship and bullet speeds based on level
    shipVelocityX = baseShipVelocityX + (level - 1) * 0.5;
    bulletVelocityY = baseBulletVelocityY - (level - 1) * 2;
    alienVelocityX = levels[level - 1].velocityX;
}

function resetGame() {
    score = 0;
    gameOver = false;
    wonGame = false;
    currentLevel = 1;
    loadLevel(currentLevel);
}