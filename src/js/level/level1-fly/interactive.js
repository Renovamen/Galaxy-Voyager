// 鼠标事件
FLY.handleWindowResize = function() {
    FLY.HEIGHT = window.innerHeight;
    FLY.WIDTH = window.innerWidth;
    renderer.setSize(FLY.WIDTH, FLY.HEIGHT);
    camera.aspect = FLY.WIDTH / FLY.HEIGHT;
    camera.updateProjectionMatrix();
}

FLY.handleMouseMove = function(event) {
    var tx = -1 + (event.clientX / FLY.WIDTH)*2;
    var ty = 1 - (event.clientY / FLY.HEIGHT)*2;
    FLY.mousePos = {x:tx, y:ty};
}

FLY.handleTouchMove = function(event) {
    event.preventDefault();
    var tx = -1 + (event.touches[0].pageX / FLY.WIDTH)*2;
    var ty = 1 - (event.touches[0].pageY / FLY.HEIGHT)*2;
    FLY.mousePos = {x:tx, y:ty};
}

FLY.handleMouseUp = function(event){
    if (FLY.game.status == "waitingReplay"){
        FLY.resetGame();
        FLY.hideReplay();
    }
}

FLY.handleTouchEnd = function(event){
    if (FLY.game.status == "waitingReplay"){
        FLY.resetGame();
        FLY.hideReplay();
    }
}