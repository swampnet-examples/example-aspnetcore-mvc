var context = $("#canvas")[0].getContext("2d");

// True when user is dragging out a redaction area
var redact = false;

// True when user is dragging the image around to pan
var pan = false;

// We don't get movementX/Y properties on mouse move under IE, so keep track of it ourselves.
var prevX = 0;
var prevY = 0;

// Capture drag values
var startX;
var startY;
var endX;
var endY;

// Panning & zooming
var panX = 0;
var panY = 0;
var scale = 1.0;

var redactions = new Array();
var imageSource = new Image();

imageSource.onload = function () {
    context.canvas.width = imageSource.width;
    context.canvas.height = imageSource.height;
    redraw();
};

imageSource.src = "/images/canvas-buffer/x.jpg";

// Redraw canvas
function redraw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(panX, panY);
    context.scale(scale, scale);

    context.drawImage(imageSource, 0, 0, context.canvas.width, context.canvas.height);

    for (var i = 0; i < redactions.length; i++) {
        context.beginPath();
        context.fillStyle = "#0000FF";
        context.fillRect(redactions[i].x, redactions[i].y, redactions[i].w, redactions[i].h);
        context.stroke();
    }

    context.restore();

    // R&D - Find the x/y offset for the center of the image
    var centerX = panX + (imageSource.width / 2 * scale);
    var centerY = panY + (imageSource.height / 2 * scale);
  
    var html = "<strong>pan</strong>: (" + Math.round(panX * 100) / 100 + ", " + Math.round(panY * 100) / 100 + ") <strong>scale</strong>: " + Math.round(scale * 100) / 100;
    html += "<br/><strong>center</strong>: (" + Math.round(centerX * 100) / 100 + ", " + Math.round(centerY * 100) / 100 + ")";
    html += "<br/><strong>image</strong> (" + imageSource.width + ", " + imageSource.height + ")";

    $('#debug').html(html);
}


function drawRedactionBounds() {
    redraw();

    context.beginPath();
    context.fillStyle = "#FF0000";
    context.fillRect(startX, startY, endX - startX, endY - startY);
    context.stroke();
}


function panAndScale(x, y, z) {
    var oldscale = scale;

    scale += z;
    if (scale < 1) {
        scale = 1;
    }

    var scalechange = scale - oldscale;

    // Zoom in towards (x,y)
    if (scalechange > 0) {
        panX += -(x * scalechange);
        panY += -(y * scalechange);
    }
    // Zoom out towards (0,0)
    else {
        // @todo: Figure this out...
    }

    console.log("pos: (" + x + ", " + y + ") pan: (" + panX + ", " + panY + ") s: " + scale + ", sc: " + scalechange);
    redraw();
}

$('#canvas').mousedown(function (e) {
    startX = e.pageX - this.offsetLeft;
    startY = e.pageY - this.offsetTop;
    endX = startX;
    endY = startY;
    prevX = 0;
    prevY = 0;

    // Left mouse button - Drag out redaction boundary
    if (e.button === 0) {
        redact = true;
        console.log("start-redact (" + startX + ", " + startY + ")");
        drawRedactionBounds();
    }
    // Right mouse button - Pan
    else if (e.button === 2) {
        pan = true;
        console.log("start-pan (" + startX + ", " + startY + ")");
        redraw();
    }
});


$('#canvas').mousemove(function (e) {

    // We don't get movementX/Y properties on mouse move under IE, so keep track of it ourselves.
    var movementX = prevX ? e.screenX - prevX : 0;
    var movementY = prevY ? e.screenY - prevY : 0;
    prevX = e.screenX;
    prevY = e.screenY;

    endX = e.pageX - this.offsetLeft;
    endY = e.pageY - this.offsetTop;

    if (redact) {
        drawRedactionBounds();
    }

    if (pan) {
        panX += movementX;
        panY += movementY;
        redraw();
    }
});


$('#canvas').mouseup(function (e) {
    if (redact) {
        redact = false;

        var x = (startX - panX) / scale;
        var y = (startY - panY) / scale;
        var w = (endX - startX) / scale;
        var h = (endY - startY) / scale;

        // Normalise if we dragged 'backwards'!
        if (w < 0) {
            x = w + x;
            w = Math.abs(w);
        }
        if (h < 0) {
            y = h + y;
            h = Math.abs(h);
        }

        // redaction area covers at least part of the image
        if (x < imageSource.width && y < imageSource.height && x + w > 0 && y + h > 0) {

            // clip redaction area if it falls off the edge of the image
            if (x < 0) {
                w = w + x;
                x = 0;
            }
            if (y < 0) {
                h = h + y;
                y = 0;
            }
            if (x + w > imageSource.width) {
                w = imageSource.width - x;
            }
            if (y + h > imageSource.height) {
                h = imageSource.height - y;
            }

            console.log("end-redact: (" + x + ", " + y + ") -> (" + w + ", " + h + ")");

            redactions.push({
                x: x,
                y: y,
                w: w,
                h: h
            });
        }
    }

    if (pan) {
        pan = false;
        console.log("end-pan (" + panX + ", " + panY + ")");
    }

    redraw();
});


$('#canvas').mouseleave(function (e) {
    if (redact) {
        redact = false;
        redraw();
    }
});


// Handle mouse wheel zoom in / out
$('#canvas').on('wheel', function (event) {
    panAndScale(endX, endY, event.originalEvent.deltaY < 0 ? 0.1 : -0.1);

    // prevent window scrolling
    return false;
});

// Disable context menu
$("#canvas").bind('contextmenu', function (e) {
    return false;
});


// Hook up undo
$("#undo").click(function () {
    redactions.pop();
    redraw();
});


$("#zoom-in").click(function () {
    var x = imageSource.width / 2;
    var y = imageSource.height / 2;
    panAndScale(x, y, 0.1);
});


$("#zoom-out").click(function () {
    var scalechange = -0.2;
    scale += scalechange;

    redraw();
});

$("#rotate").click(function (e) {
    $.post(
        "/canvas/rotate",
        {
            Id: '12345',
            Redactions: redactions
        })
        .done(function (data) {
            redactions = new Array();
            panX = 0;
            panY = 0;
            scale = 1.0;
            imageSource.src = "/images/canvas-buffer/x.jpg?t=" + new Date().getMilliseconds();
        });

    e.preventDefault();
});


$("#save").click(function (e) {
    $.post(
        "/canvas",
        {
            Id: '12345',
            Redactions: redactions
        })
        .done(function (data) {
            // Just reloading for now
            redactions = new Array();
            panX = 0;
            panY = 0;
            scale = 1.0;
            imageSource.src = "/images/canvas-buffer/x.jpg?t=" + new Date().getMilliseconds();
        });

    e.preventDefault();
});
