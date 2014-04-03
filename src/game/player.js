define('game/player',
    ['game/config', 'util/events', 'babylon', 'underscore'],
    function(config, events, Babylon, _) {

    var DIRECTIONS = {
        UP: 1,
        RIGHT: 2,
        DOWN: 4,
        LEFT: 8
    };

    var PlayerCamera = Babylon.FreeCamera.extend({
        manualInputs: function(direction) {
            if (!this._localDirection) {
                this._localDirection = Babylon.Vector3.Zero();
                this._transformedDirection = Babylon.Vector3.Zero();
            }

            if (direction === 0) {
                return;
            }

            //var speed = this._computeLocalCameraSpeed();

            var x = 0, y = 0, z = 0;
            if (direction & DIRECTIONS.RIGHT) {
                x = config.PLAYER.MOVEMENT.WALK_SPEED;
            } else if (direction & DIRECTIONS.LEFT) {
                x = -config.PLAYER.MOVEMENT.WALK_SPEED;
            }
            if (direction & DIRECTIONS.UP) {
                y = config.PLAYER.MOVEMENT.JUMP.SPEED;
            } else if (direction & DIRECTIONS.DOWN) {
                y = -config.PLAYER.MOVEMENT.JUMP.SPEED;
            }

            this._localDirection.copyFromFloats(x, y, z);

            this.getViewMatrix().invertToRef(this._cameraTransformMatrix);
            Babylon.Vector3.TransformNormalToRef(
                this._localDirection,
                this._cameraTransformMatrix,
                this._transformedDirection
            );
            this.cameraDirection.addInPlace(this._transformedDirection);
        },

        manualUpdate: function(direction) {
            this.manualInputs(direction);

            var needToMove = (this._needMoveForGravity
                || Math.abs(this.cameraDirection.x) > 0
                || Math.abs(this.cameraDirection.y) > 0
                || Math.abs(this.cameraDirection.z) > 0);

            // Move
            if (needToMove) {
                if (this.checkCollisions && this._scene.collisionsEnabled) {
                    this._collideWithWorld(this.cameraDirection);

                    if (this.applyGravity) {
                        var oldPosition = this.position;
                        this._collideWithWorld(this._scene.gravity);
                        this._needMoveForGravity =
                            (Babylon.Vector3.DistanceSquared(oldPosition, this.position) !== 0);
                    }
                } else {
                    this.position.addInPlace(this.cameraDirection);
                }

                if (Math.abs(this.cameraDirection.x) < Babylon.Engine.epsilon) {
                    this.cameraDirection.x = 0;
                }

                if (Math.abs(this.cameraDirection.y) < Babylon.Engine.epsilon) {
                    this.cameraDirection.y = 0;
                }

                if (Math.abs(this.cameraDirection.z) < Babylon.Engine.epsilon) {
                    this.cameraDirection.z = 0;
                }

                this.cameraDirection.scaleInPlace(this.inertia);
            }
        },

        _collideWithWorld: function (velocity) {
            this._oldPosition = this.position.clone();
            this._collider.radius = this.ellipsoid;

            this._scene._getNewPosition(
                this._oldPosition,
                velocity,
                this._collider,
                3,
                this._newPosition
            );
            this._newPosition.subtractToRef(this._oldPosition, this._diffPosition);

            if (this._diffPosition.length() > Babylon.Engine.collisionsEpsilon) {
                this.position.addInPlace(this._diffPosition);
                if (this.onCollide) {
                    if (this._collider.collisionFound) {
                        var mesh = (this._collider.collisionFound)
                            ? this._collider.collidedMesh
                            : null;

                        if (config.DEBUG) {
                            if (this.hMesh) {
                                this.hMesh.material.emissiveColor = this.hMesh.material.oColor;
                            }

                            this.hMesh = mesh;
                            this.hMesh.material.oColor = this.hMesh.material.emissiveColor;
                            this.hMesh.material.emissiveColor = new Babylon.Color4(1, 1, 0, 0.5);
                        }

                        var direction = 0;
                        if (this._collider.normalizedVelocity.x < 0) {
                            direction = DIRECTIONS.LEFT;
                        } else if (this._collider.normalizedVelocity.x > 0) {
                            direction = DIRECTIONS.RIGHT;
                        } else if (this._collider.normalizedVelocity.y < 0) {
                            direction = DIRECTIONS.DOWN;
                        } else if (this._collider.normalizedVelocity.y > 0) {
                            direction = DIRECTIONS.UP;
                        }

                        this.onCollide(mesh, direction);
                    }
                }
            }
        }
    });


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

        this._facingDirection = DIRECTIONS.RIGHT;
        this._gridPosition = null;
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
                jumpStart = 0,
                grabbing = false,
                grabbedBox = null;

            var startJump = function() {
                jumping = true;
                falling = false;
                jumpStart = self._camera.position.y;
            };

            window.addEventListener('keydown', function(event) {
                switch(event.keyCode) {
                    case events.KEYS.A:
                        moveLeft = true;
                        direction = DIRECTIONS.LEFT;
                        break;

                    case events.KEYS.D:
                        moveRight = true;
                        direction = DIRECTIONS.RIGHT;
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
                        direction = (moveRight) ? DIRECTIONS.RIGHT : 0;
                        break;

                    case events.KEYS.D:
                        moveRight = false;
                        direction = (moveLeft) ? DIRECTIONS.LEFT : 0;
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
                        jumpDirection = DIRECTIONS.UP;
                    } else {
                        falling = true;
                    }
                }

                if (direction) {
                    self._facingDirection = direction;
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
                self._level._scene.activeCamera.position.y = self._body.position.y;
                self._level._scene.activeCamera.setTarget(self._body.position);

                if (self._camera.position.y < -50) {
                    self._camera.position = self.originalPosition.clone();
                    jumping = falling = false;
                }
            });

            this._camera.onCollide = function(mesh, direction) {
                if (mesh) {
                    if (jumping && direction === DIRECTIONS.UP) {
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

        getMesh: function() {
            return this._body;
        },

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

        getGridPosition: function() {
            return new Babylon.Vector2(
                // @TODO move this calc to Level
                Math.round(this._camera.position.x / config.BLOCK_SIZE),
                Math.round(this._camera.position.y / config.BLOCK_SIZE)
            );
        }
    });

    return Player;
});
