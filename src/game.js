define('game', ['babylon', 'underscore', 'events'], function(Babylon, _, events) {
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
                camera = new Babylon.FreeCamera('Camera', new Babylon.Vector3(0, 0, -200.0), scene);
//            camera.keysDown = [events.KEYS.S];
//            camera.keysUp = [events.KEYS.W];
//            camera.keysRight.push(events.KEYS.D);
//            camera.keysLeft.push(events.KEYS.A);
            camera.keysDown = camera.keysUp = camera.keysRight = camera.keysLeft = [];
            camera.angularSensibility = 10000000;
            //this._engine.isPointerLock = true;

            scene.enablePhysics();
            scene.collisionsEnabled = true;

            onCreate(scene);

            scene.activeCamera.attachControl(this._canvas);
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
