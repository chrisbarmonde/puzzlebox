define('scene', ['babylon', 'config', 'player', 'underscore'], function(Babylon, config, Player, _) {
    var BLOCK_COLORS = {
            BLACK:  new Babylon.Color3(0, 0, 0),
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

            var player = new Player(this._scene);

            position = this._getPosition(position);
            position.y -= config.GRAVITY;
            player.setPosition(position);

            this._player = player;
        },

        _addBlock: function(color, position, movable) {
            var block = Babylon.Mesh.CreateBox('Box' + position.x + position.y, config.BLOCK_SIZE, this._scene);
            block.material = new Babylon.StandardMaterial('', this._scene);
            block.material.emissiveColor = color;
            block.material.backFaceCulling = false;
            block.position = this._getPosition(position);
            block.checkCollisions = movable;//true;
            block.movable = movable;

            var plane = Babylon.Mesh.CreatePlane('Plane' + position.x + position.y, config.BLOCK_SIZE, this._scene);
            plane.parent = block;
            plane.position = new Babylon.Vector3(0, (config.BLOCK_SIZE / 2) + 0.1, 0);
            plane.material = new Babylon.StandardMaterial('', this._scene);
            plane.material.diffuseColor = plane.material.emissiveColor = new Babylon.Color3(1, 0, 0);
            plane.rotation = new Babylon.Vector3(Math.PI / 2, 0, 0);
            plane.checkCollisions = true;
            plane.plane = true;

            this._grid[position.x][position.y] = block;
            return block;
        },

        addColorBlock: function(color, position) {
            this._addBlock(BLOCK_COLORS[color], position, true);
        },

        addPlatformBlock: function(position) {
            var block = this._addBlock(BLOCK_COLORS.BLACK, position, false);
            block.material.diffuseColor = BLOCK_COLORS.BLACK;
        },

        _getPosition: function(position) {
            return new Babylon.Vector3(
                position.x * config.BLOCK_SIZE,
                position.y * config.BLOCK_SIZE,
                0
            );
        }
    });
    _(Scene).extend({
        BLOCK_COLORS: BLOCK_COLORS,
        BLOCK_TYPES: BLOCK_TYPES
    });



    return Scene;
});
