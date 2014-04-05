define('game/level',
    ['game/config', 'game/player', 'babylon', 'underscore'],
    function(config, Player, Babylon, _) {

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
                self = this;

            _(this.getGrid().reverse()).each(function(row, y) {
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
         * @param {Babylon.Vector2} position
         */
        addPlayer: function(position) {
            if (this._player) {
                throw "Multiple players defined";
            }

            var player = new Player(this);

            position = this._getBlockPosition(position);
            position.y -= config.GRAVITY;
            player.setPosition(position);

            this._player = player;
        },

        /**
         * Adds a generic block to the grid
         *
         * @parma {string} blockType
         * @param {(Babylon.Color3|Babylon.Color4)} color
         * @param {Babylon.Vector2} position
         * @param {boolean} movable - True if the block is movable by the player
         * @returns {Babylon.Mesh} - The created block
         * @private
         */
        _addBlock: function(blockType, color, position, movable) {
            var name = position.x + position.y,
                block = Babylon.Mesh.CreateBox('Box' + name, config.BLOCK_SIZE, this._scene);
            block.material = new Babylon.StandardMaterial('', this._scene);
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
