WHVR.init = function () {
    WHVR.fog.init();
    WHVR.game.init();
    WHVR.hud.init();

    window.addEventListener('deviceorientation', function(eventData){
        // 设备绕 y 轴旋转的角度，前倾为正
        var tiltLR = eventData.gamma;
        // 设备绕 x 轴旋转的角度，右倾为正
        var tiltFB = eventData.beta;
        // 设备面向的指南针方向
        var dir = eventData.alpha

        // Orientation Event
        WHVR.game.deviceOrientationHandler(tiltLR, tiltFB, dir);
        
    }, false);

    var update = function (dt) {
        WHVR.fog.update(dt);
        WHVR.game.update(dt);
        WHVR.hud.update(dt);

        WHVR.fog.updateDOM();
        WHVR.game.updateDOM();
        WHVR.hud.updateDOM();
    }

    var lastTick = 0;
    var zeroCounter = 0;
    var useFallback = false;

    if (!window.requestAnimationFrame) useFallback = true;

    var mainLoop = function(thisTick) {
        var dt;

        if (!thisTick) zeroCounter += 1;
        else zeroCounter = 0;

        if (zeroCounter > 10) useFallback = true;

        thisTick = thisTick || 0;
        if (useFallback) dt = 1/30;
        else var dt = (thisTick - lastTick) / 1000;

        if (dt > 1/10) dt = 1/10;

        lastTick = thisTick;

        update(dt);

        if (useFallback) window.setTimeout(mainLoop, 1000 / 30);
        else window.requestAnimationFrame(mainLoop);
    }
    mainLoop();
}

WHVR.init();
