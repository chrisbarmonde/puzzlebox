define('game', ['babylon', 'config', 'underscore', 'events'], function(Babylon, config, _, events) {
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
            var scene = new Babylon.Scene(this.getEngine()),
                light = new Babylon.PointLight('Light', new Babylon.Vector3(0, 0, -75.0), scene),
                //camera = new Babylon.ArcRotateCamera('Camera', 0, 0.8, 100, new Babylon.Vector3(150, 50, -50.0), scene);
                camera = new Babylon.FreeCamera('Camera', new Babylon.Vector3(0, 0, -200.0), scene);
            camera.keysDown = camera.keysUp = camera.keysRight = camera.keysLeft = [];
            camera.angularSensibility = 10000000;

            scene.gravity = new Babylon.Vector3(0, config.GRAVITY, 0);
            scene.collisionsEnabled = true;

            onCreate(scene);

            scene.activeCamera.attachControl(this._canvas, true);
            this.getEngine().runRenderLoop(function() {
                scene.render();
            });

            return scene;
        }
    });

    return {
        create: function(canvas, scene) {
            if (!Babylon.Engine.isSupported()) {
                return false;
            }

            return new PuzzleBox(canvas);
        }
    };
});
