define('game/config', function() {
    return {
        DEBUG: true,
        PLAYER: {
            MOVEMENT: {
                WALK_SPEED: 0.1,
                JUMP: {
                    HEIGHT: 4.25,
                    SPEED: 0.8
                }
            },
            SIZE: {
                WIDTH:  5,
                HEIGHT: 8,
                LENGTH: 2
            }
        },
        BLOCK_SIZE: 10,
        GRAVITY: -2.0
    };
});
