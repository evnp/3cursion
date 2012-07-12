define([
    'jquery',
    'underscore',
    'backbone',
    'three',
    'detector'

], function ($, _, Backbone) {

    // Constants
    var W, H
      , PI  = Math.PI
      , THT = 45 // Theta
      , PHI = 60
      , FOV = 70 // Field of view for perspective camera
      , RENDERER = (Detector.webgl ? 'WebGL' : 'Canvas') + 'Renderer'
      , MOUSESPEED = 0.4 // Speed of mouse camera rotation
      ;

    return Backbone.View.extend({

        el: '#canvas',

        initialize: function () {
            W = this.$el.width();
            H = this.$el.height() - 4;

            this.lon = 0;
            this.lat = 0;

        // Camera
            this.camera = new THREE.PerspectiveCamera(FOV, this.w/this.h, 1, 1000);
            this.camera.target = new THREE.Vector3( 0, 0, 0 );
            this.setupCameraControls();

        // Mesh
            this.getShadedMesh = function (geometry) {
                return new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
                    color: 0xffffff
                }));
            };

            this.getWireframeMesh = function (geometry) {
                return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    wireframe: true
                }));
            };

            this.getWireframeShadedMesh = function (geometry) {
                return THREE.SceneUtils.createMultiMaterialObject(geometry, [
                    new THREE.MeshLambertMaterial({
                        color: 0xffffff
                    }),
                    new THREE.MeshBasicMaterial({
                        color: 0x000000,
                        wireframe: true
                    })
                ]);
            };

            this.mesh = this.getWireframeShadedMesh(
                new THREE.CubeGeometry(20, 20, 20)
            );

        // Scene
            this.scene = new THREE.Scene();
            this.scene.add(this.camera);
            this.scene.add(this.mesh);

        // Lights
            var light1 = new THREE.DirectionalLight(0xffffff);
            light1.position.x = 1;
            light1.position.y = 1;
            light1.position.z = 0.75;
            light1.position.normalize();

            var light2 = new THREE.DirectionalLight(0x808080);
            light2.position.x = -1;
            light2.position.y = 1;
            light2.position.z = -0.75;
            light2.position.normalize();

            this.scene.add(new THREE.AmbientLight(0x404040));
            this.scene.add(light1);
            this.scene.add(light2);

        // Renderer
            this.renderer = new THREE[RENDERER]();

        // Events
            var canvas = this;
            window.addEventListener( 'resize', onWindowResized, false );

            function onWindowResized( event ) {
                canvas.renderer.setSize( W, H );
                canvas.camera.projectionMatrix.makePerspective( FOV, W/H, 1, 1100 );
            }

            onWindowResized(null);
        },

        render: function () {

            this.$el.append(this.renderer.domElement);

            // Start animation loop
            var canvas = this;
            function animate() {
                requestAnimationFrame(animate);
                canvas.renderFrame();
            }
            animate();
        },

        renderFrame: function () {
            this.positionCamera();
            this.renderer.render(this.scene, this.camera);
        },

        setupCameraControls: function () {
            var canvas = this
              , mouseLon = 0
              , mouseLat = 0
              , mouseX   = 0
              , mouseY   = 0;

        // Camera Rotation
            this.$el.mousedown(function (e) {
                if (e.which === 3) {
                    e.preventDefault();

                    mouseX = e.clientX; mouseLon = canvas.lon;
                    mouseY = e.clientY; mouseLat = canvas.lat;

                    canvas.$el.on('mousemove.cam', function (e) {
                        canvas.lon = ( e.clientX - mouseX ) * MOUSESPEED + mouseLon;
                        canvas.lat = ( e.clientY - mouseY ) * MOUSESPEED + mouseLat;
                    });

                    canvas.$el.on('mouseup.cam', function (e) {
                        if (e.which === 3) {
                            canvas.$el.off('mousemove.cam');
                            canvas.$el.off('mouseup.cam');
                        }
                    });
                }
            });

            // Disable the context menu for camera rotation right click
            this.$el.contextmenu(function (e) { return false; });

        // Camera Zoom
            this.$el.get(0).addEventListener( 'mousewheel',     onMouseWheel, false );
            this.$el.get(0).addEventListener( 'DOMMouseScroll', onMouseWheel, false );
            function onMouseWheel( event ) {
                if ( event.wheelDeltaY ) FOV -= event.wheelDeltaY * 0.05; // Webkit
                else if ( event.wheelDelta ) FOV -= event.wheelDelta * 0.05; // Opera / Explorer 9
                else if ( event.detail ) FOV += event.detail * 1.0; // Firefox
                canvas.camera.projectionMatrix.makePerspective( FOV, W/H, 1, 1100 );
            }
        },

        positionCamera: function () {
            this.lat = Math.max(-85, Math.min(85, this.lat));

            var phi   = (90 - this.lat) * PI / 180
              , theta =       this.lon  * PI / 180;

            this.camera.position.x = 100 * Math.sin(phi) * Math.cos(theta);
            this.camera.position.y = 100 * Math.cos(phi);
            this.camera.position.z = 100 * Math.sin(phi) * Math.sin(theta);

            this.camera.lookAt(this.camera.target);
        }
    });
});
