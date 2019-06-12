WHVR.game = (function () {

    var GameState = {
        WAIT_START: 'wait_start',
        STARTING:   'starting',
        RUNNING:    'running',
        FINISHED:   'finished',
        CRASHED:    'crashed'
    }
    var firstload = 1;
    var sdir;
    var STARTING_LIVES = 5;
    var LEVEL_NUM_BARRIERS = 20;


    var mState = GameState.WAIT_START;

    var mLives = STARTING_LIVES;
    var mLevel = 0;

    var mRemainingBarriers = 0;
    var mBarriersToPass = 0;

    var mProgress = 0.0;
    var mBestProgress = 0.0;

    var cBarrier = WHVR.BarrierType.BARRIER_1;

    var getLevelString = function () {
        return mLevel ? 'LEVEL ' + mLevel : 'THROUGH THE WORMHOLE';
    }

    var Messages = {
        START: {
            title: getLevelString,
            text:  function () {return 'CLICK TO BEGIN';}
        },
        CRASH: {
            title: function () {return 'CRASHED';},
            text:  function () {return 'CLICK TO RETRY';}
        },
        GAME_OVER: {
            title: function () {return 'GAME OVER';},
            text:  function () {return 'CLICK TO START AGAIN';}
        },
        FINISH: {
            title: function () {return 'LEVEL COMPLETED';},
            text:  function () {return 'CLICK TO CONTINUE';}
        }
    };



    var getLevelStartVelocity   = function (level) {
        return 300 + 100*level;
    }

    var getLevelFinishVelocity  = function (level) {
        return 400 + 100*level;
    }

    var getPreLevelIdleVelocity = function (level) {
        return 350 + 100*level;
    }

    var getPostLevelIdleVelocity = function (level) {
        return 550 + 100*level;
    }

    var playCrashAnimation = function () {

        var explosion = document.getElementById('explosion');

        explosion.firstChild.beginElement();
        explosion.setAttribute('visibility', 'visible');

        setTimeout(function (){
            var explosion = document.getElementById('explosion');
            explosion.setAttribute('visibility', 'hidden');
        }, 400);
    }

    var goWaitStartLevel = function () {

        WHVR.missile.setAutopilot();
        WHVR.missile.setVelocity(getPreLevelIdleVelocity(mLevel));

        if (mLevel === 0) mLives = Infinity;

        mState = GameState.WAIT_START;

        setTimeout(function(){
            goRun();
        },2000); 
    }

    var goRun = function () {

        mRemainingBarriers = LEVEL_NUM_BARRIERS;
        WHVR.barrierQueue1.pushBarrier(WHVR.BarrierType.START);
        WHVR.barrierQueue2.pushBarrier(WHVR.BarrierType.START);

        mBarriersToPass = LEVEL_NUM_BARRIERS;

        WHVR.missile.setManual();

        mState = GameState.STARTING;
    }

    var goFinish = function () {

        WHVR.missile.setAutopilot();
        WHVR.missile.setVelocity(getPostLevelIdleVelocity(mLevel));

        mState = GameState.FINISHED;

        setTimeout(function(){
            if (mLevel === 0) {mLives = STARTING_LIVES;}
            mLevel++;
            mBestProgress = 0.0;
            goWaitStartLevel();
        },2000); 
    }

    var goCrash = function () {

        playCrashAnimation()
        mState = GameState.CRASHED;

        setTimeout(function(){
            WHVR.fog.fadeIn(function() {
                if (mLives === 0) {
                    mLevel = 0;
                    mLives = STARTING_LIVES;
                    mBestProgress = 0.0;
                } 
                else mLives--;

                WHVR.missile.reset();
                WHVR.barrierQueue1.reset();
                WHVR.barrierQueue2.reset();

                WHVR.fog.fadeOut();
                goWaitStartLevel();
            });
        },2000);
    }

    return {
        init: function () {
            var rootNode1 = document.getElementById('tunnel1');
            var rootNode2 = document.getElementById('tunnel2');

            WHVR.missile.init();

            var wallNode1;
            var wallNode2;

            wallNode1 = document.createElementNS(NAMESPACE_SVG, 'g');
            wallNode1.setAttribute('transform', 'scale(1,-1)');
            wallNode2 = document.createElementNS(NAMESPACE_SVG, 'g');
            wallNode2.setAttribute('transform', 'scale(1,-1)');

            WHVR.tunnelWall1.init(wallNode1);
            WHVR.tunnelWall2.init(wallNode2);

            rootNode1.appendChild(wallNode1);
            rootNode2.appendChild(wallNode2);

            var barrierQueueNode1;
            var barrierQueueNode2;

            barrierQueueNode1 = document.createElementNS(NAMESPACE_SVG, 'g');
            barrierQueueNode1.setAttribute('transform', 'scale(1,-1)');
            barrierQueueNode2 = document.createElementNS(NAMESPACE_SVG, 'g');
            barrierQueueNode2.setAttribute('transform', 'scale(1,-1)');

            WHVR.barrierQueue1.init(barrierQueueNode1);
            WHVR.barrierQueue2.init(barrierQueueNode2);

            rootNode1.appendChild(barrierQueueNode1);
            rootNode2.appendChild(barrierQueueNode2);

            goWaitStartLevel();

            rootNode1.setAttribute('visibility', 'visible');
            rootNode2.setAttribute('visibility', 'visible');
        },


        update: function (dt) {
            WHVR.missile.update(dt);    
            WHVR.tunnelWall1.update(dt);
            WHVR.tunnelWall2.update(dt);
            WHVR.barrierQueue1.update(dt);    
            WHVR.barrierQueue2.update(dt); 

            // 是否会撞上最近的障碍物
            if (!WHVR.barrierQueue1.isEmpty()) {
                if (WHVR.missile.getOffset() < WHVR.MISSILE_LENGTH && !WHVR.missile.isCrashed()){
                    var barrier = WHVR.barrierQueue1.nextBarrier();
                    // 撞了
                    if (barrier.collides(WHVR.missile.getPosition().x, WHVR.missile.getPosition().y)) {
                        WHVR.missile.onCrash();
                        goCrash();
                    } 
                    // 没撞
                    else {
                        WHVR.barrierQueue1.popBarrier();
                        WHVR.barrierQueue2.popBarrier();
                        WHVR.missile.onBarrierPassed();

                        if (mState === GameState.RUNNING || mState === GameState.STARTING) {
                            switch(barrier.getType()) {
                                case WHVR.BarrierType.FINISH:
                                    goFinish();
                                    break;
                                case WHVR.BarrierType.BLANK:
                                    break;
                                case WHVR.BarrierType.START:
                                    mState = GameState.RUNNING;
                                default:
                                    mBarriersToPass--;

                                    var startVelocity = getLevelStartVelocity(mLevel);
                                    var finishVelocity = getLevelFinishVelocity(mLevel);

                                    WHVR.missile.setVelocity(startVelocity
                                                            + (startVelocity - finishVelocity)
                                                            * (mBarriersToPass - LEVEL_NUM_BARRIERS)
                                                                / LEVEL_NUM_BARRIERS);
                                    break;
                            }
                        }
                    }
                }    
            }

        
            // 放置障碍物
            while (WHVR.barrierQueue1.numBarriers() < WHVR.LINE_OF_SIGHT/WHVR.BARRIER_SPACING) {
                var type = WHVR.BarrierType.BLANK;
    
                if (mState === GameState.RUNNING || mState === GameState.STARTING) {
                    mRemainingBarriers--;
                    if (mRemainingBarriers > 0) {

                        switch(cBarrier)
                        {
                            case WHVR.BarrierType.BARRIER_1:
                                type = WHVR.BarrierType.BARRIER_1;
                                cBarrier = WHVR.BarrierType.BARRIER_2;
                                break;
                            case WHVR.BarrierType.BARRIER_2:
                                type = WHVR.BarrierType.BARRIER_2;
                                cBarrier = WHVR.BarrierType.BARRIER_3;
                                break;
                            case WHVR.BarrierType.BARRIER_3:
                                type = WHVR.BarrierType.BARRIER_3;
                                cBarrier = WHVR.BarrierType.BARRIER_4;
                                break;
                            case WHVR.BarrierType.BARRIER_4:
                                type = WHVR.BarrierType.BARRIER_4;
                                cBarrier = WHVR.BarrierType.BARRIER_5;
                                break;
                            case WHVR.BarrierType.BARRIER_5:
                                type = WHVR.BarrierType.BARRIER_5;
                                cBarrier = WHVR.BarrierType.BARRIER_6;
                                break;
                            case WHVR.BarrierType.BARRIER_6:
                                type = WHVR.BarrierType.BARRIER_6;
                                cBarrier = WHVR.BarrierType.BARRIER_1;
                                break;
                        }
                    } 
                    else if (mRemainingBarriers === 0) type = WHVR.BarrierType.FINISH;
                    else type = WHVR.BarrierType.BLANK;
                }
    
                WHVR.barrierQueue1.pushBarrier(type);
                WHVR.barrierQueue2.pushBarrier(type);
            }

            // 更新进度条
            switch (mState) {
                case GameState.RUNNING:
                    mProgress = 1 - (mBarriersToPass*WHVR.BARRIER_SPACING + WHVR.missile.getOffset())/(LEVEL_NUM_BARRIERS * WHVR.BARRIER_SPACING);
                    mBestProgress = Math.max(mProgress, mBestProgress);
                    break;
                case GameState.FINISHED:
                    mProgress = 1;
                    mBestProgress = 1;
                    break;
                case GameState.STARTING:
                    mProgress = 0;
                    break;
                default:
                    break;
            }

        },

        updateDOM: function () {
            var position = WHVR.missile.getPosition();
            var offset = WHVR.missile.getOffset();

            WHVR.barrierQueue1.updateDOM(-position.x, -position.y, offset);
            WHVR.tunnelWall1.updateDOM(-position.x, -position.y, offset);
            WHVR.barrierQueue2.updateDOM(-position.x, -position.y, offset);
            WHVR.tunnelWall2.updateDOM(-position.x, -position.y, offset);
        },

        deviceOrientationHandler: function(tiltLR, tiltFB, dir) {
            var windowWidth = window.innerWidth;
            var windowHeight = window.innerHeight;
            var yval;
            var xval;

            var rtiltLR = Math.round(tiltLR);
            var rdir = Math.round(dir);

            if(firstload < 6)
            {
                sdir = rdir;
                firstload ++;
            }

            console.log(rdir, sdir);

            if ((rtiltLR <= -45) && (rtiltLR > -90))
            {
                switch (rtiltLR)
                {
                    case -45:
                        yval = -90;
                        break;
                    case -46:
                        yval = -88; 
                        break;
                    case -47:
                        yval = -86;
                        break;
                    case -48:
                        yval = -84;
                        break;
                    case -49:
                        yval = -82;
                        break;
                    case -50:
                        yval = -80;
                        break;
                    case -51:
                        yval = -78;
                        break;
                    case -52:
                        yval = -76;
                        break;
                    case -53:
                        yval = -74;
                        break;
                    case -54:
                        yval = -72;
                        break;
                    case -55:
                        yval = -70;
                        break;
                    case -56:
                        yval = -68;
                        break;
                    case -57:
                        yval = -66;
                        break;
                    case -58:
                        yval = -64;
                        break;
                    case -59:
                        yval = -62;
                        break;
                    case -60:
                        yval = -60;
                        break;
                    case -61:
                        yval = -58;
                        break;
                    case -62:
                        yval = -56; 
                        break;
                    case -63:
                        yval = -54;
                        break;
                    case -64:
                        yval = -52;
                        break;
                    case -65:
                        yval = -50;
                        break;
                    case -66:
                        yval = -48;
                        break;
                    case -67:
                        yval = -46;
                        break;
                    case -68:
                        yval = -44;
                        break;
                    case -69:
                        yval = -42;
                        break;
                    case -70:
                        yval = -40;
                        break;
                    case -71:
                        yval = -38;
                        break;
                    case -72:
                        yval = -36;
                        break;
                    case -73:
                        yval = -34;
                        break;
                    case -74:
                        yval = -32;
                        break;
                    case -75:
                        yval = -30;
                        break;
                    case -76:
                        yval = -28;
                        break;
                    case -77:
                        yval = -26;
                        break;
                    case -78:
                        yval = -24; 
                        break;
                    case -79:
                        yval = -22;
                        break;
                    case -80:
                        yval = -20;
                        break;
                    case -81:
                        yval = -18;
                        break;
                    case -82:
                        yval = -16;
                        break;
                    case -83:
                        yval = -14;
                        break;
                    case -84:
                        yval = -12;
                        break;
                    case -85:
                        yval = -8;
                        break;
                    case -86:
                        yval = -6;
                        break;
                    case -87:
                        yval = -4;
                        break;
                    case -88:
                        yval = -2;
                        break;
                    case -89:
                        yval = 0;
                        break;
                }

                if ((rdir >= sdir) && (rdir <= (sdir + 45)))
                {
                switch (rdir)
                    {
                    case sdir:
                        xval = 0;
                        break;
                    case (sdir + 1):
                        xval = -2;
                        break;
                    case (sdir + 2):
                        xval = -4;
                        break;
                    case (sdir + 3):
                        xval = -6;
                        break;
                    case (sdir + 4):
                        xval = -8;
                        break;
                    case (sdir + 5):
                        xval = -10;
                        break;
                    case (sdir + 6):
                        xval = -12;
                        break;
                    case (sdir + 7):
                        xval = -14;
                        break;
                    case (sdir + 8):
                        xval = -16;
                        break;
                    case (sdir + 9):
                        xval = -18;
                        break;
                    case (sdir + 10):
                        xval = -20;
                        break;
                    case (sdir + 11):
                        xval = -22;
                        break;
                    case (sdir + 12):
                        xval = -24;
                        break;
                    case (sdir + 13):
                        xval = -26;
                        break;
                    case (sdir + 14):
                        xval = -28;
                        break;
                    case (sdir + 15):
                        xval = -30;
                        break;
                    case (sdir + 16):
                        xval = -32;
                        break;
                    case (sdir + 17):
                        xval = -34;
                        break;
                    case (sdir + 18):
                        xval = -36;
                        break;
                    case (sdir + 19):
                        xval = -38;
                        break;
                    case (sdir + 20):
                        xval = -40;
                        break;
                    case (sdir + 21):
                        xval = -42;
                        break;
                    case (sdir + 22):
                        xval = -44;
                        break;
                    case (sdir + 23):
                        xval = -46;
                        break;
                    case (sdir + 24):
                        xval = -48;
                        break;
                    case (sdir + 25):
                        xval = -50;
                        break;
                    case (sdir + 26):
                        xval = -52;
                        break;
                    case (sdir + 27):
                        xval = -54;
                        break;
                    case (sdir + 28):
                        xval = -56;
                        break;
                    case (sdir + 29):
                        xval = -58;
                        break;
                    case (sdir + 30):
                        xval = -60;
                        break;
                    case (sdir + 31):
                        xval = -62;
                        break;
                    case (sdir + 32):
                        xval = -64;
                        break;
                    case (sdir +33):
                        xval = -66;
                        break;
                    case (sdir + 34):
                        xval = -68;
                        break;
                    case (sdir + 35):
                        xval = -70;
                        break;
                    case (sdir + 36):
                        xval = -72;
                        break;
                    case (sdir + 37):
                        xval = -74;
                        break;
                    case (sdir + 38):
                        xval = -76;
                        break;
                    case (sdir + 39):
                        xval = -78;
                        break;
                    case (sdir + 40):
                        xval = -80;
                        break;
                    case (sdir + 41):
                        xval = -82;
                        break;
                    case (sdir + 42):
                        xval = -84;
                        break;
                    case (sdir + 43):
                        xval = -86;
                        break;
                    case (sdir + 44):
                        xval = -88;
                        break;
                    case (sdir + 45):
                        xval = -90;
                        break;
                    }
                }

                if ((rdir < sdir) && (rdir >= (sdir - 45)))
                {
                switch (rdir)
                    {
                    case (sdir - 1):
                        xval = 2;
                        break;
                    case (sdir - 2):
                        xval = 4;
                        break;
                    case (sdir - 3):
                        xval = 6;
                        break;
                    case (sdir - 4):
                        xval = 8;
                        break;
                    case (sdir - 5):
                        xval = 10;
                        break;
                    case (sdir - 6):
                        xval = 12;
                        break;
                    case (sdir - 7):
                        xval = 14;
                        break;
                    case (sdir - 8):
                        xval = 16;
                        break;
                    case (sdir - 9):
                        xval = 18;
                        break;
                    case (sdir - 10):
                        xval = 20;
                        break;
                    case (sdir - 11):
                        xval = 22;
                        break;
                    case (sdir - 12):
                        xval = 24;
                        break;
                    case (sdir - 13):
                        xval = 26;
                        break;
                    case (sdir - 14):
                        xval = 28;
                        break;
                    case (sdir - 15):
                        xval = 30;
                        break;
                    case (sdir - 16):
                        xval = 32;
                        break;
                    case (sdir - 17):
                        xval = 34;
                        break;
                    case (sdir - 18):
                        xval = 36;
                        break;
                    case (sdir - 19):
                        xval = 38;
                        break;
                    case (sdir - 20):
                        xval = 40;
                        break;
                    case (sdir - 21):
                        xval = 42;
                        break;
                    case (sdir - 22):
                        xval = 44;
                        break;
                    case (sdir - 23):
                        xval = 46;
                        break;
                    case (sdir - 24):
                        xval = 48;
                        break;
                    case (sdir - 25):
                        xval = 50;
                        break;
                    case (sdir - 26):
                        xval = 52;
                        break;
                    case (sdir - 27):
                        xval = 54;
                        break;
                    case (sdir - 28):
                        xval = 56;
                        break;
                    case (sdir - 29):
                        xval = 58;
                        break;
                    case (sdir - 30):
                        xval = 60;
                        break;
                    case (sdir - 31):
                        xval = 62;
                        break;
                    case (sdir - 32):
                        xval = 64;
                        break;
                    case (sdir -33):
                        xval = 66;
                        break;
                    case (sdir - 34):
                        xval = 68;
                        break;
                    case (sdir - 35):
                        xval = 70;
                        break;
                    case (sdir - 36):
                        xval = 72;
                        break;
                    case (sdir - 37):
                        xval = 74;
                        break;
                    case (sdir - 38):
                        xval = 76;
                        break;
                    case (sdir - 39):
                        xval = 78;
                        break;
                    case (sdir - 40):
                        xval = 80;
                        break;
                    case (sdir - 41):
                        xval = 82;
                        break;
                    case (sdir - 42):
                        xval = 84;
                        break;
                    case (sdir - 43):
                        xval = 86;
                        break;
                    case (sdir - 44):
                        xval = 88;
                        break;
                    case (sdir - 45):
                        xval = 90;
                        break;
                    }
                }
                if ((rdir > (sdir + 45)) && (rdir < (sdir + 120)))
                {
                xval = -90;
                }
                if ((rdir < (sdir - 45)) && (rdir > (sdir - 120)))
                {
                xval = 90;
                }
            }

            if ((rtiltLR > -45) && (rtiltLR < 20))
            {
                yval = -90;
            }

            if ((rtiltLR <= 90) && (rtiltLR > 45))
            {
                switch (rtiltLR)
                {
                    case 90:
                        yval = 0;
                        break;
                    case 89:
                        yval = 2;
                        break;
                    case 88:
                        yval = 4;
                        break;
                    case 87:
                        yval = 6;
                        break;
                    case 86:
                        yval = 8;
                        break;
                    case 85:
                        yval = 10;
                        break;
                    case 84:
                        yval = 12;
                        break;
                    case 83:
                        yval = 14;
                        break;
                    case 82:
                        yval = 16;
                        break;
                    case 81:
                        yval = 18;
                        break;
                    case 80:
                        yval = 20;
                        break;
                    case 79:
                        yval = 22;
                        break;
                    case 78:
                        yval = 24;
                        break;
                    case 77:
                        yval = 26;
                        break;
                    case 76:
                        yval = 28;
                        break;
                    case 75:
                        yval = 30;
                        break;
                    case 74:
                        yval = 32;
                        break;
                    case 73:
                        yval = 34;
                        break;
                    case 72:
                        yval = 36;
                        break;
                    case 71:
                        yval = 38;
                        break;
                    case 70:
                        yval = 40;
                        break;
                    case 69:
                        yval = 42;
                        break;
                    case 68:
                        yval = 44;
                        break;
                    case 67:
                        yval = 46;
                        break;
                    case 66:
                        yval = 48;
                        break;
                    case 65:
                        yval = 50;
                        break;
                    case 64:
                        yval = 52;
                        break;
                    case 63:
                        yval = 54;
                        break;
                    case 62:
                        yval = 56;
                        break;
                    case 61:
                        yval = 58;
                        break;
                    case 60:
                        yval = 60;
                        break;
                    case 59:
                        yval = 62;
                        break;
                    case 58:
                        yval = 64;
                        break;
                    case 57:
                        yval = 66;
                        break;
                    case 56:
                        yval = 68;
                        break;
                    case 55:
                        yval = 70;
                        break;
                    case 54:
                        yval = 72;
                        break;
                    case 53:
                        yval = 74;
                        break;
                    case 52:
                        yval = 76;
                        break;
                    case 51:
                        yval = 80;
                        break;
                    case 50:
                        yval = 82;
                        break;
                    case 49:
                        yval = 84;
                        break;
                    case 48:
                        yval = 86;
                        break;
                    case 47:
                        yval = 88;
                        break;
                    case 46:
                        yval = 90;
                        break;
                }

                if ((rdir >= (sdir -180)) && (rdir <= ((sdir -180) + 45)))
                {
                    switch (rdir)
                    {
                    case (sdir -180):
                        xval = 0;
                        break;
                    case ((sdir -180)+ 1):
                        xval = -2;
                        break;
                    case ((sdir -180)+ 2):
                        xval = -4;
                        break;
                    case ((sdir -180)+ 3):
                        xval = -6;
                        break;
                    case ((sdir -180)+ 4):
                        xval = -8;
                        break;
                    case ((sdir -180)+ 5):
                        xval = -10;
                        break;
                    case ((sdir -180)+ 6):
                        xval = -12;
                        break;
                    case ((sdir -180)+ 7):
                        xval = -14;
                        break;
                    case ((sdir -180)+ 8):
                        xval = -16;
                        break;
                    case ((sdir -180)+ 9):
                        xval = -18;
                        break;
                    case ((sdir -180)+ 10):
                        xval = -20;
                        break;
                    case ((sdir -180)+ 11):
                        xval = -22;
                        break;
                    case ((sdir -180)+ 12):
                        xval = -24;
                        break;
                    case ((sdir -180)+ 13):
                        xval = -26;
                        break;
                    case ((sdir -180)+ 14):
                        xval = -28;
                        break;
                    case ((sdir -180)+ 15):
                        xval = -30;
                        break;
                    case ((sdir -180)+ 16):
                        xval = -32;
                        break;
                    case ((sdir -180)+ 17):
                        xval = -34;
                        break;
                    case ((sdir -180)+ 18):
                        xval = -36;
                        break;
                    case ((sdir -180)+ 19):
                        xval = -38;
                        break;
                    case ((sdir -180)+ 20):
                        xval = -40;
                        break;
                    case ((sdir -180)+ 21):
                        xval = -42;
                        break;
                    case ((sdir -180)+ 22):
                        xval = -44;
                        break;
                    case ((sdir -180)+ 23):
                        xval = -46;
                        break;
                    case ((sdir -180)+ 24):
                        xval = -48;
                        break;
                    case ((sdir -180)+ 25):
                        xval = -50;
                        break;
                    case ((sdir -180)+ 26):
                        xval = -52;
                        break;
                    case ((sdir -180)+ 27):
                        xval = -54;
                        break;
                    case ((sdir -180)+ 28):
                        xval = -56;
                        break;
                    case ((sdir -180)+ 29):
                        xval = -58;
                        break;
                    case ((sdir -180)+ 30):
                        xval = -60;
                        break;
                    case ((sdir -180)+ 31):
                        xval = -62;
                        break;
                    case ((sdir -180)+ 32):
                        xval = -64;
                        break;
                    case ((sdir -180)+ 33):
                        xval = -66;
                        break;
                    case ((sdir -180)+ 34):
                        xval = -68;
                        break;
                    case ((sdir -180)+ 35):
                        xval = -70;
                        break;
                    case ((sdir -180)+ 36):
                        xval = -72;
                        break;
                    case ((sdir -180)+ 37):
                        xval = -74;
                        break;
                    case ((sdir -180)+ 38):
                        xval = -76;
                        break;
                    case ((sdir -180)+ 39):
                        xval = -78;
                        break;
                    case ((sdir -180)+ 40):
                        xval = -80;
                        break;
                    case ((sdir -180)+ 41):
                        xval = -82;
                        break;
                    case ((sdir -180)+ 42):
                        xval = -84;
                        break;
                    case ((sdir -180)+ 43):
                        xval = -86;
                        break;
                    case ((sdir -180)+ 44):
                        xval = -88;
                        break;
                    case ((sdir -180)+ 45):
                        xval = -90;
                        break;
                    }
                }

                if ((rdir < (sdir - 180)) && (rdir >= ((sdir - 180) - 45)))
                {
                switch (rdir)
                    {
                    case ((sdir -180)- 1):
                        xval = 2;
                        break;
                    case ((sdir -180)- 2):
                        xval = 4;
                        break;
                    case ((sdir -180)- 3):
                        xval = 6;
                        break;
                    case ((sdir -180)- 4):
                        xval = 8;
                        break;
                    case ((sdir -180)- 5):
                        xval = 10;
                        break;
                    case ((sdir -180)- 6):
                        xval = 12;
                        break;
                    case ((sdir -180)- 7):
                        xval = 14;
                        break;
                    case ((sdir -180)- 8):
                        xval = 16;
                        break;
                    case ((sdir -180)- 9):
                        xval = 18;
                        break;
                    case ((sdir -180)- 10):
                        xval = 20;
                        break;
                    case ((sdir -180)- 11):
                        xval = 22;
                        break;
                    case ((sdir -180)- 12):
                        xval = 24;
                        break;
                    case ((sdir -180)- 13):
                        xval = 26;
                        break;
                    case ((sdir -180)- 14):
                        xval = 28;
                        break;
                    case ((sdir -180)- 15):
                        xval = 30;
                        break;
                    case ((sdir -180)- 16):
                        xval = 32;
                        break;
                    case ((sdir -180)- 17):
                        xval = 34;
                        break;
                    case ((sdir -180)- 18):
                        xval = 36;
                        break;
                    case ((sdir -180)- 19):
                        xval = 38;
                        break;
                    case ((sdir -180)- 20):
                        xval = 40;
                        break;
                    case ((sdir -180)- 21):
                        xval = 42;
                        break;
                    case ((sdir -180)- 22):
                        xval = 44;
                        break;
                    case ((sdir -180)- 23):
                        xval = 46;
                        break;
                    case ((sdir -180)- 24):
                        xval = 48;
                        break;
                    case ((sdir -180)- 25):
                        xval = 50;
                        break;
                    case ((sdir -180)- 26):
                        xval = 52;
                        break;
                    case ((sdir -180)- 27):
                        xval = 54;
                        break;
                    case ((sdir -180)- 28):
                        xval = 56;
                        break;
                    case ((sdir -180)- 29):
                        xval = 58;
                        break;
                    case ((sdir -180)- 30):
                        xval = 60;
                        break;
                    case ((sdir -180)- 31):
                        xval = 62;
                        break;
                    case ((sdir -180)- 32):
                        xval = 64;
                        break;
                    case ((sdir -180)- 33):
                        xval = 66;
                        break;
                    case ((sdir -180)- 34):
                        xval = 68;
                        break;
                    case ((sdir -180)- 35):
                        xval = 70;
                        break;
                    case ((sdir -180)- 36):
                        xval = 72;
                        break;
                    case ((sdir -180)- 37):
                        xval = 74;
                        break;
                    case ((sdir -180)- 38):
                        xval = 76;
                        break;
                    case ((sdir -180)- 39):
                        xval = 78;
                        break;
                    case ((sdir -180)- 40):
                        xval = 80;
                        break;
                    case ((sdir -180)- 41):
                        xval = 82;
                        break;
                    case ((sdir -180)- 42):
                        xval = 84;
                        break;
                    case ((sdir -180)- 43):
                        xval = 86;
                        break;
                    case ((sdir -180)- 44):
                        xval = 88;
                        break;
                    case ((sdir -180)- 45):
                        xval = 90;
                        break;
                    }
                }

                if ((rdir > ((sdir - 180) + 45)) && (rdir < ((sdir - 180) + 120))) xval = -90;
                if ((rdir < ((sdir - 180) - 45)) && (rdir > ((sdir - 180) - 120))) xval = 90;
            }

            if ((rtiltLR < 45) && (rtiltLR > -30)) yval = 90;
            
            if((xval*xval) + (yval*yval) <= (90* 90))  
            {
                WHVR.missile.setTarget(xval, yval);
            }
        },

        getLevel: function () {
            return mLevel;
        },

        getLevelString: getLevelString,

        getNumLives: function () {
            return mLives;
        },

        getProgress: function () {
            return mProgress;       
        },

        getBestProgress: function () {
            return mBestProgress;
        }
    };
}());