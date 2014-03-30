define('scenes/level1', ['babylon', 'scene', 'underscore'], function(Babylon, Scene, _) {
    var Level1 = Scene.extend({
        getGrid: function() {
            return {
                3: {
                    2: Scene.BLOCK_TYPES.PLAYER,
                    5:  Scene.BLOCK_TYPES.YELLOW,
                    6:  Scene.BLOCK_TYPES.BLUE,
                    7:  Scene.BLOCK_TYPES.RED,
                    11:  Scene.BLOCK_TYPES.RED,
                    12: Scene.BLOCK_TYPES.BLUE,
                    13: Scene.BLOCK_TYPES.YELLOW
                },
                2: {
                    2:  Scene.BLOCK_TYPES.PLATFORM,
                    3:  Scene.BLOCK_TYPES.PLATFORM,
                    4:  Scene.BLOCK_TYPES.PLATFORM,
                    5:  Scene.BLOCK_TYPES.PLATFORM,
                    6:  Scene.BLOCK_TYPES.PLATFORM,
                    7:  Scene.BLOCK_TYPES.PLATFORM,
                    8:  Scene.BLOCK_TYPES.PLATFORM,
                    9:  Scene.BLOCK_TYPES.PLATFORM,
                    10: Scene.BLOCK_TYPES.PLATFORM,
                    11: Scene.BLOCK_TYPES.PLATFORM,
                    12: Scene.BLOCK_TYPES.PLATFORM,
                    13: Scene.BLOCK_TYPES.PLATFORM,
                    14: Scene.BLOCK_TYPES.PLATFORM,
                    15: Scene.BLOCK_TYPES.PLATFORM,
                    16: Scene.BLOCK_TYPES.PLATFORM,
                    17: Scene.BLOCK_TYPES.PLATFORM,
                    18: Scene.BLOCK_TYPES.PLATFORM
                }
            };
        }
    });

    return function(engine) {
        engine.createScene(function(scene) {
            var level = new Level1(scene);
        });
    };
});
