WH.init = function () {
    WH.fog.init();
    WH.banner.init();
    WH.game.init();
    WH.hud.init();

    document.addEventListener('mousemove', function(evt){
        WH.game.onMouseMove(evt.clientX, evt.clientY);
    }, false);

    window.addEventListener('mousedown', WH.game.onMouseClick, false);

    var update = function (dt) {
        WH.fog.update(dt);
        WH.game.update(dt);
        WH.hud.update(dt);
        WH.banner.update(dt);


        WH.fog.updateDOM();
        WH.game.updateDOM();
        WH.hud.updateDOM();
        WH.banner.updateDOM();
    }

    var lastTick = 0;
    var zeroCounter = 0;
    var useFallback = false;

    if (!window.requestAnimationFrame) {
        useFallback = true;
    }

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

WH.init();