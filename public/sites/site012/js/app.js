(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var App;

App = (function() {
  function App() {
    this.bindEvents();
    this.setSlider();
  }

  App.prototype.bindEvents = function() {
    $('.btn-mobile-menu').on('click', this.menuBtnClicked);
    return $('.mobile-menu-bg').on('click', this.menuBtnClicked);
  };

  App.prototype.setSlider = function() {
    return $('#mainCarousel').owlCarousel({
      autoPlay: true,
      slideSpeed: 300,
      paginationSpeed: 400,
      singleItem: true,
      stopOnHover: false,
      lazyLoad: true
    });
  };

  App.prototype.menuBtnClicked = function(e) {
    $('.mobile-menu-bg').toggleClass('show');
    return $('.menu').toggleClass('show');
  };

  return App;

})();

$(function() {
  var app;
  return app = new App();
});


},{}]},{},[1]);
