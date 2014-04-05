define('game',
    ['game/config', 'babylon', 'underscore'],
    function(config, Babylon, _) {
    var PuzzleBox = function(canvas) {
        var engine = new Babylon.Engine(canvas, true);

        window.addEventListener('resize', function() {
            engine.resize();
        });

        this._canvas = canvas;
        this._engine = engine;
    };
    _(PuzzleBox.prototype).extend({
        getEngine: function() {
            return this._engine;
        },

        createScene: function(onCreate) {
            var scene = new Babylon.Scene(this.getEngine());
            this._createCamera(scene);
            scene.activeLight = this._createLight(scene);

            scene.gravity = new Babylon.Vector3(0, config.GRAVITY, 0);
            scene.collisionsEnabled = true;
            scene.activeCamera.attachControl(this._canvas, true);

            onCreate(scene);

            this.getEngine().runRenderLoop(function() {
                scene.render();
            });

            return scene;
        },

        _createCamera: function(scene) {
            /*var camera = new Babylon.ArcRotateCamera(
            'Camera', 0, 0.8, 100, new Babylon.Vector3(150, 50, -50.0), scene);
             */
            var camera = new Babylon.FreeCamera(
                    'Camera',
                    new Babylon.Vector3(0, 0, -100.0),
                    scene
                );
            camera.keysDown = camera.keysUp = camera.keysRight = camera.keysLeft = [];
            camera.angularSensibility = 10000000;
            return camera;
        },

        _createLight: function(scene) {
            var light = new Babylon.PointLight('Light', new Babylon.Vector3(0, 0, -75.0), scene);
            light.intensity = 0.5;
            light.specular = new Babylon.Color4(0, 0, 0.5, 0.5);
            return light;
        }
    });

    return {
        create: function(canvas) {
            if (!Babylon.Engine.isSupported()) {
                return false;
            }

            return new PuzzleBox(canvas);
        }
    };
});
