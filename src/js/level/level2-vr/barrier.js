WHVR.BarrierType = {
    RANDOM: 'random',

    BARRIER_1: 1,
    BARRIER_2: 2,
    BARRIER_3: 3,
    BARRIER_4: 4,
    BARRIER_5: 5,
    BARRIER_6: 6,

    BLANK: 'blank',
    START: 'start',
    FINISH: 'finish'
};


WHVR.NUM_RANDOM_BARRIERS = 6;

WHVR.BARRIER_PATH_IDS = {}
WHVR.BARRIER_PATH_IDS[WHVR.BarrierType.RANDOM] = '';
WHVR.BARRIER_PATH_IDS[WHVR.BarrierType.BARRIER_1] = 'barrier-path-1';
WHVR.BARRIER_PATH_IDS[WHVR.BarrierType.BARRIER_2] = 'barrier-path-2';
WHVR.BARRIER_PATH_IDS[WHVR.BarrierType.BARRIER_3] = 'barrier-path-3';
WHVR.BARRIER_PATH_IDS[WHVR.BarrierType.BARRIER_4] = 'barrier-path-4';
WHVR.BARRIER_PATH_IDS[WHVR.BarrierType.BARRIER_5] = 'barrier-path-5';
WHVR.BARRIER_PATH_IDS[WHVR.BarrierType.BARRIER_6] = 'barrier-path-6';
WHVR.BARRIER_PATH_IDS[WHVR.BarrierType.BLANK] = 'barrier-path-blank';
WHVR.BARRIER_PATH_IDS[WHVR.BarrierType.START] = 'barrier-path-blank';
WHVR.BARRIER_PATH_IDS[WHVR.BarrierType.FINISH] = 'barrier-path-finish';


WHVR.Barrier = function (type) {
    if (type === undefined) {type = WHVR.BarrierType.RANDOM;}

    var mIsInitialised = false;

    var mTheta = 0.0;
    var mDTheta = 300.0*(0.25);

    var mIsRandom = (type === WHVR.BarrierType.RANDOM);
    var mType = (type === WHVR.BarrierType.RANDOM) ? Math.ceil(WHVR.NUM_RANDOM_BARRIERS*Math.random()) : type;

    var mRootNode;
    var mFrontPath;
    var mBackPath;

    this.init = function () {

        mRootNode = document.createElementNS(NAMESPACE_SVG, 'g');

        // 障碍靠近屏幕的那一面
        mFrontPath = document.getElementById(WHVR.BARRIER_PATH_IDS[mType]).cloneNode(true);
        mFrontPath.setAttribute('class', 'barrier-path-front');

        // 另外那一面
        mBackPath = document.getElementById(WHVR.BARRIER_PATH_IDS[mType]).cloneNode(true);
        mBackPath.setAttribute('class', 'barrier-path-back');

        mRootNode.setAttribute('class', 'barrier');
        mRootNode.appendChild(mBackPath);
        mRootNode.appendChild(mFrontPath);

        mIsInitialised = true;
    };

    this.destroy = function () {
        mRootNode.parentNode.removeChild(mRootNode);
    };

    // 点 (x, y) 是否会与某障碍相撞
    this.collides = function (x, y) {
        // 点 (x, y) 相对该障碍的坐标
        var x_ =    x * Math.cos(mTheta*Math.PI/180) + y * Math.sin(mTheta*Math.PI/180);
        var y_ = -x * Math.sin(mTheta*Math.PI/180) + y * Math.cos(mTheta*Math.PI/180);

        var lineNode = document.getElementById('collision-line');
        lineNode.setAttribute('x2', x_);
        lineNode.setAttribute('y2', y_);

        var pathNode = document.getElementById(WHVR.BARRIER_PATH_IDS[mType]);

        var line = new Line(lineNode);
        var path = new Path(pathNode);

        var intersections = new Intersection.intersectShapes(path, line);

        return intersections.points.length % 2 === 1;
    };


    this.update = function (dt) {
        mTheta += mDTheta * dt;
    };


    // (x, y)：视点，offset：障碍与视点的距离
    this.updateDOM = function (x, y, offset) {
        var frontScale = WHVR.PROJECTION_PLANE_DISTANCE / 
                (Math.tan(Math.PI * WHVR.FIELD_OF_VIEW / 360.0) * (offset));

        var backScale = WHVR.PROJECTION_PLANE_DISTANCE /
                (Math.tan(Math.PI * WHVR.FIELD_OF_VIEW / 360.0) * (offset + 10));

        mFrontPath.setAttribute('transform', 'scale(' + frontScale + ') translate(' + x + ',' + y + ') rotate(' + mTheta + ')');
        mBackPath.setAttribute('transform', 'scale(' + backScale + ') translate(' + x + ',' + y + ') rotate(' + mTheta + ')');

        offset = Math.max(WHVR.LINE_OF_SIGHT - WHVR.BARRIER_SPACING ,Math.min(WHVR.LINE_OF_SIGHT,offset));
        var fog = 100 -100*(WHVR.LINE_OF_SIGHT - offset)/WHVR.BARRIER_SPACING;

        mFrontPath.setAttribute('fill',   'rgb(' + (100 + fog) + '%,'
                                                 + (100 + fog) + '%,'
                                                 + (100 + fog) + '%)');
        mBackPath.setAttribute('fill',    'rgb(' + (60 + fog) + '%,'
                                                 + (60 + fog) + '%,'
                                                 + (60 + fog) + '%)');
        mFrontPath.setAttribute('stroke', 'rgb(' + (0 + fog) + '%,'
                                                 + (0 + fog) + '%,'
                                                 + (0 + fog) + '%)');
        mBackPath.setAttribute('stroke',  'rgb(' + (0 + fog) + '%,'
                                                 + (0 + fog) + '%,'
                                                 + (0 + fog) + '%)');
    };

    this.getType = function () {
        return mType;
    };

    this.isRandom = function () {
        return mIsRandom;
    };

    this.isInitialised = function () {
        return mIsInitialised;
    };

    this.getRootNode = function () {
        return mRootNode;
    };
};