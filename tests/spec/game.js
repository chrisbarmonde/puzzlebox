define('spec/game',
    ['game', 'game/config', 'babylon', 'jasmine'],
    function(game, config, Babylon, jasmine) {
    beforeEach(function() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1024;
        this.canvas.height = 768;
        document.body.appendChild(this.canvas);
    });

    afterEach(function() {
        document.body.removeChild(this.canvas);
    });

    describe('Game', function() {
        it('fails if not supported', function() {
            spyOn(Babylon.Engine, 'isSupported').and.returnValue(false);
            expect(game.create()).toBe(false);
        });

        it('creates an engine', function() {
            var puzzlebox = game.create(this.canvas);
            expect(puzzlebox.getEngine()).toEqual(jasmine.any(Babylon.Engine));
        });

        it('resizes when the window resizes', function() {
            var puzzlebox = game.create(this.canvas);
            spyOn(puzzlebox.getEngine(), 'resize');

            window.dispatchEvent(new window.Event('resize'));
            expect(puzzlebox.getEngine().resize).toHaveBeenCalled();
        });

        describe('Game.createScene', function() {
            beforeEach(function() {
                this.puzzlebox = game.create(this.canvas);
                this.callback = jasmine.createSpy('callback');
            });

            it('creates a scene and allows customization', function() {
                var scene = this.puzzlebox.createScene(this.callback);
                expect(scene).toEqual(jasmine.any(Babylon.Scene));
                expect(this.callback).toHaveBeenCalledWith(scene);
            });

            it('creates a limited free camera', function() {
                var scene = this.puzzlebox.createScene(this.callback);
                expect(scene.activeCamera).toEqual(jasmine.any(Babylon.FreeCamera));
                expect(scene.activeCamera.keysUp.length).toBe(0);
                expect(scene.activeCamera.keysRight.length).toBe(0);
                expect(scene.activeCamera.keysDown.length).toBe(0);
                expect(scene.activeCamera.keysLeft.length).toBe(0);
                expect(scene.activeCamera.angularSensibility).toBe(10000000);
            });

            it('attaches control to the camera', function() {
                spyOn(this.puzzlebox, '_createCamera').and.callFake(function(scene) {
                    var camera = new Babylon.FreeCamera(
                        'Camera', new Babylon.Vector3.Zero(), scene
                    );
                    spyOn(camera, 'attachControl');
                    return camera;
                });

                var scene = this.puzzlebox.createScene(this.callback);
                expect(scene.activeCamera.attachControl).toHaveBeenCalledWith(this.canvas, true);
            });

            it('creates a point light', function() {
                var scene = this.puzzlebox.createScene(this.callback);
                expect(scene.lights.length).toBe(1);
                expect(scene.lights[0]).toEqual(jasmine.any(Babylon.PointLight));
            });

            it('enables configured gravity', function() {
                var scene = this.puzzlebox.createScene(this.callback);
                expect(scene.gravity).toEqual(jasmine.objectContaining({
                    x: 0,
                    y: config.GRAVITY,
                    z: 0
                }));
            });

            it('enables collisions', function() {
                var scene = this.puzzlebox.createScene(this.callback);
                expect(scene.collisionsEnabled).toBe(true);
            });
        });
    });
});
