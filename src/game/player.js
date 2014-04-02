define('game/player',
    ['game/config', 'util/events', 'babylon', 'underscore'],
    function(config, events, Babylon, _) {

    var PlayerCamera = Babylon.FreeCamera.extend({
        DIRECTIONS: {
            UP: 1,
            RIGHT: 2,
            DOWN: 4,
            LEFT: 8
        },

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
            if (direction & this.DIRECTIONS.RIGHT) {
                x = config.PLAYER_SPEED;
            } else if (direction & this.DIRECTIONS.LEFT) {
                x = -config.PLAYER_SPEED;
            }
            if (direction & this.DIRECTIONS.UP) {
                y = config.JUMP_SPEED;
            } else if (direction & this.DIRECTIONS.DOWN) {
                y = -config.JUMP_SPEED;
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
            this.position.subtractFromFloatsToRef(0, this.ellipsoid.y, 0, this._oldPosition);
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
                    var mesh = (this._collider.collisionFound)
                        ? this._collider.collidedMesh
                        : null;
                    this.onCollide(mesh);
                }
            }
        }
    });


    var Player = function(scene) {
        this._scene = scene;

        this._body = Babylon.Mesh.CreateBox('PlayerBody', 10, scene._scene);
        this._body.scaling = new Babylon.Vector3(0.5, 0.8, 0.2);
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
                        direction = self._camera.DIRECTIONS.LEFT;
                        break;

                    case events.KEYS.D:
                        moveRight = true;
                        direction = self._camera.DIRECTIONS.RIGHT;
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
                        direction = (moveRight) ? self._camera.DIRECTIONS.RIGHT : 0;
                        break;

                    case events.KEYS.D:
                        moveRight = false;
                        direction = (moveLeft) ? self._camera.DIRECTIONS.LEFT : 0;
                        break;

                    case events.KEYS.W:
                        moveUp = false;
                        break;

                    case events.KEYS.SPACE:
                        if (grabbedBox) {
                            grabbing = !grabbing;
                            console.log("BOX", grabbing, grabbedBox);
                        }
                        event.preventDefault();
                        break;
                }
            });

            this._scene._scene.registerBeforeRender(function() {
                var jumpDirection = 0;
                if (jumping) {
                    if (!falling && self._camera.position.y - jumpStart < config.JUMP_HEIGHT) {
                        jumpDirection = self._camera.DIRECTIONS.UP;
                    } else {
                        falling = true;
                    }
                }

                self._camera.manualUpdate(direction | jumpDirection);
//
//                if (grabbing) {
//                    if (direction == self._camera.DIRECTIONS.RIGHT) {
//
//                    } else if (direction == self._camera.DIRECTIONS.LEFT) {
//
//                    }
//                }

                // Make the player follow the camera
                self._body.position.x = self._camera.position.x;
                self._body.position.y = self._camera.position.y;

                self._scene._scene.activeCamera.position.x = self._body.position.x;
                self._scene._scene.activeCamera.position.y = self._body.position.y + 50;
                self._scene._scene.activeCamera.setTarget(self._body.position);

                if (self._camera.position.y < -50) {
                    self._camera.position = self.originalPosition.clone();
                    jumping = falling = false;
                }
            });

            this._camera.onCollide = function(mesh) {
                if (mesh) {
                    if (mesh.plane) {
                        jumping = falling = false;
                        if (moveUp) {
                            startJump();
                        }
                    } else if (mesh.movable) {
                        grabbedBox = mesh;
                    }
                } else {
                    //console.log("no more collision");
                    grabbedBox = null;
                }
            };
        },

        getMesh: function() {
            return this._body;
        },

        setPosition: function(vector) {
            this.originalPosition = vector.clone();
            this._body.position = vector.clone();

            var boundingBox = this._body.getBoundingInfo().boundingBox.maximum.clone();

            this._camera = new PlayerCamera('BodyCam', this._body.position, this._scene._scene);
            this._camera.ellipsoid = boundingBox.divide(new Babylon.Vector3(2, 2, 2));
            this._camera.checkCollisions = true;
            this._camera.applyGravity = true;
            this._camera.keysUp = this._camera.keysDown = [];
            this._camera.keysLeft = [events.KEYS.A];
            this._camera.keysRight = [events.KEYS.D];

            this.setupKeyboard();
        }
    });

    return Player;
});
