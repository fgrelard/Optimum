var W = 700,
    canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d');

if (window.devicePixelRatio > 1) {
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    canvas.width = canvas.width * 2;
    canvas.height = canvas.height * 2;
    ctx.scale(2, 2);
}

function randBox(size) {
    var x = Math.random() * (W - size),
        y = Math.random() * (W - size);
    return {
        minX: x,
        minY: y,
        maxX: x + size * Math.random(),
        maxY: y + size * Math.random()
    };
}

function randClusterPoint(dist) {
    var x = dist + Math.random() * (W - dist * 2),
        y = dist + Math.random() * (W - dist * 2);
    return {x: x, y: y};
}

function randClusterBox(cluster, dist, size) {
    var x = cluster.x - dist + 2 * dist * (Math.random() + Math.random() + Math.random()) / 3,
        y = cluster.y - dist + 2 * dist * (Math.random() + Math.random() + Math.random()) / 3;

    return {
        minX: x,
        minY: y,
        maxX: x + size * Math.random(),
        maxY: y + size * Math.random(),
        item: true
    };
}

var colors = ['#f40', '#0b0', '#37f'],
    rects;

function drawTree(rects, node, level, dx, dy, minX, minY) {
    if (!node) { return; }

    var rect = [];
    var fx = node.maxX - node.minX;
    var fy = node.maxY - node.minY;
    var w = fx * (W-5) / dx;
    var h = fy * (W-5) / dy;

    var sx = (W/dx) * (node.minX - minX);
    var sy = (W/dy) * (node.minY - minY);
//    if (level > -1) {
        rect.push(level ? colors[(node.height - 1) % colors.length] : 'grey');
        rect.push(level ? 1 / Math.pow(level, 1.2) : 0.2);
        rect.push([
            Math.round(sx),
            Math.round(sy),
            Math.round(w),
            Math.round(h)
        ]);

        rects.push(rect);
//    }
    if (node.leaf) return;
    if (level === 6) { return; }

    for (var i = 0; i < node.children.length; i++) {
        drawTree(rects, node.children[i], level + 1, dx, dy, minX, minY);
    }
}

export default function draw(tree) {
    rects = [];

    var dx = tree.data.maxX - tree.data.minX;
    var dy = tree.data.maxY - tree.data.minY;
    var minX = tree.data.minX;
    var minY = tree.data.minY;

    drawTree(rects, tree.data, 0, dx, dy, minX, minY);

    ctx.clearRect(0, 0, W + 1, W + 1);

    for (var i = rects.length - 1; i >= 0; i--) {
        ctx.strokeStyle = rects[i][0];
        ctx.globalAlpha = rects[i][1];
        ctx.strokeRect.apply(ctx, rects[i][2]);
    }
}
