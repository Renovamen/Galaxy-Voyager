WH.game = (function () {

    /** Constants **/
    var GameState = {
        WAIT_START: 'wait_start',
        STARTING:   'starting',
        RUNNING:    'running',
        FINISHED:   'finished',
        CRASHED:    'crashed'
    }

    var STARTING_LIVES = 5;

    var LEVEL_NUM_BARRIERS = 20;

    /** Variables **/
    var mState = GameState.WAIT_START;

    var mLives = STARTING_LIVES;
    var mLevel = 0;

    var mRemainingBarriers = 0;
    var mBarriersToPass = 0;

    var mProgress = 0.0;
    var mBestProgress = 0.0;

    /* Strings for UI ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
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
            title: function () {return 'COMPLETED';},
            text:  function () {return 'CLICK TO CONTINUE';}
        }
    };



    var getLevelStartVelocity   = function (level) {
        return 300 + 100 * level;
    }

    var getLevelFinishVelocity  = function (level) {
        return 400 + 100 * level;
    }

    var getPreLevelIdleVelocity = function (level) {
        return 350 + 100 * level;
    }

    var getPostLevelIdleVelocity = function (level) {
        return 550 + 100 * level;
    }

    var playCrashAnimation = function () {
        // TODO move drawing out of the update loop

        // create a copy of the explosion element
        var explosion = document.getElementById('explosion');

        // play the animation
        explosion.firstChild.beginElement();
        explosion.setAttribute('visibility', 'visible');

        // TODO can't seem to get a callback to fire when the animation
        // finishes. Use timeout instead
        setTimeout(function (){
            var explosion = document.getElementById('explosion');
            explosion.setAttribute('visibility', 'hidden');
        }, 400);
    }

    var goWaitStartLevel = function () {
        WH.banner.show(Messages.START.title(), Messages.START.text());
        WH.util.showMouse();

        WH.missile.setAutopilot();
        WH.missile.setVelocity(getPreLevelIdleVelocity(mLevel));

        if (mLevel === 0) {mLives = Infinity;}

        mState = GameState.WAIT_START;
    }

    var goRun = function () {
        WH.banner.hide();
        WH.util.hideMouse();

        /* TODO should the start barrier be pushed here?
        If so, should all of the barriers for the entire level be pushed as well? */
        mRemainingBarriers = LEVEL_NUM_BARRIERS;
        WH.barrierQueue.pushBarrier(WH.BarrierType.START);

        mBarriersToPass = LEVEL_NUM_BARRIERS;

        WH.missile.setManual();

        mState = GameState.STARTING;
    }

    var goFinish = function () {
        WH.banner.show(Messages.FINISH.title(), Messages.FINISH.text());
        WH.util.showMouse();

        WH.missile.setAutopilot();
        WH.missile.setVelocity(getPostLevelIdleVelocity(mLevel));

        mState = GameState.FINISHED;
    }

    var goCrash = function () {
        WH.util.showMouse();

        if (mLives === 0) WH.banner.show(Messages.GAME_OVER.title(), Messages.GAME_OVER.text());
        else WH.banner.show(Messages.CRASH.title(), Messages.CRASH.text());

        playCrashAnimation()
        mState = GameState.CRASHED;
    }

    return {
        init: function () {
            var rootNode = document.getElementById('tunnel');

            WH.missile.init();

            var wallNode;
            wallNode = document.createElementNS(NAMESPACE_SVG, 'g');
            wallNode.setAttribute('transform', 'scale(1,-1)');
            WH.tunnelWall.init(wallNode);
            rootNode.appendChild(wallNode);


            var barrierQueueNode;
            barrierQueueNode = document.createElementNS(NAMESPACE_SVG, 'g');
            barrierQueueNode.setAttribute('transform', 'scale(1,-1)');
            WH.barrierQueue.init(barrierQueueNode);
            rootNode.appendChild(barrierQueueNode);


            goWaitStartLevel();

            rootNode.setAttribute('visibility', 'visible');
        },


        update: function (dt) {
            WH.missile.update(dt);    
            WH.tunnelWall.update(dt);
            WH.barrierQueue.update(dt);    

            /* check whether the nearest barrier has been reached and whether the missile collides with it. */
            if (!WH.barrierQueue.isEmpty()) {
                if (WH.missile.getOffset() < WH.MISSILE_LENGTH && !WH.missile.isCrashed()){
                    var barrier = WH.barrierQueue.nextBarrier();

                    if (barrier.collides(WH.missile.getPosition().x, WH.missile.getPosition().y)) {
                        // CRASH
                        WH.missile.onCrash();
                        goCrash();
                    } 
                    else {
                        // BARRIER PASSED
                        WH.barrierQueue.popBarrier();
                        WH.missile.onBarrierPassed();

                        // TODO this block makes loads of assumptions about state
                        if (mState === GameState.RUNNING || mState === GameState.STARTING) {
                            switch(barrier.getType()) {
                                case WH.BarrierType.FINISH:
                                    goFinish();
                                    break;
                                case WH.BarrierType.BLANK:
                                    break;
                                case WH.BarrierType.START:
                                    mState = GameState.RUNNING;
                                    // FALLTHROUGH
                                default:
                                    mBarriersToPass--;

                                    var startVelocity = getLevelStartVelocity(mLevel);
                                    var finishVelocity = getLevelFinishVelocity(mLevel);

                                    WH.missile.setVelocity(startVelocity
                                                            + (startVelocity - finishVelocity)
                                                            * (mBarriersToPass - LEVEL_NUM_BARRIERS)
                                                                / LEVEL_NUM_BARRIERS);
                                    break;
                            }
                        }
                    }
                }    
            }

        
            /* Pad the barrier queue with blank barriers so that there are barriers
            as far as can be seen. */
            while (WH.barrierQueue.numBarriers() < WH.LINE_OF_SIGHT/WH.BARRIER_SPACING) {
                var type = WH.BarrierType.BLANK;
    
                if (mState === GameState.RUNNING || mState === GameState.STARTING) {
                    mRemainingBarriers--;
                    if (mRemainingBarriers > 0) type = WH.BarrierType.RANDOM;
                    else if (mRemainingBarriers === 0) type = WH.BarrierType.FINISH;
                    else type = WH.BarrierType.BLANK;
                }
    
                WH.barrierQueue.pushBarrier(type);
            }

            /* Update progress */
            switch (mState) {
                case GameState.RUNNING:
                    mProgress = 1 - (mBarriersToPass*WH.BARRIER_SPACING + WH.missile.getOffset())/(LEVEL_NUM_BARRIERS * WH.BARRIER_SPACING);
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
            var position = WH.missile.getPosition();
            var offset = WH.missile.getOffset();

            WH.barrierQueue.updateDOM(-position.x, -position.y, offset);
            WH.tunnelWall.updateDOM(-position.x, -position.y, offset);
        },

        onMouseMove: function (x, y) {
            var windowWidth = window.innerWidth;
            var windowHeight = window.innerHeight;

            WH.missile.setTarget(x - 0.5*windowWidth, -(y - 0.5*windowHeight));
        },

        onMouseClick: function () {
            if (WH.banner.isFullyVisible()) {
                switch (mState) {
                    case GameState.WAIT_START:
                        goRun();
                        break;
                    case GameState.FINISHED:
                        /* The player is given an infinite number of lives
                        during the qualifying level but these should be
                        removed before continuing. */
                        if (mLevel === 0) {mLives = STARTING_LIVES;}

                        mLevel++;

                        mBestProgress = 0.0;

                        goWaitStartLevel();
                        break;
                    case GameState.CRASHED:
                        WH.banner.hide();
                        WH.fog.fadeIn(function() {
                            if (mLives === 0) {
                                mLevel = 0;
                                mLives = STARTING_LIVES;
                                mBestProgress = 0.0;
                            } 
                            else mLives--;

                            WH.missile.reset();
                            WH.barrierQueue.reset();

                            WH.fog.fadeOut();
                            goWaitStartLevel();
                        });
                        break;
                }
            }
        },

        /* Returns an integer representing the current level */
        getLevel: function () {
            return mLevel;
        },

        /* Returns a human readable string describing the current level */
        getLevelString: getLevelString,

        /* Returns the number of times the player can crash before game over. */
        /* If the player crashes with zero lives remaining the game ends */
        getNumLives: function () {
            return mLives;
        },

        /* Returns the progress through the level as a value between 0 and 1,
        where 0 is not yet started and 1 is completed. */
        getProgress: function () {
            return mProgress;       
        },

        getBestProgress: function () {
            return mBestProgress;
        }
    };
}());