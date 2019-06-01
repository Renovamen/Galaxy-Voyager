MG.init = function () {
    MG.fog.init();
    MG.game.init();
    MG.hud.init();

    window.addEventListener('deviceorientation', function(eventData){
        // gamma is the left-to-right tilt in degrees, where right is positive
        var tiltLR = eventData.gamma;
        
        // beta is the front-to-back tilt in degrees, where front is positive
        var tiltFB = eventData.beta;
        
        // alpha is the compass direction the device is facing in degrees
        var dir = eventData.alpha
        
        // call our orientation event handler
        MG.game.deviceOrientationHandler(tiltLR, tiltFB, dir);
        
    }, false);

    var update = function (dt) {
        MG.fog.update(dt);
        MG.game.update(dt);
        MG.hud.update(dt);

        MG.fog.updateDOM();
        MG.game.updateDOM();
        MG.hud.updateDOM();
    }

    var lastTick = 0;
    var zeroCounter = 0;
    var useFallback = false;

    if (!window.requestAnimationFrame) useFallback = true;

    var mainLoop = function(thisTick) {
        var dt;

        // Some browsers don't pass in a time.  If `thisTick` isn't set for
        //  more than a few frames fall back to `setTimeout`
        if (!thisTick) zeroCounter += 1;
        else zeroCounter = 0;

        if (zeroCounter > 10) useFallback = true;

        thisTick = thisTick || 0;
        if (useFallback) dt = 1/30;
        else var dt = (thisTick - lastTick)/1000;

        // pretend that the frame rate is actually higher if it drops below
        // 10fps in order to avoid wierdness
        if (dt > 1/10) dt = 1/10;

        lastTick = thisTick;

        update(dt);

        if (useFallback) window.setTimeout(mainLoop, 1000 / 30);
        else window.requestAnimationFrame(mainLoop);
    }
    mainLoop();
}

MG.init();
