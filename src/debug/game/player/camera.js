define('debug/game/player/camera', ['game/player/camera', 'babylon'], function(PlayerCamera, Babylon) {
    var DebugCamera = PlayerCamera.extend({
        _getCollidedMesh: function() {
            var mesh = this._collider.collidedMesh;

            // Highlight the mesh we collided with
            if (this.hMesh) {
                this.hMesh.material.emissiveColor = this.hMesh.material.oColor;
            }

            this.hMesh = mesh;
            this.hMesh.material.oColor = this.hMesh.material.emissiveColor;
            this.hMesh.material.emissiveColor = new Babylon.Color4(1, 1, 1, 0.25);

            return mesh;
        }
    });

    return DebugCamera;
});
