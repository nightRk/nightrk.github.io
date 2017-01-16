var canvas;
var renderingContext;
var squareVerticesBuffer;
var shaderProgram;
var vertexPositionAttribute;
var mvMatrix;
var perspectiveMatrix;

//
// start
//
// Called when the canvas is created to get the ball rolling.
// Figuratively, that is. There's nothing moving in this demo.
//
function start() {
    canvas = document.getElementById("mainCanvas");

    initWebGL(canvas); // Initialize the GL context

    // Only continue if WebGL is available and working

    if (renderingContext !== null) {
        renderingContext.clearColor(0.0, 0.0, 0.0, 1.0);      // Clear to black, fully opaque
        renderingContext.clearDepth(1.0);                     // Clear everything
        renderingContext.enable(renderingContext.DEPTH_TEST); // Enable depth testing
        renderingContext.depthFunc(renderingContext.LEQUAL);  // Near things obscure far things

        // Initialize the shaders; this is where all the lighting for the
        // vertices and so forth is established.

        initShaders();

        // Here's where we call the routine that builds all the objects
        // we'll be drawing.

        initBuffers();

        // Set up to draw the scene periodically.

        setInterval(drawScene, 15);
    }
}

//
// initWebGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initWebGL() {
    renderingContext = null;

    try {
        renderingContext = canvas.getContext("webgl");
    }
    catch(e) {
    }

    // If we don't have a GL context, give up now

    if (renderingContext === null) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
    }
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just have
// one object -- a simple two-dimensional square.
//
function initBuffers() {

    // Create a buffer for the square's vertices.

    squareVerticesBuffer = renderingContext.createBuffer();

    // Select the squareVerticesBuffer as the one to apply vertex
    // operations to from here out.

    renderingContext.bindBuffer (
        renderingContext.ARRAY_BUFFER,
        squareVerticesBuffer
    );

    var vertices = [
        50.0,  50.0, -250.0,
       -50.0,  50.0, -250.0,
        50.0, -50.0, -250.0,
       -50.0, -50.0, -250.0
    ];    

    // Now pass the list of vertices into WebGL to build the shape. We
    // do this by creating a Float32Array from the JavaScript array,
    // then use it to fill the current vertex buffer.

    renderingContext.bufferData (
        renderingContext.ARRAY_BUFFER,
        new Float32Array(vertices),
        renderingContext.STATIC_DRAW
    );
}

//
// drawScene
//
// Draw the scene.
//
function drawScene() {
    // Clear the canvas before we start drawing on it.

    renderingContext.clear (
        renderingContext.COLOR_BUFFER_BIT |
        renderingContext.DEPTH_BUFFER_BIT
    );

    // Establish the perspective with which we want to view the
    // scene. Our field of view is 45 degrees, with a width/height
    // ratio of 640:480, and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    projectionMatrix = makePerspective (
        45,
        canvas.clientWidth / canvas.clientHeight,
        10,
        100000
    );

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.

    loadIdentity();

    // Now move the drawing position a bit to where we want to start
    // drawing the square.

    mvTranslate([-0.0, 0.0, -6.0]);

    // Draw the square by binding the array buffer to the square's vertices
    // array, setting attributes, and pushing it to GL.

    renderingContext.bindBuffer (
        renderingContext.ARRAY_BUFFER,
        squareVerticesBuffer
    );
    
    renderingContext.vertexAttribPointer (
        vertexPositionAttribute,
        3,
        renderingContext.FLOAT,
        false,
        0,
        0
    );
    
    setMatrixUniforms();
    
    renderingContext.drawArrays(renderingContext.TRIANGLE_STRIP, 0, 4);
}

//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
    var fragmentShader = getShader(renderingContext, "shader-fs");
    var vertexShader = getShader(renderingContext, "shader-vs");

    // Create the shader program

    shaderProgram = renderingContext.createProgram();
    renderingContext.attachShader(shaderProgram, vertexShader);
    renderingContext.attachShader(shaderProgram, fragmentShader);
    renderingContext.linkProgram(shaderProgram);

    // If creating the shader program failed, alert

    //if (!renderingContext.getProgramParameter(shaderProgram, renderingContext.LINK_STATUS)) {
    if (renderingContext.getProgramParameter (
            shaderProgram,
            renderingContext.LINK_STATUS
        ) === null)
    {
        alert (
            "Unable to initialize the shader program: " +
            renderingContext.getProgramInfoLog(shader)
        );
    }

    renderingContext.useProgram(shaderProgram);

    vertexPositionAttribute =
        renderingContext.getAttribLocation(shaderProgram, "vertexPosition");
    
    renderingContext.enableVertexAttribArray(vertexPositionAttribute);
}

//
// getShader
//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//
function getShader(renderingContext, id) {
    var shaderScript = document.getElementById(id);

    // Didn't find an element with the specified ID; abort.

    if (!shaderScript) {
        return null;
    }

    // Walk through the source element's children, building the
    // shader source string.

    var theSource = "";
    var currentChild = shaderScript.firstChild;

    while(currentChild) {
        if (currentChild.nodeType == 3) {
            theSource += currentChild.textContent;
        }

        currentChild = currentChild.nextSibling;
    }

    // Now figure out what type of shader script we have,
    // based on its MIME type.

    var shader;

    if (shaderScript.type == "x-shader/x-fragment") {
        shader = renderingContext.createShader (
            renderingContext.FRAGMENT_SHADER
        );
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = renderingContext.createShader (
            renderingContext.VERTEX_SHADER
        );
    } else {
        return null;  // Unknown shader type
    }

    // Send the source to the shader object

    renderingContext.shaderSource(shader, theSource);

    // Compile the shader program

    renderingContext.compileShader(shader);

    // See if it compiled successfully

    //if (!renderingContext.getShaderParameter(shader, renderingContext.COMPILE_STATUS))
    if (renderingContext.getShaderParameter (
            shader,
            renderingContext.COMPILE_STATUS
        ) === null)
    {
        alert (
            "An error occurred compiling the shaders: " +
            renderingContext.getShaderInfoLog(shader)
        );
        
        return null;
    }

    return shader;
}

//
// Matrix utility functions
//

function loadIdentity() {
    mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
    mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
    multMatrix (
        Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4()
    );
}

function setMatrixUniforms() {
    var transform = projectionMatrix.x(mvMatrix);

    var transformUniform =
        renderingContext.getUniformLocation(shaderProgram, "transform");
    
    renderingContext.uniformMatrix4fv (
        transformUniform,
        false,
        new Float32Array(transform.flatten())
    );
}
