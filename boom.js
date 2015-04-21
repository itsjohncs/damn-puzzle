// # The coordinate system
//
// The coordinate system has two perpindicular axes. Each point represents the
// center of a triangle in the world. So (0, 0) is the center of the
// bottommost-leftmost triangle. (1, 0) is the triangle to the right of (0, 0).
// Etc. This coordinate system makes thins a little weird because if you just
// do a simple translation up one, you'll destroy your shape because over
// triangle within the shape will flip over.

var canvas = document.getElementById("game-canvas");

var ctx = canvas.getContext("2d");

var TRIANGLE_RADIUS = 50.0;

// The largest allowed X value plust 1 in the triangly coordinat esystem
var WIDTH = 16;

// The largest allowed Y value plust 1 in the triangly coordinat esystem
var HEIGHT = 6;

// This converts a coordinate like (1, 3) (corresponding to a specific center
// of a triangle) to actual coordinates on the canvas (still the center of where
// the triangle should be drawn though).
function real_pos(pos) {
    // The difference between the X coordinates of two triangles sitting right
    // next to eachother (on the same row).
    var x_spacing = (2.0 * TRIANGLE_RADIUS) / Math.sqrt(3.0)

    // This is the distance between the bottom of the canvas and the center of
    // the bottom most triangle.
    var y_start;

    // Depending on whether we're on an even numbered column or an odd numbered
    // column, our resulting Y coordinate will be different. There is also
    // alternating differences between the Y coordinates of triangles sitting
    // on top of eachother (alternating between 2 times the radius and just the
    // radius).
    var y_spacing_first, y_spacing_second;
    if (pos[0] % 2 === 0) {
        y_start = TRIANGLE_RADIUS / 2.0;

        // On even numbered columns, the y distance between the bottom most
        // triangle and the triangle right above it is 2R, then the next
        // distance is R, and then they alternate.
        y_spacing_first = TRIANGLE_RADIUS * 2;
        y_spacing_second = TRIANGLE_RADIUS;
    } else {
        y_start = TRIANGLE_RADIUS;

        // On odd numbered columns, the first distance is R and the second is
        // 2R and then they alternate.
        y_spacing_first = TRIANGLE_RADIUS;
        y_spacing_second = TRIANGLE_RADIUS * 2;
    }

    return [
        (pos[0] * x_spacing + 100),
        600 - (Math.ceil(pos[1] / 2.0) * y_spacing_first + Math.floor(pos[1] / 2.0) * y_spacing_second + y_start + 100),
    ];
};

function add(pos1, pos2) {
    return [pos1[0] + pos2[0], pos1[1] + pos2[1]];
}

function scalar_multiplication(pos, scalar) {
    return [pos[0] * scalar, pos[1] * scalar];
}

