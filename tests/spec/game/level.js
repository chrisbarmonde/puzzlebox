define('spec/game/level',
    ['game/level', 'game/constants', 'game/config', 'game/player',
     'spec/util', 'babylon', 'jasmine'],
    function(Level, constants, config, Player,
             util, Babylon, jasmine) {

    var defaultGrid = [
        '   RS',
        '  PPP'
    ];

    describe('A Level', function() {
        util.createCanvas();

        beforeEach(function() {
            this.engine = new Babylon.Engine(this.canvas);
            this.scene = new Babylon.Scene(this.engine);
            this.level = new Level(this.scene);
            this.level.setupGrid(_.clone(defaultGrid));
        });

        afterEach(function() {
            this.engine.dispose();
        });


        it('returns the created player', function() {
            expect(this.level.getPlayer()).toEqual(jasmine.any(Player));
        });


        describe('has a grid', function() {
            it('that is required to be specified', function() {
                var level = new Level(this.scene);
                expect(level.setupGrid).toThrow();
            });

            it('that is required to have a start block', function() {
                var level = new Level(this.scene);
                expect(function() {
                    level.setupGrid(' Y');
                }).toThrow();
            });

            it("that doesn't allow more than one start block", function() {
                var level = new Level(this.scene);
                expect(function() {
                    level.setupGrid(' S    S');
                }).toThrow();
            });

            it('that is automatically generated', function() {
                var level = new Level(this.scene),
                    grid = _.clone(defaultGrid).reverse();
                level.setupGrid(_.clone(defaultGrid));
                _(level._grid).each(function(row, y) {
                    _(row).each(function(block, x) {
                        if (grid[x] && grid[x][y] !== ' ') {
                            expect(block).toEqual(jasmine.any(Babylon.Mesh));
                            expect(block._type).toBe(Level.BLOCK_MAP[grid[x][y]]);
                        } else {
                            expect(block).toBeNull();
                        }
                    });

                    expect(Object.keys(row).length).toBe(3);
                });

                expect(Object.keys(level._grid).length).toBe(5);
            });


            describe('that contains blocks', function() {
                beforeEach(function() {
                    this.level = new Level(this.scene);
                    this.level.setupGrid([
                        '    S',
                        '  P T P',
                        ' R B G Y'
                    ]);
                });

                it('of various colors', function() {
                    var count = 0;
                    _(this.level._grid).each(function(row) {
                        _(row).each(function(block) {
                            if (Level.isColorBlock(block)) {
                                ++count;
                                expect(block.movable).toBe(true);
                                expect(block.material.backFaceCulling).toBe(false);
                                expect(block.checkCollisions).toBe(true);

                                var type = Level.BLOCK_TYPES_INVERTED[block._type],
                                    color = Level.BLOCK_COLORS[type];
                                expect(block.material.emissiveColor).toEqual(
                                    jasmine.objectContaining({
                                        r: color.r,
                                        g: color.g,
                                        b: color.b
                                    })
                                );
                            }
                        });
                    });

                    expect(count).toBe(4);
                });

                it('that are platforms', function() {
                    var count = 0;
                    _(this.level._grid).each(function(row) {
                        _(row).each(function(block) {
                            if (Level.isPlatformBlock(block)) {
                                ++count;
                                expect(block.movable).toBe(false);
                                expect(block.material.backFaceCulling).toBe(false);
                                expect(block.checkCollisions).toBe(true);

                                var color = jasmine.objectContaining({
                                    r: 0,
                                    g: 0,
                                    b: 0
                                });
                                expect(block.material.emissiveColor).toEqual(color);
                                expect(block.material.diffuseColor).toEqual(color);
                            }
                        });
                    });

                    expect(count).toBe(3);
                });

                it('that are thin platforms', function() {
                    var count = 0;
                    _(this.level._grid).each(function(row) {
                        _(row).each(function(block) {
                            if (Level.isThinPlatformBlock(block)) {
                                ++count;
                                expect(block.movable).toBe(false);
                                expect(block.material.backFaceCulling).toBe(false);
                                expect(block.checkCollisions).toBe(true);

                                var color = jasmine.objectContaining({
                                    r: 0,
                                    g: 0,
                                    b: 0
                                });
                                expect(block.material.emissiveColor).toEqual(color);
                                expect(block.material.diffuseColor).toEqual(color);
                                expect(block.scaling).toEqual(jasmine.objectContaining({
                                    y: 0.25
                                }));
                            }
                        });
                    });

                    expect(count).toBe(1);
                });
            });

            it('that adjusts the initial block positions based on the block size', function() {
                var level = new Level(this.scene),
                    position = level._getBlockPosition(new Babylon.Vector2(3, 5));
                expect(position.x).toBe(config.BLOCK_SIZE * 3);
                expect(position.y).toBe(config.BLOCK_SIZE * 5);
            });


            it('that places the player above the start block', function() {
                // Starting block
                expect(this.level._grid[4][1]._type).toBe(Level.BLOCK_TYPES.PLATFORM);

                var coords = this.level.getPlayerCoordinates();
                expect(coords.x).toBe(4);
                expect(coords.y).toBe(2);
            });

            it('that can retrieve grid coordinates based on canvas position', function() {
                var pos = this.level._grid[2][0].position,
                    coords = this.level.getGridCoordinates(pos);

                expect(coords.x).toBe(2);
                expect(coords.y).toBe(0);
            });

            it('that can retrieve blocks at specific coordinates', function() {
                expect(this.level.getBlock(new Babylon.Vector2(2, 0)))
                    .toBe(this.level._grid[2][0]);
                expect(this.level.getBlock(new Babylon.Vector2(0, 0))).toBeNull();
            });

            it('that knows whether a block is movable or not', function() {
                expect(this.level.isMovableBlock(new Babylon.Vector2(0, 0))).toBe(false);
                expect(this.level.isMovableBlock(new Babylon.Vector2(2, 0))).toBe(false);
                expect(this.level.isMovableBlock(new Babylon.Vector2(3, 1))).toBe(true);
            });

            describe('that allows the player to move a block', function() {
                beforeEach(function() {
                    this.level = new Level(this.scene);
                    this.level.setupGrid([
                        ' S   RY B  G  R',
                        ' PPPPPPPP PPP PPP'
                    ]);
                });

                it("unless the block is falling", function() {
                    var green = this.level.getBlock(new Babylon.Vector2(11, 1));
                    green._falling = true;
                    expect(this.level.canMoveBlock(green, constants.DIRECTIONS.RIGHT)).toBe(false);
                    expect(this.level.canMoveBlock(green, constants.DIRECTIONS.LEFT)).toBe(false);
                });

                it("by pushing to the right", function() {
                    this.level.setPlayerCoords(new Babylon.Vector2(10, 1));
                    var green = this.level.getBlock(new Babylon.Vector2(11, 1));
                    expect(this.level.canMoveBlock(green, constants.DIRECTIONS.RIGHT)).toBe(true);
                });

                it("by pushing to the right, if there's no platform", function() {
                    this.level.setPlayerCoords(new Babylon.Vector2(7, 1));
                    var blue = this.level.getBlock(new Babylon.Vector2(8, 1));
                    expect(this.level.canMoveBlock(blue, constants.DIRECTIONS.RIGHT)).toBe(true);
                });

                it("by pushing to the left", function() {
                    this.level.setPlayerCoords(new Babylon.Vector2(12, 1));
                    var green = this.level.getBlock(new Babylon.Vector2(11, 1));
                    expect(this.level.canMoveBlock(green, constants.DIRECTIONS.LEFT)).toBe(true);
                });

                it("by pushing to the left, if there's no platform", function() {
                    this.level.setPlayerCoords(new Babylon.Vector2(15, 1));
                    var red2 = this.level.getBlock(new Babylon.Vector2(14, 1));
                    expect(this.level.canMoveBlock(red2, constants.DIRECTIONS.LEFT)).toBe(true);
                });

                it("by pulling to the right", function() {
                    this.level.setPlayerCoords(new Babylon.Vector2(15, 1));
                    var red2 = this.level.getBlock(new Babylon.Vector2(14, 1));
                    expect(this.level.canMoveBlock(red2, constants.DIRECTIONS.RIGHT)).toBe(true);
                });

                it("by pulling to the right, unless there is no platform", function() {
                    this.level.setPlayerCoords(new Babylon.Vector2(12, 1));
                    var red2 = this.level.getBlock(new Babylon.Vector2(11, 1));
                    expect(this.level.canMoveBlock(red2, constants.DIRECTIONS.RIGHT)).toBe(false);
                });

                it("by pulling to the left", function() {
                    this.level.setPlayerCoords(new Babylon.Vector2(4, 1));
                    var red = this.level.getBlock(new Babylon.Vector2(5, 1));
                    expect(this.level.canMoveBlock(red, constants.DIRECTIONS.LEFT)).toBe(true);
                });

                it("by pulling to the left, unless there is no platform", function() {
                    this.level.setPlayerCoords(new Babylon.Vector2(10, 1));
                    var red2 = this.level.getBlock(new Babylon.Vector2(11, 1));
                    expect(this.level.canMoveBlock(red2, constants.DIRECTIONS.LEFT)).toBe(false);
                });
            });

            describe("that allows for updating a block's coordinates", function() {
                beforeEach(function() {
                    this.level = new Level(this.scene);
                    this.level.setupGrid([
                        ' G     ',
                        'SP   Y ',
                        '   PPP ',
                        '      B',
                        ' PPPPPP'
                    ]);
                });
            });
        });


    });
});
