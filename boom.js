// # The coordinate system
//
// The coordinate system has two perpindicular axes 

var canvas = document.getElementById("game-canvas");

var ctx = canvas.getContext("2d");

var TRIANGLE_RADIUS = 50.0;

function real_pos(pos) {
    var W = (2.0 * TRIANGLE_RADIUS) / Math.sqrt(3.0)

    var H1, H2;
    var y_start;
    if (pos[0] % 2 === 0) {
        y_start = TRIANGLE_RADIUS / 2.0;
        H1 = TRIANGLE_RADIUS * 2;
        H2 = TRIANGLE_RADIUS;
    } else {
        y_start = TRIANGLE_RADIUS;
        H1 = TRIANGLE_RADIUS;
        H2 = TRIANGLE_RADIUS * 2;
    }

    return [
        (pos[0] * W + 100),
        600 - (Math.ceil(pos[1] / 2.0) * H1 + Math.floor(pos[1] / 2.0) * H2 + y_start + 100),
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

// This converts
var restore_shape_state(starting_shape, state) {

};

draw_world(BORDERS);
_.each(to_start_position(shape_a(120)), function (triangle) {
    draw_triangle(triangle, "#00FF00");
});

