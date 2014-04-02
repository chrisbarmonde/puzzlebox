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
        PLAYER: 0,
        PLATFORM: 1,
        START: 2,
        FINISH: 3,
        RED: 4,
        GREEN: 5,
        YELLOW: 6,
        BLUE: 7
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
         * {
         *   2: {
         *     3: Level.BLOCK_TYPES.PLATFORM,
         *     4: Level.BLOCK_TYPES.PLATFORM,
         *     5: Level.BLOCK_TYPES.PLATFORM
         *   }
         *   3: {
         *     4: Level.BLOCK_TYPES.RED
         *   }
         * }
         *
         * This would create three platform blocks at coords (2,3), (2,4),
         * and (2,5) with one red block at (3,4)
         *
         * @returns {object}
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

            _(this.getGrid()).each(function(row, y) {
                _(row).each(function(blockType, x) {
                    if (!self._grid[x]) {
                        self._grid[x] = {};
                    }

                    switch (blockType) {
                        case BLOCK_TYPES.PLAYER:
                            self.addPlayer(new Babylon.Vector2(x, y));
                            hasPlayer = true;
                            break;

                        case BLOCK_TYPES.PLATFORM:
                            self.addPlatformBlock(new Babylon.Vector2(x, y));
                            break;

                        case BLOCK_TYPES.RED:
                        case BLOCK_TYPES.GREEN:
                        case BLOCK_TYPES.YELLOW:
                        case BLOCK_TYPES.BLUE:
                            self.addColorBlock(blockType, new Babylon.Vector2(x, y));
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

            position = this._getPosition(position);
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
            block.position = this._getPosition(position);
            block.checkCollisions = true;
            block.movable = movable;
            block._type = blockType;

            // We put planes on top of our blocks so we can have better hit detection
            // and so that gravity-based stuff works properly.
            var plane = Babylon.Mesh.CreatePlane('Plane' + name, config.BLOCK_SIZE, this._scene);
            plane.parent = block;
            plane.position = new Babylon.Vector3(0, (config.BLOCK_SIZE / 2) + 0.1, 0);
            plane.material = new Babylon.StandardMaterial('', this._scene);
            plane.material.alpha = 0;
            plane.rotation = new Babylon.Vector3(Math.PI / 2, 0, 0);
            plane.checkCollisions = true;
            plane.plane = true;

            this._grid[position.x][position.y] = block;
            return block;
        },

        /**
         * Adds a color block to the grid. Color blocks will fall if there is nothing
         * below them and they can be moved by the player.
         *
         * @param {string} blockType
         * @param {Babylon.Vector2} position
         */
        addColorBlock: function(blockType, position) {
            var color = BLOCK_TYPES_INVERTED[blockType];
            this._addBlock(blockType, BLOCK_COLORS[color], position, true);
        },

        /**
         * Adds a platform block. Platform blocks aren't affected by gravity and
         * cannot be moved.
         *
         * @param {Babylon.Vector2} position
         */
        addPlatformBlock: function(position) {
            var block = this._addBlock(
                Level.BLOCK_TYPES.PLATFORM,
                BLOCK_COLORS.BLACK,
                position,
                false
            );
            block.material.diffuseColor = BLOCK_COLORS.BLACK;
        },

        /**
         * Returns a calculated position for the block based on the configured
         * block size.
         *
         * @param {Babylon.Vector2} position
         * @returns {Babylon.Vector3}
         * @private
         */
        _getPosition: function(position) {
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
        isColorBlock: function(block) {
            return !!block && _(COLOR_TYPES).contains(block._type);
        },
        isPlatformBlock: function(block) {
            return !!block && block._type === BLOCK_TYPES.PLATFORM;
        }
    });

    return Level;
});
