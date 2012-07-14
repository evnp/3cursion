define([
    'jquery',
    'underscore',
    'backbone',

    'collections/cubes',

    'three',
    'detector'

], function ($, _, Backbone, CubeCollection) {

    // Constants
    var W, H
      , PI  = Math.PI
      , THT = 45 // Theta
      , PHI = 60
      , FOV = 70 // Field of view for perspective camera
      , RENDERER = (Detector.webgl ? 'WebGL' : 'Canvas') + 'Renderer'
      , CAMSPEED = 0.4; // Speed of mouse camera rotation

    return Backbone.View.extend({

        el: '#canvas',

        initialize: function () {
            W = this.$el.width();
            H = this.$el.height() - 4;

            this.lon = 0;
            this.lat = 0;

        // Scene
            this.scene = new THREE.Scene();

        // Cubes
            this.hovered  = null;
            this.selected = new CubeCollection();
            this.cubes    = new CubeCollection([], this.scene);

            // Dev - add 2 cubes
            this.cubes.add([
                { size: 20 },
                { origPos: new THREE.Vector3( 40, 0, 0 ) }
            ]);

        // Object Hover
            this.setupObjHover();

        // Object Selection

        // Object Movement
            this.setupObjMovement();

            // Movement Reference Plane
            this.plane = new THREE.Mesh(
                new THREE.PlaneGeometry( 2000, 2000, 8, 8 ),
                new THREE.MeshBasicMaterial({
                    color: 0xff0000, opacity: 0.25,
                    transparent: true,
                    wireframe: true
                })
            );

            this.plane.visible = false;

            // Align the plane with the field of view
            var rotation = new THREE.Matrix4().makeRotationX( Math.PI / 2 );
            this.plane.geometry.applyMatrix(rotation);

            this.planeOffset = new THREE.Vector3();

            this.scene.add(this.plane);

        // Projector - for establishing mouse-object intersections
            this.projector = new THREE.Projector();

        // Camera
            this.camera = new THREE.PerspectiveCamera(FOV, this.w/this.h, 1, 1000);
            this.camera.target = new THREE.Vector3( 0, 0, 0 );
            this.setupCameraControls();
            this.scene.add(this.camera);

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

            var ambient = new THREE.AmbientLight(0x404040);

            this.scene.add(light1);
            this.scene.add(light2);
            this.scene.add(ambient);

        // Renderer
            this.renderer = new THREE[RENDERER]();

        // Misc.
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
                if (e.which === 1 && !canvas.hovered) {

                    mouseX = e.clientX; mouseLon = canvas.lon;
                    mouseY = e.clientY; mouseLat = canvas.lat;

                    canvas.$el.on('mousemove.cam', function (e) {
                        canvas.lon = ( e.clientX - mouseX ) * CAMSPEED + mouseLon;
                        canvas.lat = ( e.clientY - mouseY ) * CAMSPEED + mouseLat;
                    });

                    canvas.$el.on('mouseup.cam', function (e) {
                        if (e.which === 1) {
                            canvas.$el.off('mousemove.cam');
                            canvas.$el.off('mouseup.cam');

                            // Keep movment plane parallel with field of view
                            canvas.plane.lookAt(canvas.camera.position);
                        }
                    });
                }
            });

        // Camera Zoom
            this.el.addEventListener( 'mousewheel',     onMouseWheel, false );
            this.el.addEventListener( 'DOMMouseScroll', onMouseWheel, false );
            function onMouseWheel( event ) {

                if ( event.wheelDeltaY )
                    FOV -= event.wheelDeltaY * 0.05; // Webkit

                else if (  event.wheelDelta )
                    FOV -= event.wheelDelta * 0.05; // Opera / Explorer 9

                else if (  event.detail )
                    FOV += event.detail * 1.0; // Firefox

                canvas.camera.projectionMatrix.makePerspective(
                    FOV, W/H, 1, 1100
                );
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
        },

    // Object Hover
        setupObjHover: function () {
            var canvas = this;

            canvas.$el.mousemove(function (e) {
                var hovered = canvas.getHoveredAt(e.clientX, e.clientY);

                // If the hovered object has changed,
                // set colors, then set new hovered
                if (hovered !== canvas.hovered) {
                    if (canvas.hovered) canvas.hovered.hover(false);
                    if (hovered) hovered.hover(true);
                    canvas.hovered = hovered;
                }

                // Set the cursor
                canvas.el.style.cursor = hovered ? 'move' : 'auto'
            });
        },

    // Object Selection
        select: function (cube) {
            cube.select(true);
            this.selected.add(cube);
        },

        deselect: function () {
            this.selected.deselectAll();
        },

    // Object Movement
        setupObjMovement: function () {
            var canvas = this;

            canvas.$el.mousedown(function (e) {
                if (e.which === 1 && canvas.hovered) {

                    // Select hovered object
                    canvas.select(canvas.hovered);

                    // Set plane offset for new mouseDown start position
                    var x = e.clientX
                      , y = e.clientY
                      , intersect = canvas.getIntersectBetween(x, y, canvas.plane);

                    if (intersect) {
                        canvas.planeOffset.copy(
                            intersect.point
                        ).subSelf(canvas.plane.position);
                    }

                    canvas.$el.on('mousemove.hov', function (e) {
                        var x = e.clientX
                          , y = e.clientY;

                        if (!canvas.selected.isEmpty()) {
                            var intersect = canvas.getIntersectBetween(x, y, canvas.plane);

                            if (intersect) {
                                var movement = intersect.point.subSelf(canvas.planeOffset)
                                canvas.selected.moveAll(movement);
                            }
                        }
                    });

                    canvas.$el.on('mouseup.hov', function (e) {
                        if (e.which === 1) {
                            canvas.$el.off('mousemove.hov');
                            canvas.$el.off('mouseup.hov');
                        }
                    });
                }
            });
        },

        moveSelected: function(direction) {
            _.each(this.selected, function(obj) {
                if (obj
                &&  obj.wireframe
                &&  obj.shaded
                &&  obj.origPos) {

                    var position = new THREE.Vector3(
                            obj.origPos.x + direction.x,
                            obj.origPos.y + direction.y,
                            obj.origPos.z + direction.z
                        );

                    obj.wireframe.position = position;
                    obj.shaded.position    = position;
                }
            });
        },

    // Utility
        getHoveredAt: function (x, y) {
            return this.cubes.getFromIntersect(
                this.getIntersectBetween(x, y, this.cubes.getMeshes())
            );
        },

        getIntersectBetween: function (x, y, obj) {
            var ray = this.getRayAt(x, y)

            return ( obj instanceof Array ?
                ray.intersectObjects(obj) :
                ray.intersectObject( obj) )[0] || null;
        },

        getRayAt: function (x, y) {

            var vector = new THREE.Vector3(
                ((x/ W) * 2) - 1,
               -((y/ H) * 2) + 1, 0.5);

            this.projector.unprojectVector(vector, this.camera);

            return new THREE.Ray(this.camera.position,
                  vector.subSelf(this.camera.position).normalize());
        },

        setMovementPlane: function (obj) {
            if (obj.wireframe) {
                this.plane.position.copy(obj.wireframe.position);
                this.plane.lookAt(this.camera.position);
            }
        }
    });
});
