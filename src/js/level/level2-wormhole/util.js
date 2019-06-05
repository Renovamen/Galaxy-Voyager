WH.util = {} ;

WH.util.hideMouse = function () {
    var i;
    for (i = 0; i < document.styleSheets.length; i++) {
        var styleSheet = document.styleSheets[i];

        if (styleSheet.title === 'style-hide-mouse') {
            styleSheet.disabled = false;
        }
    }
};

WH.util.showMouse = function () {
    var i;
    for (i = 0; i < document.styleSheets.length; i++) {
        var styleSheet = document.styleSheets[i];

        if (styleSheet.title === 'style-hide-mouse') {
            styleSheet.disabled = true;
        }
    }
};