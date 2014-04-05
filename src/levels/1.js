define('levels/1',
    ['game/level', 'babylon', 'underscore'],
    function(Level) {

    var Level1 = Level.extend({
        getGrid: function() {
            return [
                '        BRGY     BRGY',
                '       TTTTTTT TTTTTTT',
                '  S  P                 P   E',
                ' PPPPPPPPP PPP   PPP PPPPPPPP',
                '         PPP PPPPP PPP'
            ];
        }
    });

    return function(engine) {
        engine.createScene(function(scene) {
            (new Level1(scene)).setupGrid();
        });
    };
});
