WHVR.barrierQueue1 = (function () {
    var mBarrierQueue = [];
    var mRootNode;

    var mFirstBarrierIndex = 0;

    return {
        init: function (rootNode) {
            mRootNode = rootNode;
        },

        update: function (dt) {
            var i;

            // 更新障碍队列里每一个障碍
            for (i = mFirstBarrierIndex; i < mBarrierQueue.length; i++) {
                mBarrierQueue[i].update(dt);
            }
        },

        updateDOM: function (missileX, missileY, missileOffset) {
            var i;

            // 移除已经经过的障碍
            while (mFirstBarrierIndex > 0) {
                mBarrierQueue[0].destroy();
                mBarrierQueue.shift();
                mFirstBarrierIndex --;
            }

            // 在上一个障碍后添加障碍
            for (i = 0; i < mBarrierQueue.length; i++) {
                var barrier = mBarrierQueue[i];

                if (!barrier.isInitialised()) {
                    barrier.init();

                    if (i > 0) mRootNode.insertBefore(barrier.getRootNode(), mBarrierQueue[i-1].getRootNode());
                    else mRootNode.appendChild(barrier.getRootNode());
                }
            }

            var z = 0.0;
            for (i = 0; i < mBarrierQueue.length; i++) {
                mBarrierQueue[i].updateDOM(missileX, missileY, z + missileOffset);
                z += WHVR.BARRIER_SPACING;
            }
        },

        // 障碍队列添加新障碍，初始旋转角度随机
        pushBarrier: function (type) {
            var barrier = new WHVR.Barrier(type);
            mBarrierQueue[mBarrierQueue.length] = barrier;
        },

        // 队头障碍（离屏幕最近的障碍）出队列
        popBarrier: function () {
            mFirstBarrierIndex++;
            mFirstBarrierIndex = Math.min(mFirstBarrierIndex, mBarrierQueue.length);
        },

        // 指针指向队头障碍
        nextBarrier: function () {
            return mBarrierQueue[mFirstBarrierIndex];
        },

        // 清空障碍队列
        reset: function () {
            while (mFirstBarrierIndex < mBarrierQueue.length) {
                this.popBarrier();
            }
        },

        // 若障碍队列为空，返回 true
        isEmpty: function () {
            return this.nextBarrier() === undefined;
        },


        // 队列内剩余障碍数量
        numBarriers: function () {
            return mBarrierQueue.length - mFirstBarrierIndex;
        }
    };
}());