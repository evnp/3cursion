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
      , BLACK = 0x000000
      , RED   = 0xff0000
      , RENDERER = (Detector.webgl ? 'WebGL' : 'Canvas') + 'Renderer'
      , CAMSPEED = 0.4 // Speed of mouse camera rotation
      ;

    return Backbone.View.extend({

        el: '#canvas',

        initialize: function () {
            W = this.$el.width();
            H = this.$el.height() - 4;

            this.lon = 0;
            this.lat = 0;

        // Cubes
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

            var cube1 = this.getWireframeShadedMesh(
                new THREE.CubeGeometry(20, 20, 20)
            );

            var cube2 = this.getWireframeShadedMesh(
                new THREE.CubeGeometry(20, 20, 20)
            );
            cube2.position.x = 40;

        // Object Hover
            this.setupObjHover();

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

        // Projector - for establishing mouse-object intersections
            this.projector = new THREE.Projector();

        // Camera
            this.camera = new THREE.PerspectiveCamera(FOV, this.w/this.h, 1, 1000);
            this.camera.target = new THREE.Vector3( 0, 0, 0 );
            this.setupCameraControls();

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

        // Scene
            this.scene = new THREE.Scene();
            this.scene.add(this.camera);
            this.scene.add(cube1);
            this.scene.add(cube2);
            this.scene.add(this.plane);
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

                        canvas.el.style.cursor = 'crosshair';
                    });

                    canvas.$el.on('mouseup.cam', function (e) {
                        if (e.which === 1) {
                            canvas.$el.off('mousemove.cam');
                            canvas.$el.off('mouseup.cam');

                            canvas.el.style.cursor = 'auto';

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

        setupObjHover: function () {
            var canvas = this;

            canvas.$el.mousemove(function (e) {
                if (!canvas.selected) {
                    var hovered = canvas.getHoveredAt(e.clientX, e.clientY);

                    // If the hovered object has changed,
                    // set colors, then set new hovered
                    if (hovered != canvas.hovered) {
                        canvas.setColor(canvas.hovered, BLACK);
                        canvas.setColor(hovered, RED);
                        canvas.hovered = hovered;
                    }

                    // If an object is being hovered over
                    if (hovered) { canvas.el.style.cursor = 'move'; }
                }
            });
        },

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

                        if (canvas.selected) {
                            var intersect = canvas.getIntersectBetween(x, y, canvas.plane);

                            if (intersect) {
                                var direction = intersect.point.subSelf(canvas.planeOffset)
                                canvas.moveSelected(direction);
                            }
                        }
                    });

                    canvas.$el.on('mouseup.hov', function (e) {
                        if (e.which === 1) {
                            canvas.$el.off('mousemove.hov');
                            canvas.$el.off('mouseup.hov');

                            canvas.selected = null;
                        }
                    });
                }
            });
        },

        select: function(obj) {
            this.selected = obj;

            // Store the object's original position to be used
            // as an offset to the mouse movement
            this.selected.origPos = obj.wireframe.position;
        },

        moveSelected: function(direction) {
            if (this.selected
             && this.selected.wireframe
             && this.selected.shaded
             && this.selected.origPos) {

                var origPos  = this.selected.origPos
                  , position = new THREE.Vector3(
                        origPos.x + direction.x,
                        origPos.y + direction.y,
                        origPos.z + direction.z
                    );

                this.selected.wireframe.position = position;
                this.selected.shaded.position    = position;
            }
        },

    // Utility
        getAllObjects: function () {
            var objects = _.filter(this.scene.__objects, function (obj) {
                    return obj.geometry && obj.geometry instanceof THREE.CubeGeometry;
                })
              , wireframes = _.filter(objects, function (obj) {
                    return obj.material.wireframe;
                });

            return {
                wireframe: wireframes,
                shaded: _.difference(objects, wireframes)
            };
        },

        getHoveredAt: function (x, y) {
            var objects   = this.getAllObjects()
              , intersect = this.getIntersectBetween(x, y, objects.wireframe)
              , wireframe = intersect ? intersect.object : null
              , index     = objects.wireframe.indexOf(wireframe);

            return index === -1 ? null : {
                wireframe: objects.wireframe[index] || null,
                shaded:    objects.shaded[index]    || null
            };
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
        },

        setColor: function (obj, color) {
            if (obj && obj.wireframe)
                obj.wireframe.material.color.setHex(color);
        }
    });
});
