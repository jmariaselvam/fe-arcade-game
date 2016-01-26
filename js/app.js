//START: CONSTANTS
/* Offset to display the player character's foot in the middle of a gameboard tile */
var PLAYER_Y_OFFSET = 50;

/* Offset to display the enemy character within the stone-block tiles */
var ENEMY_Y_OFFSET = 60;

/* The game board tile width */
var TILE_WIDTH = 101;

/* The game board tile height*/
var TILE_HEIGHT = 83;

/* Boundaries beyond which the game characters shouldn't move */
var GAME_BOARD_BOUNDARY_MAPPING = {
    'left': 0,
    'right': 505,
    'top': 0,
    'bottom': 415
};

//X coordinate to put the game characters off-screen. E.g before game start or after game is reset
var OFF_SCREEN_X = -100;

//Scoreboard text coordinates
var SCOREBOARD_TEXT_X = 10;
var SCOREBOARD_TEXT_Y = TILE_HEIGHT + 20;
//END: CONSTANTS

/**
 * CREDIT: Mozilla Foundation
 * @description Returns a random integer between min (included) and max (included)
 * @param {number} min - The minimum value of number that can be generated
 * @param {number} max - The maximum value of number that can be generated
 */
function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * @description Converts a given rectangle to a rectangular bounds object
 * @param {number} x - rectangle top left corner x coordinate
 * @param {number} y - rectangel top left corner y coordinate
 * @param {number} width - width of the rectangle
 * @param {number} height - height of the rectangle
 *
 * @returns {Object} an object with 'left', 'right', 'top', 'bottom' properties for bounds
 */
function rectangleToBounds(x, y, width, height) {
    var bounds = {
        'left': x,
        'right': x + width,
        'top': y,
        'bottom': y + height
    };
    return bounds;
}

/**
 * @description Detects collision between two objects with rectangular bounded boxes
 * @param {Object} objectOne - object with left', 'right', 'top', 'bottom' properties for bounds
 * @param {Object} objectTwo - object with left', 'right', 'top', 'bottom' properties for bounds
 *
 * @returns {boolean} true - if the objects collide
 *                    false - if the objects don't collide
 */
function isCollision(objectOne, objectTwo) {
    if (objectOne.left < objectTwo.right &&
        objectOne.right > objectTwo.left &&
        objectOne.top < objectTwo.bottom &&
        objectOne.bottom > objectTwo.top) {
        return true;
    }

    return false;
}

//START: Enemy
/**
 * @description Represents an enemy
 * @constructor
 * @param {number} x - The x coordinate of the enemy
 * @param {number} y - The y coordinate of the enemy
 * @param {number} speed - The speed at which the enemy should move
 */
var Enemy = function(x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    // The image/sprite for our enemies, this uses
    // a helper we've provided to easily load images
    this.sprite = 'images/enemy-bug.png';
};

/**
 * @description Updates the enemy's position over time
 * @parameter {number} dt - a time delta between ticks
 */
Enemy.prototype.update = function(dt) {
    //For smooth rendering of frames
    this.x += (this.speed * dt);
    //We make sure that the enemy characters stay within the right hand side edge of the game board
    if (this.x > GAME_BOARD_BOUNDARY_MAPPING.right) {
        this.reset();
    }

    this.detectCollision();
};

/**
 * @description Resets the enemy location and makes it invisible by rendering it off the game board
 */
Enemy.prototype.reset = function() {
    this.x = OFF_SCREEN_X;
};

/**
 * @description Draws the enemy on the screen
 */
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

/**
 * @description Detects if the enemy collides with a player
 */
Enemy.prototype.detectCollision = function() {
    //We define the bounding boxes to be smaller than they actually are so that the collision seems more realistic,
    //since the characters are somewhere in the middle of the bounding box
    var halfTileWidth = TILE_WIDTH / 2,
        halfTileHeight = TILE_HEIGHT / 2;

    //Reset both the player, the enemy and the scoreboard when a collision occurs.
    if (isCollision(rectangleToBounds(this.x, this.y, halfTileWidth, halfTileHeight),
            rectangleToBounds(player.x, player.y, halfTileWidth, halfTileHeight))) {
        this.reset();
        player.reset();
        scoreBoard.reset();
    }
};

/**
 * @description Initialise the enemies
 * @param {number} numberOfEnemies - the number of enemy instances to create
 */
var initEnemies = function(numberOfEnemies) {
    //Generate a speed value within the start and end range
    var SPEED_RANGE_START = 50,
        SPEED_RANGE_END = 250;
    var enemies = [];

    for (var i = 0; i < numberOfEnemies; i++) {
        //Create enemies off-screen and they should only move on the stone blocks
        var enemy = new Enemy(OFF_SCREEN_X, i % 3 * TILE_HEIGHT + ENEMY_Y_OFFSET, getRandomIntInclusive(
            SPEED_RANGE_START, SPEED_RANGE_END));
        enemies.push(enemy);
    }

    return enemies;
};
//END: enemy


//START: Player
/**
 * @description Represents a Player
 * @constructor
 * @param {number} x - The x coordinate of the player
 * @param {number} y - The y coordinate of the player
 */
var Player = function(x, y) {
    this.x = x;
    this.y = y;
    //The image for our player
    this.sprite = 'images/char-boy.png';
};