function draw_triangle(pos, color) {
    // See http://stackoverflow.com/questions/11449856/draw-a-equilateral-triangle-given-the-center
    // for information on how this is being done. We're going to use the point
    // labelings they use there.

    // This assumes a world where the triangle at 0,0 is not flipped (so there
    // are two vertices that touch the x axis).
    var flipped = !((pos[0] % 2 === 0) ^ (pos[1] % 2 === 0));

    var point_c = [0, TRIANGLE_RADIUS];

    var point_a = [
        -2.0 * TRIANGLE_RADIUS / Math.sqrt(3),
        -TRIANGLE_RADIUS / 2.0,
    ];

    var point_b = [
        2.0 * TRIANGLE_RADIUS / Math.sqrt(3),
        -TRIANGLE_RADIUS / 2.0,
    ];

    if (flipped) {
        point_a = [point_a[0], point_a[1] * -1];
        point_b = [point_b[0], point_b[1] * -1];
        point_c = [point_c[0], point_c[1] * -1];
    }

    var rpos = real_pos(pos);
    point_a = add(point_a, rpos);
    point_b = add(point_b, rpos);
    point_c = add(point_c, rpos);

    ctx.strokeStyle = "#444444";
    ctx.lineWidth = 2;
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.moveTo(point_c[0], point_c[1]);
    ctx.lineTo(point_b[0], point_b[1]);
    ctx.lineTo(point_a[0], point_a[1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function draw_world(triangles) {
    var largest_x = 16;
    var largest_y = 6;

    ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );

    for (var x = 0; x < largest_x; ++x) {
        for (var y = 0; y < largest_y; ++y) {
            draw_triangle([x, y], "#CCC");
        }
    }

    _.each(triangles, function(triangle) {
        draw_triangle(triangle, "#FF0000");
    });
}

var ROTATION = {

}

var BORDERS = [
    [0, 0], [1, 0], [2, 0], [10, 0], [14, 0], [15, 0],
    [0, 1], [1, 1], [15, 1],
    [0, 2], [1, 2], [15, 2],
    [0, 3], [1, 3], [2, 3], [14, 3], [15, 3],
    [0, 4], [1, 4], [2, 4], [3, 4], [13, 4], [14, 4], [15, 4],
    [0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [12, 5], [13, 5], [14, 5], [15, 5],
];

function flip_x(shape) {
    return _.map(shape, function (triangle) {
        return [-triangle[0], triangle[1]];
    });
};

function flip_y(shape) {
    return _.map(shape, function (triangle) {
        return [triangle[0], -triangle[1]];
    });
};

function translate(shape, delta) {
    return _.map(shape, function (triangle) {
        return add(triangle, delta);
    });
};

// Finds the "starting position" of the shape such that it is in bounds
// and as far down and to the left as possible
function to_start_position(shape) {
    var result = shape;

    // Increase until everything is positive
    while (_.any(result, function(triangle) {return triangle[0] < 0 || triangle[1] < 0})) {
        result = translate(result, [1, 1]);
    }

    // Try to lower it diagonally as much as possible
    var canLower = function(){return _.all(result, function(triangle) {
        return triangle[0] - 1 >= 0 && triangle[1] - 1 >= 0;
    })};
    while (canLower(result)) {
        result = translate(result, [-1, -1]);
    }

    // Try to lower it wierdly... as much as possible
    var canLower = function(){return _.all(result, function(triangle) {
        return triangle[1] - 1 >= 0;
    })};
    while (canLower(result)) {
        result = translate(result, [1, -1]);
    }

    // Try to lower it vertically as much as possible
    var canLower = function(){return _.all(result, function(triangle) {
        return triangle[1] - 2 >= 0;
    })};
    while (canLower(result)) {
        result = translate(result, [0, -2]);
    }

    // Try to lower it horizontally as much as possible
    var canLower = function(){return _.all(result, function(triangle) {
        return triangle[0] - 2 >= 0;
    })};
    while (canLower(result)) {
        result = translate(result, [-2, 0]);
    }

    return result;
};

function shape_a(rotation) {
    var SHAPE_A_0 = [
        [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0],
        [0, 1], [1, 1], [7, 1], [8, 1],
        [7, 2], [8, 2],
    ];

    var SHAPE_A_60 = [
        [0, 0], [1, 0], [2, 0], [3, 0],
        [3, 1], [4, 1],
        [4, 2], [5, 2],
        [4, 3], [5, 3],
        [2, 4], [3, 4], [4, 4],
    ];

    var SHAPE_A_120 = [
        [5, 0],
        [5, 1], [6, 1],
        [5, 2], [6, 2],
        [4, 3], [5, 3], [0, 3],
        [0, 4], [1, 4], [2, 4], [3, 4], [4, 4],
    ];

    switch (rotation) {
        case 0: return SHAPE_A_0;
        case 60: return SHAPE_A_60;
        case 120: return SHAPE_A_120;
        case 180: return translate(flip_x(flip_y(SHAPE_A_0)), [0, 1]);
        case 240: return translate(flip_x(flip_y(SHAPE_A_60)), [0, 1]);
        case 300: return translate(flip_x(flip_y(SHAPE_A_120)), [0, 1]);
    }

    throw 1;
};

SHAPE_A = {
    0: to_start_position(shape_a(0)),
    60: to_start_position(shape_a(60)),
    120: to_start_position(shape_a(120)),
    180: to_start_position(shape_a(180)),
    240: to_start_position(shape_a(240)),
    300: to_start_position(shape_a(300)),
};

var restore_shape_state = function (shape, state) {
    var rotation = Math.floor(state / (HEIGHT * WIDTH / 2)) * 60;
    if (rotation > 300) {
        return false;
    }
    state = state % (HEIGHT * WIDTH / 2);

    var delta_y = Math.floor(state / (WIDTH / 2));
    var delta_x = Math.floor((state % (WIDTH / 2)) * 2 + delta_y % 2);

    return translate(shape[rotation], [delta_x, delta_y]);
};

// Searches shapes for collisions. Will return -1 if there are no collisoins.
// Otherwise, will return the index of the first shape to collide with those
// before it (where the borders of the world are considered before the 0th
// shape).
var check_collision = function (shapes) {
    var stringify = function(triangle) {return triangle.toString()};
    var points = _.map(BORDERS, stringify);

    var out_of_bounds = function(shape) {
        return _.any(shape, function(triangle) {
            return triangle[0] < 0 || triangle[0] >= WIDTH ||
                   triangle[1] < 0 || triangle[1] >= HEIGHT;
        })
    }

    for (var i = 0; i < shapes.length; ++i) {
        if (out_of_bounds(shapes[i])) {
            return i;
        }

        _.each(_.map(shapes[i], stringify), function(i) {
            points.push(i);
        });

        // If there's a collision...
        if (_.uniq(points).length !== points.length) {
            return i;
        }
    }

    return -1;
};

var states = [0, 0, 0];

var shapes = _.map(states, function() {return restore_shape_state(SHAPE_A, 0)});
var SHAPE_COLORS = ["#00FFF0", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF"]
var counter = 0;

var draw_shapes = function () {
    ctx.globalAlpha = 1;
    draw_world(BORDERS);
    _.each(shapes, function(shape, index) {
        _.each(shape, function (triangle) {
            ctx.globalAlpha = 0.4;
            draw_triangle(triangle, SHAPE_COLORS[index]);
        });
    });
};

var try_many = function () {
    while (true) {
        var collision = check_collision(shapes);
        if (collision === -1) {
            draw_shapes();
            console.log(states);
            collision = states.length - 1;
        }

        for (var i = states.length - 1; i >= 0; --i) {
            if (i > collision) {
                states[i] = 0;
                shapes[i] = restore_shape_state(SHAPE_A, 0);
                continue;
            }

            counter++;
            if (counter % 1000 === 0) {
                _.defer(try_many);
                return;
            }
            states[i]++;
            shapes[i] = restore_shape_state(SHAPE_A, states[i]);

            if (!shapes[i] && i == 0) {
                // We searched the entire tree
                throw counter;
            } else if (!shapes[i]) {
                // No more places to move this shape... Move the shape prior to
                // us and begin anew.
                states[i] = 0;
                shapes[i] = restore_shape_state(SHAPE_A, 0);
            } else {
                break;
            }
        }
    }
};
try_many();
