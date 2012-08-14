define([
    'jquery',
    'underscore',
    'backbone',

    'collections/cubes'

], function ($, _, Backbone, CubeCollection) {

    return Backbone.View.extend({

        initialize: function (canvas) {
            this.running = false;
            this.paused  = false;
            this.canvas  = canvas;
            this.actions = [];
            this.cubes   = new CubeCollection();

            var demo = this;
            this.cubes.on('add', function (cube) {
                demo.canvas.cubes.add(cube);
            });
            this.cubes.on('remove', function (cube) {
                demo.canvas.cubes.remove(cube);
            });

            // Add events for 'complete' trigger
            _.extend(this, Backbone.Events);
        },

        reset: function () {
            this.canvas.resetCamera();
            this.canvas.cubes.remove(this.cubes.toArray());
            this.cubes.reset();
        },

        start: function (regen) {
            if (regen) this.generateActions();
            this.reset();
            this.running = true;
            this.playActions(this.actions);
        },

        pause: function () { this.paused = true; },
        play:  function () { this.paused = false;  },

        playActions: function (actions) {

            var demo = this
              , canvas = this.canvas

              // Copy actions so that originals aren't modified
              , actions =  _.map(actions, function (action) {
                    return _.clone(action);
                })

              // Get the first action and cube (if there is one)
              , action = actions[0]
              , cube = this.cubes.at(action.subject || 0)

              // Set maintenance variables
              , diff = new THREE.Vector3(0, 0, 0)
              , index = frameNo = 0;

            // Preform an action
            function doAction() {

                // Advance to the next action if necessary
                if (frameNo++ > action.frames) {

                    // If this is the end of a camera movement, reset
                    if (action.type === 'camera') // the reference plane
                        canvas.plane.lookAt(canvas.camera.position);

                    action  = actions[++index];
                    frameNo = 0;

                    if (action) {
                        cube = demo.cubes.at(action.subject || 0);
                        if (action.depth)
                            cube = cube.get('children')[action.depth - 1];
                    }
                }

                // If we've reached the end of actions,
                // or the current action is empty, pass
                if (!action || !action.type) return;

                if (action.type === 'camera') {
                    canvas.lon += action.lon / action.frames;
                    canvas.lat += action.lat / action.frames;

                } else if (action.type === 'creation') {
                    demo.cubes.add({
                        position: action.pos,
                        size:     action.size
                    });
                    // Make sure only one cube is created
                    delete action.type;

                } else if (action.type.match(/position|rotation|scale/) && cube) {

                    // Get the change vector for this fraction of the frame set
                    _.each(['x', 'y', 'z'], function (a) {
                        diff[a] = action.change[a] / action.frames;
                    });

                    cube.changeAttr(action.type, diff);

                } else if (action.type === 'recursion' && cube) {

                    // Get vectors used to link child cubes
                    var vectors = {
                        position: new THREE.Vector3( 0, 0, 0 ),
                        rotation: new THREE.Vector3( 0, 0, 0 ),
                        scale:    new THREE.Vector3( 1, 1, 1 )
                    };

                    // Don't add children to demo cube collection
                    canvas.cubes.add( canvas.flatMap(
                        cube.getRelated(), function (c) {
                            return c.recurse(0, vectors);
                        }
                    ));

                    action.type = 'position';
                    cube = _.last(cube.get('children'));
                }

            }

            // Animation Loop
            function animate() {
                if (!demo.paused) doAction();
                if ( demo.running && action)
                    requestAnimationFrame(animate);
                else {
                    demo.trigger('complete');
                    demo.running = false;
                }
            }
            animate();
        },

        generateActions: function () {

            /*
            Create a cube:
                pos: the cube position
                size: the cube size

            Move the camera:
                type: 'pan'
                lon: change in longitude (degrees)
                lat: change in latitude  (degrees)

            Modify a cube:
                type: 'position'|'rotation'|'scale'
                change: a vector containing the 
                        amount to change the attribute
                subject: a number identifying the cube
                         to modify (by order of creation).
                         Doesn't include children.
                depth: a number indicating the level of
                       a recursion hierarchy to manipulate, 
                       omit for the root, 1 for 1st lvl
                       recursion, 2 for 2nd lvl

            Recurse a cube:
                type: 'recurse'
                change: a vector containing the
                        amount to move the new children
                subject: a number identifying the cube
                         to recurse (by order of creation)
                depth: a number indicating the level of
                       a recursion hierarchy to manipulate, 
                       omit for the root, 1 for 1st lvl
                       recursion, 2 for 2nd lvl

            Skip frames:
                type: null
            */

            this.actions = [{
                frames: 60,
                type: 'creation',
                pos: new THREE.Vector3(0, 0, 0),
                size: 10 
            },{
                frames: 10,
                type: 'recursion',
                change: new THREE.Vector3(0, 0, 12)
            },{
                frames: 10,
                type: 'recursion',
                depth: 1,
                change: new THREE.Vector3(0, 12, 0)
            },{
                frames: 60,
                type: 'rotation',
                depth: 1,
                change: new THREE.Vector3(
                    this.random(-360, 360) * 0.001,
                    this.random(-360, 360) * 0.001,
                    this.random(-360, 360) * 0.001
                )
            },{
                frames: 60,
                type: 'rotation',
                depth: 2,
                change: new THREE.Vector3(
                    this.random(-360, 360) * 0.001,
                    this.random(-360, 360) * 0.001,
                    this.random(-360, 360) * 0.001
                )
            }];
        },

        random: function (a, b) {
            return Math.floor((Math.random()*(b-a))+1+a);
        }
    });
});