/**
 * @description Displays the player
 */
Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

/**
 * @description Resets the player's location to the starting position
 */
Player.prototype.reset = function() {
    this.x = 2 * TILE_WIDTH;
    this.y = (4 * TILE_HEIGHT) + PLAYER_Y_OFFSET;
};

/**
 * @description Handles the player's movement in four directions and checks the boundaries.
 * The boundaries of the game board is hardcoded in the constant <code>GAME_BOARD_BOUNDARY_MAPPING</code>
 * @param {string} direction - The direction in which the player has been instructed to move
 */
Player.prototype.handleInput = function(direction) {

    switch (direction) {
        case 'left':
            if (this.x - TILE_WIDTH >= GAME_BOARD_BOUNDARY_MAPPING.left) {
                this.x -= TILE_WIDTH;
            }
            break;
        case 'up':
            if (this.y - TILE_HEIGHT >= GAME_BOARD_BOUNDARY_MAPPING.top) {
                this.y -= TILE_HEIGHT;
            } else {
                //We reset the player's original location when we reach the water and increment the score
                this.reset();
                scoreBoard.addScore(1);
            }
            break;
        case 'right':
            if (this.x + TILE_WIDTH < GAME_BOARD_BOUNDARY_MAPPING.right) {
                this.x += TILE_WIDTH;
            }
            break;
        case 'down':
            if (this.y + TILE_HEIGHT < GAME_BOARD_BOUNDARY_MAPPING.bottom) {
                this.y += TILE_HEIGHT;
            }
            break;
    }

    //Handle player collision with the collectables
    collectables.forEach(function(collectable) {
        collectable.update();
    });

};

/**
 * @description Factory function that only creates a single player instance per application
 * I am supporting only single player mode for this game so return a 'Singleton' instance
 */
var playerFactory = (function() {
    var instance;
    return function() {
        if (typeof(instance) === 'undefined') {
            //Player start location is on row 6 (grass)
            instance = new Player(2 * TILE_WIDTH, (4 * TILE_HEIGHT) + PLAYER_Y_OFFSET);
        }
        return instance;
    };
})();
//END: Player

//START: Score Board
/**
 * @description Represents a Score Board
 * @constructor
 * @param {number} x - The x coordinate of the score board
 * @param {number} y - The y coordinate of the score board
 */
var ScoreBoard = function(x, y) {
    //The title and the initial score are the same for all scoreboards
    this.title = 'Score';
    this.score = 0;
    this.x = x;
    this.y = y;
};

/**
 * @description Renders the score board
 */
ScoreBoard.prototype.render = function() {
    //We assign a default font and style
    ctx.font = "48px serif";
    ctx.fillStyle = 'yellow';
    //render the title and the score
    ctx.fillText(this.title + ': ' + this.score, this.x, this.y);
};

/**
 * @description Resets the score to 0
 */
ScoreBoard.prototype.reset = function() {
    this.score = 0;
};

/**
 * @description Adds a score to the score board
 * @param {number} score - The score to be added to the score board
 */
ScoreBoard.prototype.addScore = function(score) {
    this.score += score;
};
//END: Score Board

//START Collectable
/**
 * @description Represents a collectable item like gems
 * @param {string} sprite - The image name associated with this collectable
 */
var Collectable = function(sprite) {
    //Generate random locations for the collectable
    this.x = getRandomIntInclusive(1, 4) * TILE_WIDTH;
    this.y = getRandomIntInclusive(1, 4) * TILE_HEIGHT;
    this.sprite = sprite;
};

/**
 * @description Renders the collectable on the game board
 */
Collectable.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

/**
 * @description Updates the collectables array by removing the collectable that has been collected by the player
 */
Collectable.prototype.update = function() {
    //Determine collision
    if (isCollision(rectangleToBounds(player.x, player.y, TILE_WIDTH / 2, TILE_HEIGHT / 2),
            rectangleToBounds(this.x, this.y, TILE_WIDTH / 2, TILE_HEIGHT / 2))) {
        scoreBoard.addScore(5);
        console.log(this);

        //Remove the gem that has been collected from the gem array
        var itemIndex = collectables.indexOf(this);
        if (itemIndex > -1) {
            collectables.splice(itemIndex, 1);
        }
    }
};

/**
 * @description Overrides <code>Object.toString</code> method to display Collectable properties in the console
 */
Collectable.prototype.toString = function() {
    return 'Collectable x=' + this.x + ' ,y=' + this.y + ' ,sprite=' + this.sprite;
};

/**
 * @description Initialise a number of collectables to be displayed on the game board
 */
var initCollectables = function() {
    var sprites = ['images/Gem Blue.png', 'images/Gem Green.png', 'images/Gem Orange.png'];
    var collectables = [];
    for (var i = 0; i < 3; i++) {
        var collectable = new Collectable(sprites[i]);
        console.log(collectable);
        collectables.push(collectable);
    }
    return collectables;
};
//END Collectable


// Initilise game characters
var allEnemies = initEnemies(3);
var player = playerFactory();
var scoreBoard = new ScoreBoard(SCOREBOARD_TEXT_X, SCOREBOARD_TEXT_Y);
var collectables = initCollectables();

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };
    player.handleInput(allowedKeys[e.keyCode]);
});