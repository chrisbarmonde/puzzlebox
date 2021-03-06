define('game/player',
    ['game/config', 'game/constants', 'game/player/camera',
     'util/events', 'babylon', 'underscore'],
    function(config, constants, PlayerCamera,
             events, Babylon, _) {

    var Player = function(level) {
        this._level = level;
        this._directionFacing = constants.DIRECTIONS.RIGHT;

        this.setupBody();
    };
    _(Player.prototype).extend({
        /**
         * Sets up the 'body' that represents our player
         */
        setupBody: function() {
            this._body = Babylon.Mesh.CreateBox('PlayerBody', 1, this._level._scene);
            this._body.scaling = new Babylon.Vector3(
                config.PLAYER.SIZE.WIDTH,
                config.PLAYER.SIZE.HEIGHT,
                config.PLAYER.SIZE.LENGTH
            );
            this._body.material =
                new Babylon.StandardMaterial('PlayerMateria', this._level._scene);
            this._body.material.diffuseColor = new Babylon.Color3(0.5, 0.5, 0.5);
            this._body.material.alpha = 1;
        },

        setupKeyboard: function() {
            var self = this,
                moveRight = false,
                moveLeft = false,
                moveUp = false,
                direction = 0,
                jumping = false,
                falling = false,
                jumpStart = 0,
                movingBlock = false,
                blockBeingMoved = null,
                blockStart = null,
                blockAnimating = false;

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
                        if (!jumping && !falling && !movingBlock) {
                            startJump();
                        }
                        break;

                    case events.KEYS.SPACE:
                        event.preventDefault();

                        if (!movingBlock && self._level.isPlayerNextToMovableBlock()) {
                            blockBeingMoved = self._level.getBlockNextToPlayer();
                            blockStart = blockBeingMoved.position.clone();
                            movingBlock = true;
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

                        if (movingBlock) {
                            movingBlock = false;
                        }
                        break;
                }
            });

            this._level._scene.registerBeforeRender(function() {
                var startPosition = self._camera.position.clone(),
                    jumpDirection = 0,
                    forceDirection = direction;

                if (jumping) {
                    var jumpDiff = startPosition.y - jumpStart;
                    if (!falling && jumpDiff < config.PLAYER.MOVEMENT.JUMP.HEIGHT) {
                        jumpDirection = constants.DIRECTIONS.UP;
                    } else {
                        falling = true;
                    }
                }

                if (blockAnimating) {
                    forceDirection = self._directionFacing;
                } else if (movingBlock) {
                    forceDirection = 0;
                } else {
                    blockBeingMoved = null;
                    blockStart = null;
                }

                if (direction && !blockAnimating) {
                    self._directionFacing = direction;

                    if (movingBlock && self._level.canMoveBlock(blockBeingMoved, direction)) {
                        blockAnimating = direction;
                    }
                }

                if (blockAnimating) {
                    var xPos = config.BLOCK_SIZE / (2 * config.FPS),
                        modifier = config.BLOCK_SIZE;

                    if (blockAnimating === constants.DIRECTIONS.LEFT) {
                        xPos *= -1;
                        modifier *= -1;
                    }

                    if (Math.abs(blockBeingMoved.position.x + xPos - blockStart.x) >= config.BLOCK_SIZE) {
                        self._camera.position.x += (blockStart.x + modifier) - blockBeingMoved.position.x;
                        blockBeingMoved.position.x = blockStart.x + modifier;

                        self._level.updateBlockCoordinates(blockBeingMoved);

                        blockAnimating = false;
                        blockStart = blockBeingMoved.position.clone();
                    } else {
                        self._camera.position.x += xPos;
                        blockBeingMoved.position.x += xPos;
                    }
                } else {
                    self._camera.manualUpdate(forceDirection | jumpDirection, blockAnimating);
                }

                self._syncPositions();

                if (self._camera.position.y < config.PLAYER.RESET_HEIGHT) {
                    self._camera.position = self.originalPosition.clone();
                    jumping = falling = false;
                }
            });

            this._camera.onCollide = function(mesh, direction) {
                if (mesh) {
                    if (jumping && (direction & constants.DIRECTIONS.UP)) {
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
         * Sync our body and camera positions so everything lines up as the
         * player moves around
         *
         * @private
         */
        _syncPositions: function() {
            // Make the player follow the camera
            this._body.position.x = this._camera.position.x;
            this._body.position.y = this._camera.position.y;

            this._level._scene.activeCamera.position.x = this._body.position.x;
            this._level._scene.activeCamera.position.y =
                this._body.position.y + config.CAMERA_HEIGHT;
            this._level._scene.activeCamera.setTarget(this._body.position);

            this._level._scene.activeLight.position =
                this._level._scene.activeCamera.position.clone();
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
