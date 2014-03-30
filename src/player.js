define('player', ['babylon', 'underscore', 'events'], function(Babylon, _, events) {
    var SPEED = 0.75,
        BLOCK_SIZE = 10;


    var Player = function(scene) {
        this._scene = scene;

        this._mesh = Babylon.Mesh.CreateBox('Player', 10, scene);
        this._mesh.scaling = new Babylon.Vector3(0.5, 0.8, 0.2);
        this._mesh.checkCollisions = true;

        this._jump = new Babylon.Animation(
            'jump',
            'position.y',
            30,
            Babylon.Animation.ANIMATIONTYPE_FLOAT,
            Babylon.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        this._mesh.animations.push(this._jump);

        this.setupKeyboard();
    };
    _(Player.prototype).extend({
        setupKeyboard: function() {
            var self = this,
                moveRight = false,
                moveLeft = false,
                jumping = false;


            window.addEventListener('keydown', function(event) {
                switch(event.keyCode) {
                    case events.KEYS.A:
                        moveLeft = true;
                        break;

                    case events.KEYS.D:
                        moveRight = true;
                        break;

                    case events.KEYS.W:
                        if (!jumping) {
                            jumping = true;
                            self._jump.setKeys([
                                {frame: 0, value: self._mesh.position.y},
                                {frame: 30, value: self._mesh.position.y + BLOCK_SIZE},
                                {frame: 50, value: self._mesh.position.y + BLOCK_SIZE * 1.25},
                                {frame: 80, value: self._mesh.position.y + BLOCK_SIZE},
                                {frame: 100, value: self._mesh.position.y}
                            ]);
                            self._scene.beginAnimation(self._mesh, 0, 100, false, 7.5, function() {
                                jumping = false;
                            });
                        }
                        break;
                }
            });

            window.addEventListener('keyup', function(event) {
                switch(event.keyCode) {
                    case events.KEYS.A:
                        moveLeft = false;
                        break;

                    case events.KEYS.D:
                        moveRight = false;
                        break;
                }
            });

            this._scene.registerBeforeRender(function() {
                if (moveRight) {
                    self._mesh.position.x += SPEED;
                } else if (moveLeft) {
                    self._mesh.position.x -= SPEED;
                }
            });
        },

        getMesh: function() {
            return this._mesh;
        },

        setPosition: function(vector) {
            this._mesh.position = vector;
        }
    });

    return Player;
});
