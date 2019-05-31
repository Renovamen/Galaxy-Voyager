MG.hud = (function () {
    var mRootNode;

    var mRadar;
    var mSpeedometer;
    var mLevelIndicator;
    var mProgressIndicator;

    return {

        init: function () {
            mRootNode = document.getElementById('hud');

            // ----------------------------------------------------------- Radar

            mRadar = (function () {
                var mMissilePositionDot = document.getElementById('hud-radar-scope-missile');
                var mMissileTargetDot = document.getElementById('hud-radar-scope-missile-target');

                var mMissileTarget = {x: 0.0, y: 0.0};
                var mMissilePosition = {x: 0.0, y: 0.0};

                return {
                    update: function (dt) {
                        mMissileTarget = MG.missile.getTarget();
                        mMissilePosition = MG.missile.getPosition();
                        // PASS
                    },
                    updateDOM: function () {
                        var x,y;
                        var scopeRadius = 0.5;

                        /* Set the position of the dot indicating the intended target of the missile */
                        x = scopeRadius + 0.95 * scopeRadius * mMissileTarget.x
                                               / MG.TUNNEL_RADIUS;
                        y = scopeRadius + 0.95 * scopeRadius * mMissileTarget.y
                                               / MG.TUNNEL_RADIUS;

                        mMissileTargetDot.setAttribute('cx', String(x));
                        mMissileTargetDot.setAttribute('cy', String(y));

                        /* Set the position of the dot indicating the actual position of the missile */
                        x = scopeRadius + 0.95 * scopeRadius * mMissilePosition.x
                                               / MG.TUNNEL_RADIUS;
                        y = scopeRadius + 0.95 * scopeRadius * mMissilePosition.y
                                               / MG.TUNNEL_RADIUS;

                        mMissilePositionDot.setAttribute('cx', String(x));
                        mMissilePositionDot.setAttribute('cy', String(y));
                    }
                };
            }());



            // ----------------------------------------------------- Speedometer

            mSpeedometer = (function () {
                var mBarNode = document.getElementById('hud-speedometer-bar');

                var mTextNode = document.createTextNode('');
                document.getElementById('hud-speedometer-speed-text').appendChild(mTextNode);
            
                var mSpeed = 0.0;

                return {
                    update: function (dt) {
                        mSpeed = MG.missile.getVelocity();
                    },
                    updateDOM: function () {
                        mTextNode.data = mSpeed.toFixed(0);
                        
                        // TODO (possibly) work out the maximum speed properly and put a cap on the level with a nice victory screen
                        mBarNode.setAttribute('x', mSpeed/2000 - 1);
                    }
                };
            } ());

            // ---------------------------------------------- Progress Indicator
            mProgressIndicator = (function () {
                var mProgressMarkNode = document.getElementById('hud-progress-indicator-progress');
                var mBestProgressMarkNode = document.getElementById('hud-progress-indicator-best-progress');

                var mProgress = 0.0;
                var mBestProgress = 0.0;

                return {
                    update: function (dt) {
                        mProgress = MG.game.getProgress();
                        mBestProgress = MG.game.getBestProgress();
                    },

                    updateDOM: function () {
                        mProgressMarkNode.setAttribute('transform', 'translate(0,'+mProgress+')');
                        mBestProgressMarkNode.setAttribute('transform', 'translate(0,'+mBestProgress+')');
                    }
                };
            } ());

            mRootNode.setAttribute('visibility', 'visible');
        },

        update: function (dt) {
            mRadar.update(dt);
            mSpeedometer.update(dt);
            mProgressIndicator.update(dt);
        },

        updateDOM: function () {
            mRadar.updateDOM();
            mSpeedometer.updateDOM();
            mProgressIndicator.updateDOM();
        }
    };
}());
