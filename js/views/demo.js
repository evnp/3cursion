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
                    var copy = _.clone(action);
                    if (copy.actions)
                        copy.actions = _.clone(copy.actions);
                    return copy;
                })

              // Set maintenance variables
              , index = frameNo = 0

              // Get the first action
              , action = actions[0];

            // Preform an action
            function doAction() {

                // Advance to the next action if necessary
                if (frameNo++ > action.frames) {

                    // If this is the end of a camera movement, reset
                    if (action.type === 'camera') // the reference plane
                        canvas.plane.lookAt(canvas.camera.position);

                    action  = actions[++index];
                    frameNo = 0;

                    if (action) { // Set up the subjects for this action(s)
                        var subject;
                        _.each( action.actions || [action], function (act) {
                            subject = demo.cubes.at(act.subject || 0);
                            if (act.depth && subject)
                                subject = subject.get('children')[act.depth - 1];
                            act.cube   = subject;

                            // Frames are needed to divide the action
                            act.frames = action.frames;
                        });
                    }
                }

                // We've reached the end of the actions
                if (!action) return;

                _.each(action.actions || [action], function (action) {
                    if (action && action.type) handleAction(action);
                });

                function handleAction(action) {
                    console.log(action);

                    if (action.type === 'camera') {
                        canvas.lon += action.lon / action.frames;
                        canvas.lat += action.lat / action.frames;

                    } else if (action.type === 'creation') {
                        console.log('creating'); 
                        demo.cubes.add({
                            position: action.pos,
                            size:     action.size
                        });
                        // Make sure only one cube is created
                        delete action.type;

                    } else if (action.type.match(/position|rotation|scale/)
                           &&  action.cube) {

                        // Get the change vector for this fraction of the frame set
                        var diff = new THREE.Vector3(0, 0, 0);
                        _.each(['x', 'y', 'z'], function (a) {
                            diff[a] = action.change[a] / action.frames;
                        });

                        action.cube.changeAttr(action.type, diff);

                    } else if (action.type === 'recursion'
                           &&  action.cube) {

                        // Get vectors used to link child cubes
                        var vectors = {
                            position: new THREE.Vector3( 0, 0, 0 ),
                            rotation: new THREE.Vector3( 0, 0, 0 ),
                            scale:    new THREE.Vector3( 1, 1, 1 )
                        };

                        // Don't add children to demo cube collection
                        canvas.cubes.add( canvas.flatMap(
                            action.cube.getRelated(), function (c) {
                                return c.recurse(0, vectors);
                            }
                        ));

                        action.type = 'position';
                        action.cube = _.last(action.cube.get('children'));
                    }
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
                change: new THREE.Vector3(0, 0, -12)
            },{
                frames: 10,
                type: 'recursion',
                depth: 1,
                change: new THREE.Vector3(0, 12, 0)
            },{
                frames: 60,
                actions: [{
                    type: 'rotation',
                    depth: 1,
                    change: this.randomVector(-360, 360, 0.001)
                },{
                    type: 'rotation',
                    depth: 2,
                    change: this.randomVector(-360, 360, 0.001)
                },{
                    type: 'scale',
                    change: this.randomVector(-20, 0, 0.01, true)
                },{
                    type: 'scale',
                    depth: 1,
                    change: this.randomVector(-20, 0, 0.01, true)
                },{
                    type: 'scale',
                    depth: 2,
                    change: this.randomVector(-20, 0, 0.01, true)
                }]
            },{
                frames: 40,
                actions: [{
                    type: 'rotation',
                    depth: 1,
                    change: this.randomVector(-360, 360, 0.001)
                },{
                    type: 'rotation',
                    depth: 2,
                    change: this.randomVector(-360, 360, 0.001)
                }]
            }];

        },

        randomVector: function (a, b, factor, share) {
            factor = factor || 1; // Scale the randomized values
            var val;
            return share && // Should 1 or 3 randomized values be generated?
                (val = this.random(a, b) * factor) ?
                new THREE.Vector3(val, val, val) :
                new THREE.Vector3(
                    this.random(a, b) * factor,
                    this.random(a, b) * factor,
                    this.random(a, b) * factor
                );
        },

        random: function (a, b) {
            return Math.floor((Math.random()*(b-a))+1+a);
        }
    });
});
