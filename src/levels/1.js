define('levels/1',
    ['game/level', 'babylon', 'underscore'],
    function(Level) {

    var Level1 = Level.extend({
        getGrid: function() {
            return {
                5: {
                    9:  Level.BLOCK_TYPES.BLUE,
                    10: Level.BLOCK_TYPES.RED,
                    11: Level.BLOCK_TYPES.GREEN,
                    12: Level.BLOCK_TYPES.YELLOW,

                    18: Level.BLOCK_TYPES.BLUE,
                    19: Level.BLOCK_TYPES.RED,
                    20: Level.BLOCK_TYPES.GREEN,
                    21: Level.BLOCK_TYPES.YELLOW
                },
                4: {
                    8:  Level.BLOCK_TYPES.PLATFORM_THIN,
                    9:  Level.BLOCK_TYPES.PLATFORM_THIN,
                    10: Level.BLOCK_TYPES.PLATFORM_THIN,
                    11: Level.BLOCK_TYPES.PLATFORM_THIN,
                    12: Level.BLOCK_TYPES.PLATFORM_THIN,
                    13: Level.BLOCK_TYPES.PLATFORM_THIN,
                    14: Level.BLOCK_TYPES.PLATFORM_THIN,

                    16: Level.BLOCK_TYPES.PLATFORM_THIN,
                    17: Level.BLOCK_TYPES.PLATFORM_THIN,
                    18: Level.BLOCK_TYPES.PLATFORM_THIN,
                    19: Level.BLOCK_TYPES.PLATFORM_THIN,
                    20: Level.BLOCK_TYPES.PLATFORM_THIN,
                    21: Level.BLOCK_TYPES.PLATFORM_THIN,
                    22: Level.BLOCK_TYPES.PLATFORM_THIN
                },
                3: {
                    3:  Level.BLOCK_TYPES.START,
                    4:  Level.BLOCK_TYPES.PLAYER,
                    6:  Level.BLOCK_TYPES.PLATFORM,
                    24: Level.BLOCK_TYPES.PLATFORM,
                    27: Level.BLOCK_TYPES.END
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

                    11: Level.BLOCK_TYPES.PLATFORM,
                    12: Level.BLOCK_TYPES.PLATFORM,
                    13: Level.BLOCK_TYPES.PLATFORM,

                    17: Level.BLOCK_TYPES.PLATFORM,
                    18: Level.BLOCK_TYPES.PLATFORM,
                    19: Level.BLOCK_TYPES.PLATFORM,

                    21: Level.BLOCK_TYPES.PLATFORM,
                    22: Level.BLOCK_TYPES.PLATFORM,
                    23: Level.BLOCK_TYPES.PLATFORM,
                    24: Level.BLOCK_TYPES.PLATFORM,
                    25: Level.BLOCK_TYPES.PLATFORM,
                    26: Level.BLOCK_TYPES.PLATFORM,
                    27: Level.BLOCK_TYPES.PLATFORM,
                    28: Level.BLOCK_TYPES.PLATFORM
                },
                1: {
                    9:  Level.BLOCK_TYPES.PLATFORM,
                    10: Level.BLOCK_TYPES.PLATFORM,
                    11: Level.BLOCK_TYPES.PLATFORM,

                    13: Level.BLOCK_TYPES.PLATFORM,
                    14: Level.BLOCK_TYPES.PLATFORM,
                    15: Level.BLOCK_TYPES.PLATFORM,
                    16: Level.BLOCK_TYPES.PLATFORM,
                    17: Level.BLOCK_TYPES.PLATFORM,

                    19: Level.BLOCK_TYPES.PLATFORM,
                    20: Level.BLOCK_TYPES.PLATFORM,
                    21: Level.BLOCK_TYPES.PLATFORM
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
