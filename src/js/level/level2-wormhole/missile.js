WH.missile = (function () {

    var ACCELERATION_TIME_CONSTANT = 1.0;
    var DRIFT_DAMPING = 0.25;

    var MAX_RADIUS = 0.8 * WH.TUNNEL_RADIUS;

    var MissileState = {
        CRASHED:   'crashed',
        AUTOPILOT: 'autopilot',
        MANUAL:    'manual'
    }

    var mState;

    var mOffset;
    var mVelocity;
    var mTargetVelocity;

    var mX;
    var mY;

    var mTargetX;
    var mTargetY;

    var mDriftVelX;
    var mDriftVelY;
    var mDriftCounter;


    return {
        init: function () {
            this.reset();
        },


        reset: function (){
            mState = MissileState.AUTOPILOT;

            mOffset = 200.0;
            mVelocity = 0.0;
            mTargetVelocity = 400.0;

            mX = 0.0;
            mY = 0.0;

            mTargetX = 0.0;
            mTargetY = 0.0;

            mDriftVelX = 0.0;
            mDriftVelY = 0.0;
            mDriftCounter = 1.0;

        },


        update: function (dt) {

            switch (mState) {
                case MissileState.AUTOPILOT:
                    // 关卡开始前，视角方向随机变化
                    mDriftCounter -= dt;
                    if (mDriftCounter < 0) {
                        mDriftCounter = 1.1 + 0.9*Math.random();

                        mDriftVelX = (WH.TUNNEL_RADIUS*(Math.random()-0.5) - mTargetX)/1.5;
                        mDriftVelY = (WH.TUNNEL_RADIUS*(Math.random()-0.5) - mTargetY)/1.5;
                    }

                    mX += mDriftVelX * dt ;
                    mY += mDriftVelY * dt ;

                    break;

                case MissileState.MANUAL:
                    mX += (mTargetX - mX) * dt / DRIFT_DAMPING;
                    mY += (mTargetY - mY) * dt / DRIFT_DAMPING;
                    break;

                default:
            }

            // 视角不能出界
            var radius = Math.sqrt(mX*mX + mY*mY);
            var newRadius = Math.min(MAX_RADIUS, radius);

            mX = (radius === 0) ? 0 : mX*newRadius/radius;
            mY = (radius === 0) ? 0 : mY*newRadius/radius;



            if (mState === MissileState.CRASHED) {
                // 撞上障碍后的回弹效果
                mVelocity += dt*WH.BARRIER_SPACING*mVelocity / (mOffset - WH.BARRIER_SPACING);
            } 
            else mVelocity += dt*(mTargetVelocity - mVelocity) / ACCELERATION_TIME_CONSTANT;

            mOffset -= mVelocity * dt;
        },

        getPosition: function () {
            return {x: mX, y:mY};
        },

        getTarget: function () {
            return {x: mTargetX, y:mTargetY};
        },

        getOffset: function () {
            return mOffset;
        },

        getVelocity: function () {
            return mVelocity;
        },

        isCrashed: function () {
            return mState == MissileState.CRASHED;
        },

        setTarget: function (targetX, targetY) {
            if (mState === MissileState.MANUAL) {
                mTargetX = targetX;
                mTargetY = targetY;
            }
        },

        setVelocity: function (velocity) {
            mTargetVelocity = velocity;
        },


        setManual: function () {
            mState = MissileState.MANUAL;
        },

        setAutopilot: function () {
            mState = MissileState.AUTOPILOT;
        },


        onBarrierPassed: function () {
            mOffset += WH.BARRIER_SPACING;
        },

        onCrash: function () {
            mVelocity = -Math.abs(mVelocity);

            mState = MissileState.CRASHED;
        }
    };
}());