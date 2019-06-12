WHVR.hud = (function () {
    var mRootNode;

    var mRadar;
    var mSpeedometer;
    var mProgressIndicator;

    return {

        init: function () {
            mRootNode = document.getElementById('hud');

            // 方向雷达
            mRadar = (function () {
                var mMissilePositionDot = document.getElementById('hud-radar-scope-missile');
                var mMissileTargetDot = document.getElementById('hud-radar-scope-missile-target');

                var mMissileTarget = {x: 0.0, y: 0.0};
                var mMissilePosition = {x: 0.0, y: 0.0};

                return {
                    update: function (dt) {
                        mMissileTarget = WHVR.missile.getTarget();
                        mMissilePosition = WHVR.missile.getPosition();
                    },
                    updateDOM: function () {
                        var x,y;
                        var scopeRadius = 0.5;

                        // 雷达显示 继续向当前方向移动视角 视角点将要到达的位置
                        x = scopeRadius + 0.95 * scopeRadius * mMissileTarget.x
                                               / WHVR.TUNNEL_RADIUS;
                        y = scopeRadius + 0.95 * scopeRadius * mMissileTarget.y
                                               / WHVR.TUNNEL_RADIUS;

                        mMissileTargetDot.setAttribute('cx', String(x));
                        mMissileTargetDot.setAttribute('cy', String(y));

                        // 雷达显示当前视角点的位置
                        x = scopeRadius + 0.95 * scopeRadius * mMissilePosition.x
                                               / WHVR.TUNNEL_RADIUS;
                        y = scopeRadius + 0.95 * scopeRadius * mMissilePosition.y
                                               / WHVR.TUNNEL_RADIUS;

                        mMissilePositionDot.setAttribute('cx', String(x));
                        mMissilePositionDot.setAttribute('cy', String(y));
                    }
                };
            }());



            // 速度计
            mSpeedometer = (function () {
                var mBarNode = document.getElementById('hud-speedometer-bar');

                var mTextNode = document.createTextNode('');
                document.getElementById('hud-speedometer-speed-text').appendChild(mTextNode);
            
                var mSpeed = 0.0;

                return {
                    update: function (dt) {
                        mSpeed = WHVR.missile.getVelocity();
                    },
                    updateDOM: function () {
                        mTextNode.data = mSpeed.toFixed(0);
                        mBarNode.setAttribute('x', mSpeed/2000 - 1);
                    }
                };
            } ());

            // 进度条
            mProgressIndicator = (function () {
                var mProgressMarkNode = document.getElementById('hud-progress-indicator-progress');
                var mBestProgressMarkNode = document.getElementById('hud-progress-indicator-best-progress');

                var mProgress = 0.0;
                var mBestProgress = 0.0;

                return {
                    update: function (dt) {
                        mProgress = WHVR.game.getProgress();
                        mBestProgress = WHVR.game.getBestProgress();
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
