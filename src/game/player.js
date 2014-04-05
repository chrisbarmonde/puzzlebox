define('game/player',
    ['game/config', 'game/constants', 'game/player/camera',
     'util/events', 'babylon', 'underscore'],
    function(config, constants, PlayerCamera,
             events, Babylon, _) {

    var Player = function(level) {
        this._level = level;

        this._body = Babylon.Mesh.CreateBox('PlayerBody', 1, level._scene);
        this._body.scaling = new Babylon.Vector3(
            config.PLAYER.SIZE.WIDTH,
            config.PLAYER.SIZE.HEIGHT,
            config.PLAYER.SIZE.LENGTH
        );
        this._body.material = new Babylon.StandardMaterial('PlayerMateria', level._scene);
        if (config.DEBUG) {
            this._body.material.alpha = 0.5;
        }

        this._directionFacing = constants.DIRECTIONS.RIGHT;
    };
    _(Player.prototype).extend({
        setupKeyboard: function() {
            var self = this,
                moveRight = false,
                moveLeft = false,
                moveUp = false,
                direction = 0,
                jumping = false,
                falling = false,
                jumpStart = 0;

            var startJump = function() {
                jumping = true;
                falling = false;
                jumpStart = self._camera.position.y;
            };

            window.addEventListener('keydown', function(event) {
                switch(event.keyCode) {
                    case events.KEYS.A:
                        moveLeft = true;
                        direction = constants.DIRECTIONS.LEFT;
                        break;

                    case events.KEYS.D:
                        moveRight = true;
                        direction = constants.DIRECTIONS.RIGHT;
                        break;

                    case events.KEYS.W:
                        moveUp = true;
                        if (!jumping && !falling) {
                            startJump();
                        }
                        break;
                }
            });

            window.addEventListener('keyup', function(event) {
                switch(event.keyCode) {
                    case events.KEYS.A:
                        moveLeft = false;
                        direction = (moveRight) ? constants.DIRECTIONS.RIGHT : 0;
                        break;

                    case events.KEYS.D:
                        moveRight = false;
                        direction = (moveLeft) ? constants.DIRECTIONS.LEFT : 0;
                        break;

                    case events.KEYS.W:
                        moveUp = false;
                        break;

                    case events.KEYS.SPACE:

                        event.preventDefault();
                        break;
                }
            });

            this._level._scene.registerBeforeRender(function() {
                var jumpDirection = 0;
                if (jumping) {
                    var jumpDiff = self._camera.position.y - jumpStart;
                    if (!falling && jumpDiff < config.PLAYER.MOVEMENT.JUMP.HEIGHT) {
                        jumpDirection = constants.DIRECTIONS.UP;
                    } else {
                        falling = true;
                    }
                }

                if (direction) {
                    self._directionFacing = direction;
                }

                self._camera.manualUpdate(direction | jumpDirection);

                // Make the player follow the camera
                self._body.position.x = self._camera.position.x;
                self._body.position.y = self._camera.position.y;

                if (config.DEBUG) {
                    if (!self.ellipsoid) {
                        self.ellipsoid = Babylon.Mesh.CreateSphere(
                            'Ellip', 20, 1, self._level._scene);
                        self.ellipsoid.scaling = new Babylon.Vector3(
                            config.PLAYER.SIZE.WIDTH,
                            config.PLAYER.SIZE.HEIGHT,
                            config.PLAYER.SIZE.LENGTH
                        );

                        self.ellipsoid.material = new Babylon.StandardMaterial(
                            '', self._level._scene);
                        self.ellipsoid.material.diffuseColor =
                            self.ellipsoid.material.specularColor =
                            self.ellipsoid.material.emissiveColor =
                                new Babylon.Color4(1, 1, 0, 0.5);
                    }
                    self.ellipsoid.position.x = self._camera.position.x;
                    self.ellipsoid.position.y = self._camera.position.y;
                }

                self._level._scene.activeCamera.position.x = self._body.position.x;
                self._level._scene.activeCamera.position.y =
                    self._body.position.y + config.CAMERA_HEIGHT;
                self._level._scene.activeCamera.setTarget(self._body.position);

                if (self._camera.position.y < config.PLAYER.RESET_HEIGHT) {
                    self._camera.position = self.originalPosition.clone();
                    jumping = falling = false;
                }
            });

            this._camera.onCollide = function(mesh, direction) {
                if (mesh) {
                    if (jumping && direction === constants.DIRECTIONS.UP) {
                        falling = true;
                    } else if (falling) {
                        jumping = falling = false;
                        if (moveUp) {
                            startJump();
                        }
                    }
                }
            };
        },

        /**
         * Return the mesh representing this player
         *
         * @returns {Babylon.Mesh}
         */
        getMesh: function() {
            return this._body;
        },

        /**
         * Return the player's position
         *
         * @returns {Babylon.Vector3}
         */
        getPosition: function() {
            return this._camera.position;
        },

        /**
         * Sets our players position on the board and creates the camera tied to the player.
         * This camera acts as the collision checker and 'body' for the player.
         *
         * @param {Babylon.Vector3} vector
         */
        setPosition: function(vector) {
            this.originalPosition = vector.clone();
            this._body.position = vector.clone();

            this._camera = new PlayerCamera('BodyCam', this._body.position, this._level._scene);
            this._camera.ellipsoid = new Babylon.Vector3(
                config.PLAYER.SIZE.WIDTH / 2,
                config.PLAYER.SIZE.HEIGHT / 2,
                config.PLAYER.SIZE.LENGTH / 2
            );
            this._camera.checkCollisions = true;
            this._camera.applyGravity = true;
            this._camera.keysUp = this._camera.keysDown = [];
            this._camera.keysLeft = [events.KEYS.A];
            this._camera.keysRight = [events.KEYS.D];

            this.setupKeyboard();
        },

        /**
         * Return the direction the player is facing
         *
         * @returns {int}
         */
        getDirectionFacing: function() {
            return this._directionFacing;
        }
    });

    return Player;
});
