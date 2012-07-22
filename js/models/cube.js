define([
    'jquery',
    'underscore',
    'backbone',

    'three'

], function($, _, Backbone) {

    var BLACK = 0x000000
      , WHITE = 0xffffff
      , RED   = 0xff0000
      , GREY  = 0xD3D3D3

    // If WebGL is unavaliable, limit iteration for performance.
      , RECURSION_LIMIT = Detector.webgl ? 10 : 10;

    var Cube = Backbone.Model.extend({

        initialize: function(attr){
            var size =     attr.size     || 20
              , position = attr.position || new THREE.Vector3( 0, 0, 0 )
              , rotation = attr.rotation || new THREE.Vector3( 0, 0, 0 )
              , scale    = attr.scale    || new THREE.Vector3( 1, 1, 1 )
              , obj = THREE.SceneUtils.createMultiMaterialObject(
                    new THREE.CubeGeometry(size, size, size),
                    [new THREE.MeshLambertMaterial({
                        color: WHITE
                    }), new THREE.MeshBasicMaterial({
                        color: GREY,
                        wireframe: true
                    })]
                );

            obj.position = position;
            obj.rotation = rotation;
            obj.scale    = scale;

            this.set({
                'size': size,

                // Main cube object is used for cube movement
                'object': obj,

                // Wireframe is used for mouse/cube intersection
                'wireframe': obj.children[1],

                // Shading
                'shading': obj.children[0],

                // Cube position/orientation/size
                'position': obj.position,
                'rotation': obj.rotation,
                'scale':    obj.scale,

                // Cube states
                'hovered': false,
                'selected': false,

                // Recursion
                'children': [],
                'parent': null
            });
        },


    // Object Hover and Selection

        hover: function (hoverVal) {
            this.set('hovered', hoverVal);
            if (!this.get('selected')) this.setColor( hoverVal ? BLACK : GREY );
        },

        select: function (selectVal) {
            this.set('selected', selectVal);
            if (selectVal) this.setColor(RED);
            else this.hover(this.get('hovered'));

            // Prevent root + children being selected simultaneously
            if (selectVal) {
                if (!this.get('parent'))
                     this.deselectChildren();
                else this.deselectRoot();
            }

            return this;
        },

        deselectChildren: function () {
            var children = this.get('children');
            _.each( children, function (cube) {
                cube.select(false).deselectChildren();
            });
        },

        deselectRoot: function () {
            var parnt = this.get('parent');
            if (parnt) parnt.deselectRoot();
            else this.select(false);
        },

        setColor: function (color) {
            this.get('wireframe').material.color.setHex(color);
        },


    // Object Manipulation - corrects recursion appropriately

        move: function (movement) {
            this.changePosition(movement);

            // If the move needs to be recursive...
            //var child = this.get('child');
            //if (child) child.move(movement);
        },

        rotate: function (movement, mouseX, mouseY) {
            this.changeRotation(
                movement.x, movement.y, movement.z, mouseX, mouseY
            );
        },

        scale: function (amount) {
            this.changeScale(amount);

            var child = this.get('child')
              , parnt = this.get('parent');

            // If the scale needs to be recursive...
            if (child & parnt) {
                child.changeScale(factor);

                var grandparent = parnt.get('parent');
                if (grandparent) {
                // TODO: need to recursively scale parents in
                //       opposite direction, if child is further
                //       down than 2nd.
                }
            }
        },


    // Object Attribute Setter Functions

        changePosition: function (val) { this.changeAttr('position', val); },
        changeScale:    function (val) { this.changeAttr('scale', val * 0.01); },
        changeRotation: function (x, y, z, mouseX, mouseY) {
            var speed = 30;
            this.changeAttr('rotation', new THREE.Vector3(
                (Math.abs(y * speed * 0.001) *
                (z / (Math.abs(x) + Math.abs(z))))
              , (mouseX * speed * 0.0001)
              , (Math.abs(y * speed * 0.001) *
               -(x / (Math.abs(x) + Math.abs(z))))
            ));
            // TODO: Make object rotation more intuitive
        },

        changeAttr: function (attr, val) {
            var x, y, z;

            // Accept object or number for val
            if (val instanceof Object) {
                x = val.x; y = val.y; z = val.z;
            } else x = y = z = val;

            attr = this.get(attr);

            attr.x += x;
            attr.y += y;
            attr.z += z;
        },


    // Object Recursion

        recurse: function (level) {
            level = level || 0;

            var newCubes = []
              , children = this.get('children')

            // If first child, vectors should not be linked so that the
            // first parent can be used to move the entire recursive stack.
              , child = level > 0 ? this.clone() :
                    new Cube({ size: this.get('size') });

            if (level < RECURSION_LIMIT) {

                // Recursively apply recurse operation to children
                _.each( children, function (cube) {
                    newCubes = newCubes.concat(cube.recurse(level));
                });

                children.push(child);
                child.set('parent', this);

                // Add the child's Object3D to the cube's Object3D
                this.get('object').add(child.get('object'));

                // Return the new child along with all its ancestors
                return [child].concat(child.recurse(level + 1)).concat(newCubes);

            } else return [];
        }
    });

    return Cube;
});
