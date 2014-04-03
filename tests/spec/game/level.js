define('spec/game/level',
    ['game/level', 'game/config', 'game/player', 'spec/util', 'babylon', 'jasmine'],
    function(Level, config, Player, util, Babylon, jasmine) {

    var FakeLevel = Level.extend({
        getGrid: function() {
            return {
                2: {
                    3: Level.BLOCK_TYPES.PLATFORM,
                    4: Level.BLOCK_TYPES.PLATFORM,
                    5: Level.BLOCK_TYPES.PLATFORM
                },
                3: {
                    4: Level.BLOCK_TYPES.RED,
                    5: Level.BLOCK_TYPES.PLAYER
                }
            };
        }
    });

    describe('Level', function() {
        util.createCanvas();

        beforeEach(function() {
            this.engine = new Babylon.Engine(this.canvas);
            this.scene = new Babylon.Scene(this.engine);
        });

        afterEach(function() {
            this.engine.dispose();
        });

        it('requires the grid to be specified', function() {
            var level = new Level(this.scene);
            expect(level.setupGrid).toThrow();
        });

        it('requires the grid to have a player', function() {
            var level = new FakeLevel(this.scene);
            level.getGrid = function() {
                return {1: {2: Level.BLOCK_TYPES.YELLOW}};
            };
            expect(level.setupGrid).toThrow();
        });

        it("doesn't allow more than one player", function() {
            var level = new FakeLevel(this.scene);
            level.getGrid = function() {
                return {
                    1: {
                        2: Level.BLOCK_TYPES.PLAYER,
                        7: Level.BLOCK_TYPES.PLAYER
                    }
                };
            };
            expect(level.setupGrid).toThrow();
        });

        it('returns the created player', function() {
            var level = new FakeLevel(this.scene);
            level.setupGrid();
            expect(level.getPlayer()).toEqual(jasmine.any(Player));
        });

        it('automatically sets up the grid', function() {
            var level = new FakeLevel(this.scene),
                grid = level.getGrid();
            level.setupGrid();
            _(level._grid).each(function(row, y) {
                _(row).each(function(block, x) {
                    if (grid[x] && grid[x][y]) {
                        expect(block).toEqual(jasmine.any(Babylon.Mesh));
                        expect(block._type).toBe(grid[x][y]);
                    } else {
                        expect(block).toBeNull();
                    }
                });

                expect(Object.keys(row).length).toBe(4);
            });

            expect(Object.keys(level._grid).length).toBe(6);
        });

        it('adjusts positions based on block size', function() {
            var level = new FakeLevel(this.scene),
                position = level._getPosition(new Babylon.Vector2(3, 5));
            expect(position.x).toBe(config.BLOCK_SIZE * 3);
            expect(position.y).toBe(config.BLOCK_SIZE * 5);
        });

        describe('Blocks', function() {
            var grid = {
                1: {
                    2: Level.BLOCK_TYPES.RED,
                    4: Level.BLOCK_TYPES.BLUE,
                    6: Level.BLOCK_TYPES.GREEN,
                    8: Level.BLOCK_TYPES.YELLOW
                },
                2: {
                    3: Level.BLOCK_TYPES.PLATFORM,
                    5: Level.BLOCK_TYPES.PLATFORM_THIN,
                    7: Level.BLOCK_TYPES.PLATFORM
                },
                3: {
                    5: Level.BLOCK_TYPES.PLAYER
                }
            };

            beforeEach(function() {
                this.level = new FakeLevel(this.scene);
                this.level.getGrid = function() {
                    return grid;
                };
                this.level.setupGrid();
            });

            it('makes color blocks', function() {
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

            it('makes platform blocks', function() {
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

                expect(count).toBe(2);
            });

            it('makes thin platform blocks', function() {
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
    });
});
