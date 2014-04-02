define('levels/1',
    ['game/level', 'babylon', 'underscore'],
    function(Level) {

    var Level1 = Level.extend({
        getGrid: function() {
            return {
                3: {
                    2:  Level.BLOCK_TYPES.PLAYER,
                    5:  Level.BLOCK_TYPES.YELLOW,
                    6:  Level.BLOCK_TYPES.BLUE,
                    7:  Level.BLOCK_TYPES.RED,
                    11: Level.BLOCK_TYPES.RED,
                    12: Level.BLOCK_TYPES.BLUE,
                    13: Level.BLOCK_TYPES.YELLOW
                },
                2: {
                    2:  Level.BLOCK_TYPES.PLATFORM,
                    3:  Level.BLOCK_TYPES.PLATFORM,
                    4:  Level.BLOCK_TYPES.PLATFORM,
                    5:  Level.BLOCK_TYPES.PLATFORM,
                    6:  Level.BLOCK_TYPES.PLATFORM,
                    7:  Level.BLOCK_TYPES.PLATFORM,
                    8:  Level.BLOCK_TYPES.PLATFORM,
                    9:  Level.BLOCK_TYPES.PLATFORM,
                    10: Level.BLOCK_TYPES.PLATFORM,
                    11: Level.BLOCK_TYPES.PLATFORM,
                    12: Level.BLOCK_TYPES.PLATFORM,
                    13: Level.BLOCK_TYPES.PLATFORM,
                    14: Level.BLOCK_TYPES.PLATFORM,
                    15: Level.BLOCK_TYPES.PLATFORM,
                    16: Level.BLOCK_TYPES.PLATFORM,
                    17: Level.BLOCK_TYPES.PLATFORM,
                    18: Level.BLOCK_TYPES.PLATFORM
                }
            };
        }
    });

    return function(engine) {
        engine.createScene(function(scene) {
            (new Level1(scene)).setupGrid();
        });
    };
});
