var renderingContext;

function start() {
    //
    var mainCanvas = document.getElementById("mainCanvas");

    // Initialize the GL context
    renderingContext = initWebGL(mainCanvas);
    
    // Only continue if WebGL is available and working
    if (renderingContext == null)
    {
        return;
    }

    // Set clear color to black, fully opaque
    renderingContext.clearColor(0.25, 0.25, 0.25, 1.0);
    //renderingContext.clearColor(0.349, 0.533, 0.482, 1.0);

    // Enable depth testing
    renderingContext.enable(renderingContext.DEPTH_TEST);

    // Near things obscure far things
    renderingContext.depthFunc(renderingContext.LEQUAL);

    // Clear the color as well as the depth buffer.
    renderingContext.clear (
        renderingContext.COLOR_BUFFER_BIT |
        renderingContext.DEPTH_BUFFER_BIT
    );
}

function initWebGL(mainCanvas) {
    //
    // Try to grab the standard context.
    renderingContext = mainCanvas.getContext("webgl");

    // If we don't have a GL context, give up now
    if (renderingContext == null)
    {
        alert("Unable to initialize WebGL. Your browser may not support it.");
    }

    return renderingContext;
}
