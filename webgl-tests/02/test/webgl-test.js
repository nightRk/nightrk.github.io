var mainCanvas;
var renderingContext;
var squareVerticesBuffer;
var shaderProgram;
var vertexPositionAttribute;
var transformUniform;
var modelViewMatrix;
var projectionMatrix;

//
// start
//
// Called when the canvas is created to get the ball rolling.
// Figuratively, that is. There's nothing moving in this demo.
//
function start() {
    //
    mainCanvas = document.getElementById("mainCanvas");

    initialize(); // Initialize the GL context

    // Only continue if WebGL is available and working

    if (renderingContext !== null) {
        //
        //renderingContext.clearColor(0.0, 0.0, 0.0, 1.0);      // Clear to black, fully opaque
        renderingContext.clearColor(0.25, 0.25, 0.25, 1.0);      // Clear to black, fully opaque
        renderingContext.clearDepth(1.0);                     // Clear everything
        renderingContext.enable(renderingContext.DEPTH_TEST); // Enable depth testing
        renderingContext.depthFunc(renderingContext.LEQUAL);  // Near things obscure far things

        // Initialize the shaders; this is where all the lighting for the
        // vertices and so forth is established.

        initializeShaders();

        // Here's where we call the routine that builds all the objects
        // we'll be drawing.

        initializeBuffers();

        // Set up to draw the scene periodically.

        setInterval(drawScene, 15);
    }
}

//
// initialize
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initialize() {
    //
    renderingContext = null;

    try {
        renderingContext = mainCanvas.getContext("webgl");
    }
    catch(e) {
    }

    // If we don't have a GL context, give up now

    if (renderingContext === null) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
    }
}

//
// initializeBuffers
//
// Initialize the buffers we'll need. For this demo, we just have
// one object -- a simple two-dimensional square.
//
function initializeBuffers() {
    //
    // Create a buffer for the square's vertices.

    squareVerticesBuffer = renderingContext.createBuffer();

    // Select the squareVerticesBuffer as the one to apply vertex
    // operations to from here out.

    renderingContext.bindBuffer (
        renderingContext.ARRAY_BUFFER,
        squareVerticesBuffer
    );
    
    // Now create an array of vertices for the square. Note that the Z
    // coordinate is always 0 here.

    var vertices = [
        50.0,  50.0,  0.0,
       -50.0,  50.0,  0.0,
        50.0, -50.0,  0.0,
       -50.0, -50.0,  0.0
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
    //
    // Clear the mainCanvas before we start drawing on it.

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
        mainCanvas.clientWidth / mainCanvas.clientHeight,
        10,
        100000
    );

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.

    //loadIdentity();
    modelViewMatrix = Matrix.I(4);

    // Now move the drawing position a bit to where we want to start
    // drawing the square.

    moveSquare([-0.0, 0.0, -250.0]);

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
    
    setTransformUniform();
    
    renderingContext.drawArrays(renderingContext.TRIANGLE_STRIP, 0, 4);
}

//
// initializeShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initializeShaders() {
    //
    var vertexShader =
        getShader(renderingContext, "mainVertexShader");
        
    var fragmentShader =
        getShader(renderingContext, "mainFragmentShader");

    // Create the shader program

    shaderProgram = renderingContext.createProgram();
    renderingContext.attachShader(shaderProgram, vertexShader);
    renderingContext.attachShader(shaderProgram, fragmentShader);
    renderingContext.linkProgram(shaderProgram);

    // If creating the shader program failed, alert

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
    
    transformUniform =
        renderingContext.getUniformLocation(shaderProgram, "transform");
}

//
// getShader
//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//
function getShader(renderingContext, id) {
    //
    var shaderScript = document.getElementById(id);

    // Didn't find an element with the specified ID; abort.

    if (shaderScript === null) {
        return null;
    }

    // Walk through the source element's children, building the
    // shader source string.

    var shaderSource = "";
    var currentChild = shaderScript.firstChild;

    while (currentChild !== null) {
        if (currentChild.nodeType === Node.TEXT_NODE) {
            shaderSource += currentChild.textContent;
        }

        currentChild = currentChild.nextSibling;
    }

    // Now figure out what type of shader script we have,
    // based on its MIME type.

    var shader;

    if (shaderScript.type === "x-shader/x-fragment") {
        shader = renderingContext.createShader (
            renderingContext.FRAGMENT_SHADER
        );
    } else if (shaderScript.type === "x-shader/x-vertex") {
        shader = renderingContext.createShader (
            renderingContext.VERTEX_SHADER
        );
    } else {
        return null;  // Unknown shader type
    }

    // Send the source to the shader object

    renderingContext.shaderSource(shader, shaderSource);

    // Compile the shader program

    renderingContext.compileShader(shader);

    // See if it compiled successfully

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

function moveSquare(v) {
    modelViewMatrix = modelViewMatrix.multiply (
        Matrix.Translation(Vector.create([v[0], v[1], v[2]])).ensure4x4()
    );
}

function setTransformUniform() {
    //
    var transform = projectionMatrix.multiply(modelViewMatrix);

    renderingContext.uniformMatrix4fv (
        transformUniform,
        false,
        new Float32Array(transform.flatten())
    );
}
