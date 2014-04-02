define('spec/util', function() {
    var canvas = document.createElement('canvas');

    return {
        createCanvas: function() {
            beforeEach(function() {
                this.canvas = canvas;
                this.canvas.width = 1024;
                this.canvas.height = 768;
                document.body.appendChild(this.canvas);
            });

            afterEach(function() {
                document.body.removeChild(this.canvas);
            });
        }
    };
});
