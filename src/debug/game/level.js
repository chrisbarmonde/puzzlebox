define('debug/game/level', ['game/level', 'babylon'], function(Level, Babylon) {

    var DebugLevel = Level.extend({
        setupGrid: function(gridData) {
            Level.prototype.setupGrid.call(this, gridData);

            var getHex = function(color) {
                var h = (color * 255).toString(16);
                if (h.length === 1) {
                    h = '0' + h;
                }
                return h;
            };

            var self = this;
            this._scene.registerBeforeRender(function() {
                _(self._blocks).each(function(block) {
                    if (!block.material.diffuseTexture) {
                        block.material.diffuseColor = block.material.emissiveColor;
                        block.material.diffuseTexture = new Babylon.DynamicTexture(
                            'Tex' + block.name, 100, self._scene, true
                        );
                    }

                    var color = block.material.emissiveColor;
                    block.material.diffuseTexture.drawText(
                        block.position.x + ', ' + block.position.y,
                        null, 30, '30px Arial', "#000",
                        '#' + getHex(color.r) + getHex(color.g) + getHex(color.b)
                    );

                    if (block._positions) {
                        var height = 60,
                            subMesh = block.subMeshes[0];
                        _([16, 18, 19]).each(function(pos) {
                            var text = subMesh._lastColliderWorldVertices[pos].x.toFixed(2)
                                + ', ' + subMesh._lastColliderWorldVertices[pos].y.toFixed(2);
                            block.material.diffuseTexture.drawText(
                                text, null, height, '15px Arial', "#000", null
                            );
                            height += 15;
                        });

                    }
                });
            });
        }
    });

    return DebugLevel;
});
