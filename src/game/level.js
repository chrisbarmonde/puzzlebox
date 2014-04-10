define('game/level',
    ['game/config', 'game/constants', 'game/player', 'babylon', 'underscore'],
    function(config, constants, Player, Babylon, _) {

    /**
     * Colors of our matching blocks
     *
     * @enum {Babylon.Color3}
     */
    var BLOCK_COLORS = {
        BLACK:  new Babylon.Color3(0, 0, 0),
        RED:    new Babylon.Color3(1, 0, 0),
        GREEN:  new Babylon.Color3(0, 1, 0),
        YELLOW: new Babylon.Color3(1, 1, 0),
        BLUE:   new Babylon.Color3(0, 0, 1)
    };

    /**
     * Different types of blocks we have
     * @enum {int}
     */
    var BLOCK_TYPES = {
        PLATFORM: 1,
        PLATFORM_THIN: 2,
        START: 3,
        END: 4,
        RED: 5,
        GREEN: 6,
        YELLOW: 7,
        BLUE: 8
    };

    /**
     * Color-specific block types
     *
     * @type {int[]}
     */
    var COLOR_TYPES = [
        BLOCK_TYPES.RED,
        BLOCK_TYPES.GREEN,
        BLOCK_TYPES.YELLOW,
        BLOCK_TYPES.BLUE
    ];

    /**
     * Mapping of the characters used in the level maps to
     * the type of block they represent.
     *
     * @enum {int}
     */
    var BLOCK_MAP = {
        S: BLOCK_TYPES.PLATFORM,
        E: BLOCK_TYPES.PLATFORM,
        P: BLOCK_TYPES.PLATFORM,
        T: BLOCK_TYPES.PLATFORM_THIN,
        R: BLOCK_TYPES.RED,
        G: BLOCK_TYPES.GREEN,
        Y: BLOCK_TYPES.YELLOW,
        B: BLOCK_TYPES.BLUE
    };
    var BLOCK_MAP_INVERSE = _(BLOCK_MAP).invert();

    /**
     * Reverse mapping for block types
     *
     * @enum {string}
     */
    var BLOCK_TYPES_INVERTED = _(BLOCK_TYPES).invert();


    /**
     * Represents a single playable level
     *
     * @param {Babylon.Scene} scene
     * @class
     * @prop {Babylon.Scene} _scene  - Our scene
     * @prop {?Player}       _player - The player in the level
     * @prop {object}        _grid   - The grid of blocks
     */
    var Level = function(scene) {
        this._scene = scene;
        this._player = null;
        this._grid = {};
    };
    _(Level.prototype).extend({
        /**
         * Returns the grid of blocks formatted as x-y axes in rows.
         * Example:
         * [
         *   '   R',
         *   '  PPP'
         * ]
         *
         * This would create three platform blocks at coords (1,3), (1,4),
         * and (1,5) with one red block at (2,4)
         *
         * @returns {string[]}
         */
        getGrid: function() {
            throw "You must create a grid";
        },

        /**
         * Builds all our necessary Babylon objects based on our grid
         */
        setupGrid: function() {
            var maxX = 0,
                maxY = 0,
                hasPlayer = false,
                self = this,
                grid = this.getGrid();

            grid.reverse();
            _(grid).each(function(row, y) {
                _(row).each(function(blockType, x) {
                    if (!self._grid[x]) {
                        self._grid[x] = {};
                    }

                    var position = new Babylon.Vector2(x, y);
                    switch (blockType) {
                        case 'S':
                            self.addPlatformBlock(position);
                            self.addPlayer(new Babylon.Vector2(x, y + 1));
                            if (y + 1 > maxY) {
                                maxY = y + 1;
                            }
                            hasPlayer = true;
                            break;

                        case 'E':
                            self.addPlatformBlock(position);
                            break;

                        case 'P':
                            self.addPlatformBlock(position);
                            break;

                        case 'T':
                            self.addThinPlatformBlock(position);
                            break;

                        case 'R':
                        case 'G':
                        case 'Y':
                        case 'B':
                            self.addColorBlock(BLOCK_MAP[blockType], position);
                            break;
                    }

                    if (x > maxX) {
                        maxX = x;
                    }
                    if (y > maxY) {
                        maxY = y;
                    }
                });
            });

            if (!hasPlayer) {
                throw "You must have a player";
            }

            // After we've build all our defined blocks, we fill in the rest
            // of the grid with empty space, just to avoid annoying JS checks
            // later on.
            for (var x = 0; x <= maxX; x++) {
                if (!this._grid[x]) {
                    this._grid[x] = {};
                }
                for (var y = 0; y <= maxY; y++) {
                    if (!this._grid[x][y]) {
                        this._grid[x][y] = null;
                    }
                }
            }
        },

        /**
         * Returns our player
         *
         * @returns {Player}
         */
        getPlayer: function() {
            return this._player;
        },

        /**
         * Creates a new Player at the given position and adds it to the grid
         *
         * @param {Babylon.Vector2} coords
         */
        addPlayer: function(coords) {
            if (this._player) {
                throw "Multiple players defined";
            }

            this._player = new Player(this);
            this.setPlayerCoords(coords);
        },

        /**
         * Sets a player's position on the grid based on a set of coordinates
         *
         * @param {Babylon.Vector2} coords
         */
        setPlayerCoords: function(coords) {
            if (!this._player) {
                throw "No player created";
            }

            var position = this._getBlockPosition(coords);
            position.y -= config.GRAVITY;
            this._player.setPosition(position);
        },

        /**
         * Adds a generic block to the grid
         *
         * @param {string} blockType
         * @param {(Babylon.Color3|Babylon.Color4)} color
         * @param {Babylon.Vector2} position
         * @param {boolean} movable - True if the block is movable by the player
         * @returns {Babylon.Mesh} - The created block
         * @private
         */
        _addBlock: function(blockType, color, position, movable) {
            var name = '' + position.x + position.y,
                block = Babylon.Mesh.CreateBox('Box' + name, config.BLOCK_SIZE, this._scene, true);
            block.material = new Babylon.StandardMaterial('Mat' + name, this._scene);
            block.material.emissiveColor = color;
            block.material.backFaceCulling = false;
            block.position = this._getBlockPosition(position);
            block.checkCollisions = true;
            block.movable = movable;
            block._type = blockType;

            this._grid[position.x][position.y] = block;
            return block;
        },

        /**
         * Adds a color block to the grid. Color blocks will fall if there is nothing
         * below them and they can be moved by the player.
         *
         * @param {string} blockType
         * @param {Babylon.Vector2} position
         * @returns {Babylon.Mesh}
         */
        addColorBlock: function(blockType, position) {
            var color = BLOCK_TYPES_INVERTED[blockType];
            return this._addBlock(blockType, BLOCK_COLORS[color], position, true);
        },

        /**
         * Adds a platform block. Platform blocks aren't affected by gravity and
         * cannot be moved.
         *
         * @param {Babylon.Vector2} position
         * @returns {Babylon.Mesh}
         */
        addPlatformBlock: function(position) {
            var block = this._addBlock(
                Level.BLOCK_TYPES.PLATFORM,
                BLOCK_COLORS.BLACK,
                position,
                false
            );
            block.material.diffuseColor = BLOCK_COLORS.BLACK;
            return block;
        },

        /**
         * Adds a thin platform block. These are a quarter the size of a normal platform,
         * though their are positioned vertically at the top of a normal block.
         *
         * @param {Babylon.Vector2} position
         * @returns {Babylon.Mesh}
         */
        addThinPlatformBlock: function(position) {
            var block = this.addPlatformBlock(position);
            block._type = Level.BLOCK_TYPES.PLATFORM_THIN;
            block.scaling = new Babylon.Vector3(1, 0.25, 1);
            block.position.y += config.BLOCK_SIZE / 4 + config.BLOCK_SIZE / 8;
            return block;
        },

        /**
         * Returns a calculated position for the block based on the configured
         * block size.
         *
         * @param {Babylon.Vector2} position
         * @returns {Babylon.Vector3}
         * @private
         */
        _getBlockPosition: function(position) {
            return new Babylon.Vector3(
                position.x * config.BLOCK_SIZE,
                position.y * config.BLOCK_SIZE,
                0
            );
        },

        /**
         * Return coordinates in the grid for a position in the scene
         *
         * @param {Babylon.Vector3} position
         * @returns {Babylon.Vector2}
         */
        getGridCoordinates: function(position) {
            return new Babylon.Vector2(
                Math.round(position.x / config.BLOCK_SIZE),
                Math.round(position.y / config.BLOCK_SIZE)
            );
        },

        /**
         * Returns a block at the given coordinates on the grid
         *
         * @param {Babylon.Vector2} coords
         * @returns {?Babylon.Mesh}
         */
        getBlock: function(coords) {
            return this._grid[coords.x] && this._grid[coords.x][coords.y];
        },

        /**
         * Returns true if the block at the given coordinates is movable
         *
         * @param {Babylon.Vector2} coords
         * @returns {boolean}
         */
        isMovableBlock: function(coords) {
            var block = this.getBlock(coords);
            return (block) ? block.movable : false;
        },

        /**
         * Determines whether the player can move the block in the direction
         * specified. The mechanics of the game dictate that a block can only
         * be pushed if there is an open space behind it, and it can only be
         * pulled if there is an open space behind *the player* that the player
         * can move into once the move is done.
         *
         * @param {Babylon.Mesh} block
         * @param {int} direction - DIRECTIONS constant
         * @returns {boolean}
         */
        canMoveBlock: function(block, direction) {
            // If the block is falling, it can't be moved
            if (block._falling) {
                return false;
            }

            var coords = this.getGridCoordinates(block.position),
                newBlock = null;
            if (direction === constants.DIRECTIONS.LEFT) {
                newBlock = this.getBlock(new Babylon.Vector2(coords.x - 1, coords.y));
            } else if (direction === constants.DIRECTIONS.RIGHT) {
                newBlock = this.getBlock(new Babylon.Vector2(coords.x + 1, coords.y));
            }

            // If there's a block in the way of where we're going, it can't
            // be moved in that direction
            if (newBlock) {
                return false;
            }

            var playerCoords = this.getPlayerCoordinates(),
                // Used to determine if player is on the left or right of the block
                diff = playerCoords.subtract(coords),
                platform = null;

            if (diff.x < 0 && direction === constants.DIRECTIONS.LEFT) {
                // If the player is on the left and we're pulling left...
                // Check if there's a block to the left of the player
                newBlock = this.getBlock(new Babylon.Vector2(playerCoords.x - 1, playerCoords.y));
                // And check if there's a platform to the left of the player
                platform = this.getBlock(new Babylon.Vector2(playerCoords.x - 1, playerCoords.y - 1));
                return !newBlock && !!platform;
            } else if (diff.x > 0 && direction === constants.DIRECTIONS.RIGHT) {
                // if the player is on the right and we're pulling right...
                // Check if there's a block to the right of the player
                newBlock = this.getBlock(new Babylon.Vector2(playerCoords.x + 1, playerCoords.y));
                // And check if there's a platform to the right of the player
                platform = this.getBlock(new Babylon.Vector2(playerCoords.x + 1, playerCoords.y - 1));
                return !newBlock && !!platform;
            }

            return true;
        },

        /**
         * Updates a block's coordinates once it's finished being pushed or pulled.
         * If it's been pushed off a platform, it will then fall until it reaches
         * the next nearest block or off into infinity, never to be seen again.
         *
         * @param {Babylon.Mesh} block
         */
        updateBlockCoordinates: function(block) {
            if (!block.movable) {
                throw "Attempting to move an immovable block";
            }

            var self = this;
            _(this._grid).each(function(col, x) {
                _(col).each(function(_block, y) {
                    if (block === _block) {
                        self._grid[x][y] = null;
                    }
                });
            });

            var coords = this.getGridCoordinates(block.position);
            this._grid[coords.x][coords.y] = block;
            block._resetPointsArrayCache();

            var fallTo = null;
            if (!this.getBlock(new Babylon.Vector2(coords.x, coords.y - 1))) {
                for (var y = coords.y - 2; y >= 0; y--) {
                    var gridCoords = new Babylon.Vector2(coords.x, y),
                        blockBelow = this.getBlock(gridCoords);
                    if (blockBelow) {
                        fallTo = gridCoords;
                        fallTo.y += 1;
                        break;
                    }
                }

                if (!fallTo) {
                    fallTo = new Babylon.Vector2(coords.x, -20);
                }
            }

            if (fallTo) {
                block._falling = true;
                var newPosition = this._getBlockPosition(fallTo),
                    step = (newPosition.y - block.position.y) / config.FPS;
                var anim = function() {
                    if (block.position.y + step <= newPosition.y) {
                        block.position.y = newPosition.y;

                        self._grid[coords.x][coords.y] = null;
                        self._grid[fallTo.x][fallTo.y] = block;

                        block._falling = false;
                        block._resetPointsArrayCache();
                        self.checkForMatch(block);
                        self._scene.unregisterBeforeRender(anim);
                    } else {
                        block.position.y += step;
                    }
                };
                this._scene.registerBeforeRender(anim);
            } else {
                this.checkForMatch(block);
            }
        },

        checkForMatch: function(block) {
            if (!_(BLOCK_TYPES).contains(block._type)) {
                return false;
            }

            var coords = this.getGridCoordinates(block.position);
            var positions = [
                [coords.x + 1, coords.y], // Right
                [coords.x, coords.y - 1], // Down
                [coords.x - 1, coords.y] // Left
            ];
            var matchingBlocks = [];
            var self = this;
            _(positions).each(function(position) {
                var testBlock = self._grid[position[0]][position[1]];
                if (testBlock && testBlock._type === block._type) {
                    matchingBlocks.push(testBlock);
                }
            });

            if (matchingBlocks.length > 0) {
                matchingBlocks.push(block);
                _(matchingBlocks).each(function(b) {
                    b.material.wireframe = true;
                    b.dispose();
                    coords = self.getGridCoordinates(b.position);
                    self._grid[coords.x][coords.y] = null;
                });
            }
        },

        /**
         * Return the (x,y) coordinates of the player on the grid
         *
         * @returns {BABYLON.Vector2}
         */
        getPlayerCoordinates: function() {
            var playerPosition = this.getPlayer().getPosition();
            return this.getGridCoordinates(playerPosition);
        },

        /**
         * Return the block next to the player in the direction the player is facing.
         * Returns null if there is no block.
         *
         * @returns {?Babylon.Mesh}
         */
        getBlockNextToPlayer: function() {
            var coords = this.getPlayerCoordinates(),
                direction = this.getPlayer().getDirectionFacing();

            if (direction === constants.DIRECTIONS.RIGHT) {
                return this.getBlock(new Babylon.Vector2(coords.x + 1, coords.y));
            } else if (direction === constants.DIRECTIONS.LEFT) {
                return this.getBlock(new Babylon.Vector2(coords.x - 1, coords.y));
            }

            return null;
        },

        isPlayerNextToMovableBlock: function() {
            var block = this.getBlockNextToPlayer();
            return (block) ? block.movable : false;
        }
    });
    _(Level).extend({
        BLOCK_COLORS: BLOCK_COLORS,
        BLOCK_TYPES: BLOCK_TYPES,
        BLOCK_TYPES_INVERTED: BLOCK_TYPES_INVERTED,
        COLOR_TYPES: COLOR_TYPES,
        BLOCK_MAP: BLOCK_MAP,
        BLOCK_MAP_INVERSE: BLOCK_MAP_INVERSE,

        isColorBlock: function(block) {
            return !!block && _(COLOR_TYPES).contains(block._type);
        },
        isPlatformBlock: function(block) {
            return !!block && block._type === BLOCK_TYPES.PLATFORM;
        },
        isThinPlatformBlock: function(block) {
            return !!block && block._type === BLOCK_TYPES.PLATFORM_THIN;
        }
    });

    return Level;
});
