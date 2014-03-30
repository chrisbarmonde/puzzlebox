define('scene', ['babylon', 'player', 'underscore'], function(Babylon, Player, _) {
    var BLOCK_SIZE = 10,
        BLOCK_COLORS = {
            RED:    new Babylon.Color3(1, 0, 0),
            GREEN:  new Babylon.Color3(0, 1, 0),
            YELLOW: new Babylon.Color3(1, 1, 0),
            BLUE:   new Babylon.Color3(0, 0, 1)
        },
        BLOCK_TYPES = {
            PLAYER: 0,
            PLATFORM: 1,
            START: 2,
            FINISH: 3,
            RED: 4,
            GREEN: 5,
            YELLOW: 6,
            BLUE: 7
        },
        BLOCK_TYPES_INVERTED = _(BLOCK_TYPES).invert();

    var Scene = function(babylonScene) {
        this._scene = babylonScene;
        this._player = null;
        this._grid = {};

        this.setupGrid();
    };
    _(Scene.prototype).extend({
        getGrid: function() {
            return {};
        },

        setupGrid: function() {
            var maxX = 0,
                maxY = 0,
                self = this;
            _(this.getGrid()).each(function(row, y) {
                _(row).each(function(block, x) {
                    if (!self._grid[x]) {
                        self._grid[x] = {};
                    }

                    switch (block) {
                        case BLOCK_TYPES.PLAYER:
                            self.addPlayer(new Babylon.Vector2(x, y));
                            break;

                        case BLOCK_TYPES.PLATFORM:
                            self.addPlatformBlock(new Babylon.Vector2(x, y));
                            break;

                        case BLOCK_TYPES.RED:
                        case BLOCK_TYPES.GREEN:
                        case BLOCK_TYPES.YELLOW:
                        case BLOCK_TYPES.BLUE:
                            var color = BLOCK_TYPES_INVERTED[block];
                            self.addColorBlock(color, new Babylon.Vector2(x, y));
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

            for (var x = 0; x < maxX; x++) {
                if (!this._grid[x]) {
                    this._grid[x] = {};
                }
                for (var y = 0; y < maxY; y++) {
                    if (!this._grid[x][y]) {
                        this._grid[x][y] = null;
                    }
                }
            }
        },

        getPlayer: function() {
            return this._player;
        },

        addPlayer: function(position) {
            if (this._player) {
                throw "Multiple players defined";
            }

            this._player = new Player(this._scene);
            this._player.setPosition(this._getPosition(position));
        },

        addColorBlock: function(color, position) {
            var block = Babylon.Mesh.CreateBox('', BLOCK_SIZE, this._scene);
            block.material = new Babylon.StandardMaterial('', this._scene);
            block.material.emissiveColor = BLOCK_COLORS[color];
            block.position = this._getPosition(position);
            block.checkCollisions = true;
            block.movable = true;

            this._grid[position.x][position.y] = block;
        },

        addPlatformBlock: function(position) {
            var block = Babylon.Mesh.CreateBox('', BLOCK_SIZE, this._scene);
            block.material = new Babylon.StandardMaterial('', this._scene);
            //block.material.emissiveColor = new Babylon.Color3(0, 0, 0);
            block.position = this._getPosition(position);
            block.checkCollisions = true;
            block.movable = false;

            this._grid[position.x][position.y] = block;
        },

        _getPosition: function(position) {
            return new Babylon.Vector3(position.x * BLOCK_SIZE, position.y * BLOCK_SIZE, 0);
        }
    });
    _(Scene).extend({
        BLOCK_COLORS: BLOCK_COLORS,
        BLOCK_TYPES: BLOCK_TYPES
    });



    return Scene;
});
