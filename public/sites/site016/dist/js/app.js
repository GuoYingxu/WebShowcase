(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var ViewCtrl = require('./view/viewCtrl');
//var MainStage = require('./3D/mainStage');

var Webapp = function () {

    function Webapp() {

        //禁用微信的下拉
        $('body').on('touchmove', function (event) {
            event.preventDefault();
        });

        var viewCtrl = new ViewCtrl();

        //var mainStage = new MainStage();
    }

    return Webapp;
}();

$(document).ready(function () {
    var app = new Webapp();
});

},{"./view/viewCtrl":3}],2:[function(require,module,exports){
/* ==================================================================================
 * mainStage.js
 * 3D场景控制
 * ================================================================================== */

var Stage3D = function () {
    var mainStage = new C3D.Stage();
    var myCube = new C3D.Skybox();

    var lastMouseX = 0;
    var lastMouseY = 0;
    var curMouseX = 0;
    var curMouseY = 0;
    var lastAngleX = 0;
    var lastAngleY = 0;
    var angleX = 0;
    var angleY = 0;
    var lastMoveEvt = null;
    var frameTimer;
    var timeoutTimer;

    //刷新场景
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame || function (callback) {
        setTimeout(callback, 1000 / 60);
    };

    function Stage3D() {
        this.initStage();
    }

    Stage3D.prototype.initStage = function () {
        create3D();
        this.resize();
        $('#main').on("mousedown touchstart", mouseDownHandler);
        $('#main').on("mouseup touchend", mouseUpHandler);
    };

    //响应屏幕调整尺寸
    Stage3D.prototype.resize = function () {
        mainStage.size(window.innerWidth, window.innerHeight).update();
    };

    var create3D = function () {
        mainStage.size(window.innerWidth, window.innerHeight).material({
            color: "#f0f0f0"
        }).update();
        document.getElementById('main').appendChild(mainStage.el);

        //创建1个立方体放入场景
        myCube.size(1024, 1024, 1024).position(0, 0, 0).material({
            front: { image: "dist/images/boxes/skybox_FR.jpg" },
            back: { image: "dist/images/boxes/skybox_BK.jpg" },
            left: { image: "dist/images/boxes/skybox_RT.jpg" },
            right: { image: "dist/images/boxes/skybox_LF.jpg" },
            up: { image: "dist/images/boxes/skybox_UP.jpg" },
            down: { image: "dist/images/boxes/skybox_DN.jpg" }
        }).update();
        mainStage.addChild(myCube);
    };

    var mouseDownHandler = function (evt) {
        console.log(evt);
        lastMouseX = evt.pageX || evt.originalEvent.touches[0].pageX;
        lastMouseY = evt.pageY || evt.originalEvent.touches[0].pageY;
        lastAngleX = angleX;
        lastAngleY = angleY;
        curMouseX = evt.pageX || evt.originalEvent.touches[0].pageX;
        curMouseY = evt.pageY || evt.originalEvent.touches[0].pageY;
        lastMoveEvt = evt;

        clearTimeout(timeoutTimer);

        $('#main').on("mousemove touchmove", mouseMoveHandler);
        window.cancelAnimationFrame(frameTimer);
        frameTimer = requestAnimationFrame(go);
    };

    var mouseMoveHandler = function (evt) {
        curMouseX = evt.pageX || evt.originalEvent.touches[0].pageX;
        curMouseY = evt.pageY || evt.originalEvent.touches[0].pageY;
        lastMoveEvt = evt;
    };

    var mouseUpHandler = function (evt) {
        curMouseX = lastMoveEvt.pageX || lastMoveEvt.originalEvent.touches[0].pageX;
        curMouseY = lastMoveEvt.pageY || lastMoveEvt.originalEvent.touches[0].pageY;

        $('#main').unbind("mousemove touchmove");

        timeoutTimer = setTimeout(function () {
            window.cancelAnimationFrame(frameTimer);
        }, 2500);
    };

    var go = function () {
        angleX += (curMouseX - lastMouseX + lastAngleX - angleX) * 0.1;
        angleY += (curMouseY - lastMouseY + lastAngleY - angleY) * 0.1;
        angleY = Math.max(-80, Math.min(80, angleY));

        mainStage.camera.rotation(-0.1 * angleY, angleX * 0.2, 0).updateT();

        frameTimer = requestAnimationFrame(go);
    };

    return Stage3D;
}();

module.exports = Stage3D;

},{}],3:[function(require,module,exports){
/* ==================================================================================
 * viewCtrl.js
 * 界面视图相关控制
 * ================================================================================== */

var Stage3D = require('./3D/stage3D');

var ViewCtrl = function () {
    var winSize = {
        width: 0,
        height: 0
    };

    function ViewCtrl() {
        this.initLayout();
        var stage3D = new Stage3D();

        $(window).resize(function () {
            setResponsive();
            stage3D.resize();
        });
    }

    ViewCtrl.prototype.initLayout = function () {

        $('.touch-active').on('touchstart mouseover', function () {
            $(this).addClass('active');
        });
        $('.touch-active').on('touchmove touchend mouseout', function () {
            $(this).removeClass('active');
        });

        setResponsive();
    };

    var getWinSize = function () {
        if (window.innerHeight) {
            winSize.height = window.innerHeight;
            winSize.width = window.innerWidth;
        } else if (document.body && document.body.clientHeight) {
            winSize.height = document.body.clientHeight;
            winSize.width = document.body.clientWidth;
        } else {
            winSize.height = document.documentElement.clientHeight;
            winSize.width = document.documentElement.clientWidth;
        }

        return winSize;
    };

    var setResponsive = function () {
        getWinSize();
        //alert(checkMobile());
        if (checkMobile()) {
            var winWidth = winSize.width <= 320 ? 320 : winSize.width >= 640 ? 640 : winSize.width;
            var baseFontsize = 80;
            var currentFontSize = winWidth / 320 * baseFontsize;
            //alert(currentFontSize);
            //alert(winWidth);
            $('html').css('fontSize', currentFontSize + 'px');
        }
    };

    var checkMobile = function () {
        var sUserAgent = navigator.userAgent.toLowerCase();
        //var bIsIpad = sUserAgent.match(/ipad/i) == "ipad";
        var bIsIphoneOs = sUserAgent.match(/iphone os/i) == "iphone os";
        var bIsMidp = sUserAgent.match(/midp/i) == "midp";
        var bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
        var bIsUc = sUserAgent.match(/ucweb/i) == "ucweb";
        var bIsAndroid = sUserAgent.match(/android/i) == "android";
        var bIsCE = sUserAgent.match(/windows ce/i) == "windows ce";
        var bIsWM = sUserAgent.match(/windows mobile/i) == "windows mobile";
        if ( /*bIsIpad || */bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM) {
            return true;
        }
        return false;
    };

    return ViewCtrl;
}();

module.exports = ViewCtrl;

},{"./3D/stage3D":2}]},{},[1]);
