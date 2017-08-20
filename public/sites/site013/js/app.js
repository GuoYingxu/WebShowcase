(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var App, PageA, PageB, PageC;

PageA = require('../../components/page-1/index.coffee');

PageB = require('../../components/page-2/index.coffee');

PageC = require('../../components/page-3/index.coffee');

App = (function() {
  var _navBar, _navBtnContainer, _navBtns, _navTiyanBtn, _pageContainer, _pageItems, _pager, _pagerItems, _pagerSelector, _topBar, _topIcons, bindEvents, canGoNext, canGoNextTime, canGoNextTimer, changePage, currentIcon, currentPage, currentPos, hideTopBar, initLayout, initPager, inpageScrollSpeed, moveNav, movePage, navContaienrMright, navContainerWidth, navNum, onBtnTiYanQuHover, onBtnTiYanQuOut, onMouseWheel, onNavClick, onTopIconActive, onWinResize, pageA, pageB, pageC, pageContainerHeight, pageNum, pageTime, scrollPage, setCanGoNext, winHeight;

  hideTopBar = true;

  currentPage = 0;

  currentPos = 0;

  canGoNext = true;

  canGoNextTimer = null;

  canGoNextTime = 1000;

  pageTime = 1000;

  currentIcon = 0;

  _topBar = $('.hi-top');

  _navBar = $('.hi-nav');

  _navBtnContainer = $('.hi-nav-btn-container');

  _navBtns = $('.hi-nav-btn');

  _navTiyanBtn = $('.hi-tiyan-btn');

  _pageItems = $('.hi-item');

  _pageContainer = $('.hi-container');

  _pager = $('.hi-pager');

  _pagerItems = null;

  _pagerSelector = $('.hi-pager-selector');

  _topIcons = $('.top-icon.has-text');

  winHeight = 0;

  pageNum = _pageItems.length;

  pageContainerHeight = 0;

  navNum = _navBtns.length;

  navContainerWidth = 0;

  navContaienrMright = 0;

  inpageScrollSpeed = 100;

  pageA = new PageA();

  pageB = new PageB();

  pageC = new PageC();

  function App() {
    initPager();
    initLayout();
    bindEvents();
    window.onload = function() {
      return initLayout();
    };
  }

  initLayout = function() {
    var i, j, k, l, pagerHeight, ref, ref1, ref2;
    if (window.innerHeight) {
      winHeight = window.innerHeight;
    } else if (document.body && document.body.clientHeight) {
      winHeight = document.body.clientHeight;
    } else {
      winHeight = document.documentElement.clientHeight;
    }
    $('.full-height').css('height', winHeight + 'px');
    navContainerWidth = 0;
    for (i = j = 0, ref = navNum - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
      navContainerWidth = navContainerWidth + _navBtns.eq(i).width();
    }
    _navBtnContainer.css('width', navContainerWidth);
    navContaienrMright = -(navContainerWidth / 2);
    moveNav(currentPage);
    pageA.initLayout();
    pageB.initLayout();
    pageC.initLayout();
    for (i = k = 0, ref1 = pageNum - 1; 0 <= ref1 ? k <= ref1 : k >= ref1; i = 0 <= ref1 ? ++k : --k) {
      if (_pageItems.eq(i).height() > winHeight) {
        pagerHeight = 20 * _pageItems.eq(i).height() / winHeight;
        _pagerItems.eq(i).css('height', pagerHeight + 'px');
      }
    }
    _pager.css({
      'top': '50%',
      'margin-top': 20 - _pager.height() / 2 + 'px'
    });
    canGoNext = true;
    pageContainerHeight = 0;
    for (i = l = 0, ref2 = pageNum - 1; 0 <= ref2 ? l <= ref2 : l >= ref2; i = 0 <= ref2 ? ++l : --l) {
      pageContainerHeight = pageContainerHeight + _pageItems.eq(i).height();
    }
    _pageContainer.css('height', pageContainerHeight + 'px');
    movePage(currentPage);
    _topIcons.eq(currentIcon).addClass('active');
    return _topIcons.eq(currentIcon).find('.top-icon-text').show(200);
  };

  initPager = function() {
    var i, j, ref;
    for (i = j = 0, ref = pageNum - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
      _pager.append("<li></li>");
    }
    return _pagerItems = _pager.find('li');
  };

  bindEvents = function() {
    _pageContainer.on('mousewheel', onMouseWheel);
    $(window).on('resize', onWinResize);
    _navBtns.on('click', onNavClick);
    _topIcons.on('mouseover', onTopIconActive);
    $('#btn_tiyanqu').on('mouseover', onBtnTiYanQuHover);
    return $('#btn_tiyanqu').on('mouseout', onBtnTiYanQuOut);
  };

  onMouseWheel = function(e) {
    return scrollPage(e.deltaY);
  };

  onNavClick = function(e) {
    if (currentPage !== $(this).index()) {
      changePage($(this).index());
      return canGoNext = true;
    }
  };

  onWinResize = function(e) {
    return initLayout();
  };

  onTopIconActive = function(e) {
    var iconId;
    iconId = $(this).index();
    if (iconId !== currentIcon) {
      _topIcons.eq(currentIcon).removeClass('active');
      _topIcons.eq(currentIcon).find('.top-icon-text').hide(200);
      _topIcons.eq(iconId).addClass('active');
      _topIcons.eq(iconId).find('.top-icon-text').show(200);
      return currentIcon = iconId;
    }
  };

  onBtnTiYanQuHover = function(e) {
    return $('#top_tip').show();
  };

  onBtnTiYanQuOut = function(e) {
    return $('#top_tip').hide();
  };

  scrollPage = function(direction) {
    var i, inPageScroll, j, ref, scrollEndPos, scrollStartPos, targetPagerPos, targetPos;
    inPageScroll = false;
    scrollStartPos = 0;
    scrollEndPos = 0;
    if (_pageItems.eq(currentPage).height() > winHeight && _pageItems.eq(currentPage).offset().top <= 0 && _pageItems.eq(currentPage).offset().top >= winHeight - _pageItems.eq(currentPage).height()) {
      inPageScroll = true;
      for (i = j = 0, ref = currentPage; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
        if (i === 0) {
          scrollStartPos = 0;
          scrollEndPos = -_pageItems.eq(0).height();
        } else {
          scrollStartPos = scrollStartPos - _pageItems.eq(i - 1).height();
          scrollEndPos = scrollEndPos - _pageItems.eq(i).height();
        }
      }
      scrollEndPos = scrollEndPos + winHeight;
    }
    if (direction > 0) {
      if (inPageScroll) {
        if (_pageItems.eq(currentPage).offset().top < 0) {
          canGoNext = false;
          targetPos = scrollStartPos + _pageItems.eq(currentPage).offset().top + inpageScrollSpeed;
          targetPagerPos = parseFloat(_pagerSelector.css('top')) - inpageScrollSpeed * _pagerItems.eq(currentPage).height() / _pageItems.eq(currentPage).height();
          if (targetPos >= scrollStartPos) {
            targetPagerPos = parseFloat(_pagerSelector.css('top')) - (inpageScrollSpeed - targetPos + scrollStartPos) * _pagerItems.eq(currentPage).height() / _pageItems.eq(currentPage).height();
            targetPos = scrollStartPos;
            if (canGoNextTimer) {
              clearTimeout(canGoNextTimer);
            }
            canGoNextTimer = setTimeout(setCanGoNext, canGoNextTime / 4);
          }
          _pageContainer.css('top', targetPos);
          _pagerSelector.css('top', targetPagerPos);
        }
      }
      if (canGoNext) {
        if (currentPage > 0) {
          changePage(currentPage - 1);
        }
        canGoNext = false;
        if (canGoNextTimer) {
          clearTimeout(canGoNextTimer);
        }
        return canGoNextTimer = setTimeout(setCanGoNext, canGoNextTime);
      }
    } else if (direction < 0) {
      if (inPageScroll) {
        if (_pageItems.eq(currentPage).offset().top > winHeight - _pageItems.eq(currentPage).height()) {
          canGoNext = false;
          targetPos = scrollStartPos + _pageItems.eq(currentPage).offset().top - inpageScrollSpeed;
          targetPagerPos = parseFloat(_pagerSelector.css('top')) + inpageScrollSpeed * _pagerItems.eq(currentPage).height() / _pageItems.eq(currentPage).height();
          if (targetPos <= scrollEndPos) {
            targetPagerPos = parseFloat(_pagerSelector.css('top')) + (inpageScrollSpeed - scrollEndPos + targetPos) * _pagerItems.eq(currentPage).height() / _pageItems.eq(currentPage).height();
            targetPos = scrollEndPos;
            if (canGoNextTimer) {
              clearTimeout(canGoNextTimer);
            }
            canGoNextTimer = setTimeout(setCanGoNext, canGoNextTime / 4);
          }
          _pageContainer.css('top', targetPos);
          _pagerSelector.css('top', targetPagerPos);
        }
      }
      if (canGoNext) {
        if (currentPage < pageNum - 1) {
          changePage(currentPage + 1);
        }
        canGoNext = false;
        if (canGoNextTimer) {
          clearTimeout(canGoNextTimer);
        }
        return canGoNextTimer = setTimeout(setCanGoNext, canGoNextTime);
      }
    }
  };

  changePage = function(targetPage) {
    movePage(targetPage);
    moveNav(targetPage);
    if (targetPage === 0) {
      pageA.startSlider();
    } else if (targetPage === 1) {
      pageB.initLayout();
    } else if (targetPage === 2) {
      pageC.initLayout();
    }
    return currentPage = targetPage;
  };

  setCanGoNext = function() {
    return canGoNext = true;
  };

  movePage = function(page) {
    var i, j, ref, targetPos;
    targetPos = 0;
    if (page >= 1) {
      for (i = j = 1, ref = page; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
        if (i < page) {
          targetPos = targetPos - _pageItems.eq(i).height();
        } else {
          if (_pageItems.eq(i).height() >= winHeight) {
            targetPos = targetPos - winHeight;
          } else {
            targetPos = targetPos - _pageItems.eq(i).height();
          }
        }
      }
    }
    _pageContainer.stop().animate({
      top: targetPos
    }, {
      duration: pageTime,
      easing: 'easeInOutExpo'
    });
    return _pagerSelector.stop().animate({
      top: _pagerItems.eq(page).offset().top - _pager.offset().top + 2
    }, {
      duration: pageTime,
      easing: 'easeInOutExpo'
    });
  };

  moveNav = function(page) {
    if (page < navNum) {
      _navBtns.filter('.active').removeClass('active');
      _navBtns.eq(page).addClass('active');
    }
    if (page === 0) {
      if (hideTopBar) {
        _topBar.stop().animate({
          top: 0
        }, {
          duration: pageTime,
          easing: 'easeInOutExpo'
        });
        _navBar.stop().animate({
          top: 40,
          backgroundColor: 'rgba(255,255,255,1)'
        }, {
          duration: pageTime,
          easing: 'easeInOutExpo'
        });
      } else {
        _navBar.stop().animate({
          backgroundColor: 'rgba(255,255,255,1)'
        }, {
          duration: pageTime,
          easing: 'easeInOutExpo'
        });
      }
      _navBtnContainer.stop().animate({
        right: '0%',
        marginRight: 124
      }, {
        duration: pageTime,
        easing: 'easeInOutExpo'
      });
      return _navTiyanBtn.stop().animate({
        right: -500
      }, {
        duration: pageTime,
        easing: 'easeInOutExpo'
      });
    } else {
      if (hideTopBar) {
        _topBar.stop().animate({
          top: -40
        }, {
          duration: pageTime,
          easing: 'easeInOutExpo'
        });
        _navBar.stop().animate({
          top: 0,
          backgroundColor: 'rgba(255,255,255,0.9)'
        }, {
          duration: pageTime,
          easing: 'easeInOutExpo'
        });
      } else {
        _navBar.stop().animate({
          backgroundColor: 'rgba(255,255,255,0.9)'
        }, {
          duration: pageTime,
          easing: 'easeInOutExpo'
        });
      }
      _navBtnContainer.stop().animate({
        right: '50%',
        marginRight: navContaienrMright
      }, {
        duration: pageTime,
        easing: 'easeInOutExpo'
      });
      return _navTiyanBtn.stop().animate({
        right: 170
      }, {
        duration: pageTime,
        easing: 'easeInOutExpo'
      });
    }
  };

  return App;

})();

$(function() {
  var app;
  return app = new App();
});


},{"../../components/page-1/index.coffee":2,"../../components/page-2/index.coffee":3,"../../components/page-3/index.coffee":4}],2:[function(require,module,exports){
var PageA;

PageA = (function() {
  var _sliderBulletContainer, _sliderBullets, _sliderItems, bindEvents, changeSlider, currentSlider, initSliderBullets, nextSlider, onSliderBulletsClick, setSliderBg, showTime, sliderHeight, sliderNum, sliderTime, sliderTimer, sliderWidth;

  currentSlider = -1;

  sliderTimer = null;

  sliderTime = 5000;

  showTime = 500;

  _sliderItems = $('.slider-item');

  _sliderBulletContainer = $('.slider-bullet-container');

  _sliderBullets = null;

  sliderWidth = 0;

  sliderHeight = 0;

  sliderNum = _sliderItems.length;

  function PageA() {
    this.initLayout();
    initSliderBullets();
    this.startSlider();
    bindEvents();
  }

  PageA.prototype.initLayout = function() {
    sliderWidth = _sliderItems.eq(0).width();
    sliderHeight = _sliderItems.eq(0).height();
    setSliderBg($('#sbg_1'), 1680, 695, sliderWidth, sliderHeight);
    setSliderBg($('#sbg_2'), 1680, 695, sliderWidth, sliderHeight);
    setSliderBg($('#sbg_3'), 1680, 695, sliderWidth, sliderHeight);
    return setSliderBg($('#sbg_4'), 1680, 1037, sliderWidth, sliderHeight);
  };

  initSliderBullets = function() {
    var i, j, ref;
    for (i = j = 0, ref = sliderNum - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
      _sliderBulletContainer.append("<li></li>");
    }
    return _sliderBullets = _sliderBulletContainer.find('li');
  };

  setSliderBg = function(objBg, imgWidth, imgHeight, targetWidth, targetHeight) {
    var pct;
    pct = imgWidth / imgHeight;
    if (pct >= targetWidth / targetHeight) {
      return objBg.css({
        'width': targetHeight * pct + 'px',
        'height': targetHeight + 'px',
        'left': '50%',
        'margin-left': '-' + targetHeight * pct / 2 + 'px',
        'top': '50%',
        'margin-top': '-' + targetHeight / 2 + 'px'
      });
    } else {
      return objBg.css({
        'width': targetWidth + 'px',
        'height': targetWidth / pct + 'px',
        'left': '50%',
        'margin-left': '-' + targetWidth / 2 + 'px',
        'top': '50%',
        'margin-top': '-' + targetWidth * 0.5 / pct + 'px'
      });
    }
  };

  bindEvents = function() {
    return _sliderBullets.on('click', onSliderBulletsClick);
  };

  onSliderBulletsClick = function(e) {
    var clickId;
    clickId = $(this).index();
    if (currentSlider !== clickId) {
      changeSlider(clickId);
      clearTimeout(sliderTimer);
      return sliderTimer = setTimeout(nextSlider, sliderTime);
    }
  };

  PageA.prototype.startSlider = function() {
    if (currentSlider !== 0) {
      changeSlider(0);
      clearTimeout(sliderTimer);
      return sliderTimer = setTimeout(nextSlider, sliderTime);
    }
  };

  nextSlider = function() {
    if (currentSlider === sliderNum - 1) {
      changeSlider(0);
    } else {
      changeSlider(currentSlider + 1);
    }
    clearTimeout(sliderTimer);
    return sliderTimer = setTimeout(nextSlider, sliderTime);
  };

  changeSlider = function(sNum) {
    if (currentSlider !== sNum) {
      _sliderItems.eq(currentSlider).removeClass('instage');
      _sliderItems.eq(currentSlider).addClass('outstage');
      _sliderItems.eq(currentSlider).stop().animate({
        opacity: 0
      }, {
        duration: 500
      });
      _sliderItems.eq(sNum).addClass('instage');
      _sliderItems.eq(sNum).removeClass('outstage');
      _sliderItems.eq(sNum).stop().animate({
        opacity: 1
      }, {
        duration: 500
      });
      _sliderBullets.eq(currentSlider).removeClass('active');
      _sliderBullets.eq(sNum).addClass('active');
      return currentSlider = sNum;
    }
  };

  return PageA;

})();

module.exports = PageA;


},{}],3:[function(require,module,exports){
var PageB;

PageB = (function() {
  function PageB() {
    this.initLayout();
  }

  PageB.prototype.initLayout = function() {
    return $('.page-2-content').css({
      'left': '50%',
      'top': '50%',
      'margin-left': '-' + $('.page-2-content').width() / 2 + 'px',
      'margin-top': (60 - $('.page-2-content').height()) / 2 + 'px'
    });
  };

  return PageB;

})();

module.exports = PageB;


},{}],4:[function(require,module,exports){
var PageC;

PageC = (function() {
  function PageC() {
    this.initLayout();
  }

  PageC.prototype.initLayout = function() {
    return $('.page-3-content').css({
      'left': '50%',
      'top': '50%',
      'margin-left': '-' + $('.page-3-content').width() / 2 + 'px',
      'margin-top': (10 - $('.page-3-content').height()) / 2 + 'px'
    });
  };

  return PageC;

})();

module.exports = PageC;


},{}]},{},[1]);
