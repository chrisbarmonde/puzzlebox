define('game/player/camera',
    ['game/config', 'game/constants', 'babylon'],
    function(config, constants, Babylon) {

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
            if (direction & constants.DIRECTIONS.RIGHT) {
                x = config.PLAYER.MOVEMENT.WALK_SPEED;
            } else if (direction & constants.DIRECTIONS.LEFT) {
                x = -config.PLAYER.MOVEMENT.WALK_SPEED;
            }
            if (direction & constants.DIRECTIONS.UP) {
                y = config.PLAYER.MOVEMENT.JUMP.SPEED;
            } else if (direction & constants.DIRECTIONS.DOWN) {
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
                            direction = constants.DIRECTIONS.LEFT;
                        } else if (this._collider.normalizedVelocity.x > 0) {
                            direction = constants.DIRECTIONS.RIGHT;
                        } else if (this._collider.normalizedVelocity.y < 0) {
                            direction = constants.DIRECTIONS.DOWN;
                        } else if (this._collider.normalizedVelocity.y > 0) {
                            direction = constants.DIRECTIONS.UP;
                        }

                        this.onCollide(mesh, direction);
                    }
                }
            }
        }
    });

    return PlayerCamera;
});