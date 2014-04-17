define('debug/game/player',
        ['game/player', 'game/config', 'babylon'],
        function(Player, config, Babylon) {

    var DebugPlayer = Player.extend({
        setupBody: function() {
            Player.prototype.setupBody.apply(this, arguments);
            this._body.material.alpha = 0.75;
        },

        _syncPositions: function() {
            Player.prototype._syncPositions.apply(this, arguments);

            // Show our ellipsoid
            if (!this.ellipsoid) {
                this.ellipsoid = Babylon.Mesh.CreateSphere(
                    'Ellip', 20, 1, this._level._scene);
                this.ellipsoid.scaling = new Babylon.Vector3(
                    config.PLAYER.SIZE.WIDTH,
                    config.PLAYER.SIZE.HEIGHT,
                    config.PLAYER.SIZE.LENGTH
                );

                this.ellipsoid.material = new Babylon.StandardMaterial(
                    'MatEllip', this._level._scene);
                this.ellipsoid.material.diffuseColor =
                    this.ellipsoid.material.specularColor =
                    this.ellipsoid.material.emissiveColor =
                        new Babylon.Color4(1, 1, 1, 0.5);
            }
            this.ellipsoid.position.x = this._camera.position.x;
            this.ellipsoid.position.y = this._camera.position.y;


            this._body.material.diffuseTexture.drawText(
                this._body.position.x.toFixed(2) + ', ' + this._body.position.y.toFixed(2),
                null, 20, '20px Arial', "#fff", '#000'
            );

            this._body.material.diffuseTexture.drawText(
                this._camera._collider.basePoint.x.toFixed(2)
                    + ', ' + this._camera._collider.basePoint.y.toFixed(2),
                null, 50, '20px Arial', "#fff", null
            );
        }
    });

    return DebugPlayer;
});
