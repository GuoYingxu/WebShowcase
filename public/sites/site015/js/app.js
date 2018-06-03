(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Device.js
// (c) 2014 Matthew Hudson
// Device.js is freely distributable under the MIT license.
// For all details and documentation:
// http://matthewhudson.me/projects/device.js/

(function () {

  var device, previousDevice, addClass, documentElement, find, handleOrientation, hasClass, orientationEvent, removeClass, userAgent;

  // Save the previous value of the device variable.
  previousDevice = window.device;

  device = {};

  // Add device as a global object.
  window.device = device;

  // The <html> element.
  documentElement = window.document.documentElement;

  // The client user agent string.
  // Lowercase, so we can use the more efficient indexOf(), instead of Regex
  userAgent = window.navigator.userAgent.toLowerCase();

  // Main functions
  // --------------

  device.ios = function () {
    return device.iphone() || device.ipod() || device.ipad();
  };

  device.iphone = function () {
    return !device.windows() && find('iphone');
  };

  device.ipod = function () {
    return find('ipod');
  };

  device.ipad = function () {
    return find('ipad');
  };

  device.android = function () {
    return !device.windows() && find('android');
  };

  device.androidPhone = function () {
    return device.android() && find('mobile');
  };

  device.androidTablet = function () {
    return device.android() && !find('mobile');
  };

  device.blackberry = function () {
    return find('blackberry') || find('bb10') || find('rim');
  };

  device.blackberryPhone = function () {
    return device.blackberry() && !find('tablet');
  };

  device.blackberryTablet = function () {
    return device.blackberry() && find('tablet');
  };

  device.windows = function () {
    return find('windows');
  };

  device.windowsPhone = function () {
    return device.windows() && find('phone');
  };

  device.windowsTablet = function () {
    return device.windows() && find('touch') && !device.windowsPhone();
  };

  device.fxos = function () {
    return (find('(mobile;') || find('(tablet;')) && find('; rv:');
  };

  device.fxosPhone = function () {
    return device.fxos() && find('mobile');
  };

  device.fxosTablet = function () {
    return device.fxos() && find('tablet');
  };

  device.meego = function () {
    return find('meego');
  };

  device.cordova = function () {
    return window.cordova && location.protocol === 'file:';
  };

  device.nodeWebkit = function () {
    return typeof window.process === 'object';
  };

  device.mobile = function () {
    return device.androidPhone() || device.iphone() || device.ipod() || device.windowsPhone() || device.blackberryPhone() || device.fxosPhone() || device.meego();
  };

  device.tablet = function () {
    return device.ipad() || device.androidTablet() || device.blackberryTablet() || device.windowsTablet() || device.fxosTablet();
  };

  device.desktop = function () {
    return !device.tablet() && !device.mobile();
  };

  device.television = function () {
    var i, tvString;

    television = ["googletv", "viera", "smarttv", "internet.tv", "netcast", "nettv", "appletv", "boxee", "kylo", "roku", "dlnadoc", "roku", "pov_tv", "hbbtv", "ce-html"];

    i = 0;
    while (i < television.length) {
      if (find(television[i])) {
        return true;
      }
      i++;
    }
    return false;
  };

  device.portrait = function () {
    return window.innerHeight / window.innerWidth > 1;
  };

  device.landscape = function () {
    return window.innerHeight / window.innerWidth < 1;
  };

  // Public Utility Functions
  // ------------------------

  // Run device.js in noConflict mode,
  // returning the device variable to its previous owner.
  device.noConflict = function () {
    window.device = previousDevice;
    return this;
  };

  // Private Utility Functions
  // -------------------------

  // Simple UA string search
  find = function (needle) {
    return userAgent.indexOf(needle) !== -1;
  };

  // Check if documentElement already has a given class.
  hasClass = function (className) {
    var regex;
    regex = new RegExp(className, 'i');
    return documentElement.className.match(regex);
  };

  // Add one or more CSS classes to the <html> element.
  addClass = function (className) {
    var currentClassNames = null;
    if (!hasClass(className)) {
      currentClassNames = documentElement.className.replace(/^\s+|\s+$/g, '');
      documentElement.className = currentClassNames + " " + className;
    }
  };

  // Remove single CSS class from the <html> element.
  removeClass = function (className) {
    if (hasClass(className)) {
      documentElement.className = documentElement.className.replace(" " + className, "");
    }
  };

  // HTML Element Handling
  // ---------------------

  // Insert the appropriate CSS class based on the _user_agent.

  if (device.ios()) {
    if (device.ipad()) {
      addClass("ios ipad tablet");
    } else if (device.iphone()) {
      addClass("ios iphone mobile");
    } else if (device.ipod()) {
      addClass("ios ipod mobile");
    }
  } else if (device.android()) {
    if (device.androidTablet()) {
      addClass("android tablet");
    } else {
      addClass("android mobile");
    }
  } else if (device.blackberry()) {
    if (device.blackberryTablet()) {
      addClass("blackberry tablet");
    } else {
      addClass("blackberry mobile");
    }
  } else if (device.windows()) {
    if (device.windowsTablet()) {
      addClass("windows tablet");
    } else if (device.windowsPhone()) {
      addClass("windows mobile");
    } else {
      addClass("desktop");
    }
  } else if (device.fxos()) {
    if (device.fxosTablet()) {
      addClass("fxos tablet");
    } else {
      addClass("fxos mobile");
    }
  } else if (device.meego()) {
    addClass("meego mobile");
  } else if (device.nodeWebkit()) {
    addClass("node-webkit");
  } else if (device.television()) {
    addClass("television");
  } else if (device.desktop()) {
    addClass("desktop");
  }

  if (device.cordova()) {
    addClass("cordova");
  }

  // Orientation Handling
  // --------------------

  // Handle device orientation changes.
  handleOrientation = function () {
    if (device.landscape()) {
      removeClass("portrait");
      addClass("landscape");
    } else {
      removeClass("landscape");
      addClass("portrait");
    }
    return;
  };

  // Detect whether device supports orientationchange event,
  // otherwise fall back to the resize event.
  if (Object.prototype.hasOwnProperty.call(window, "onorientationchange")) {
    orientationEvent = "orientationchange";
  } else {
    orientationEvent = "resize";
  }

  // Listen for changes in orientation.
  if (window.addEventListener) {
    window.addEventListener(orientationEvent, handleOrientation, false);
  } else if (window.attachEvent) {
    window.attachEvent(orientationEvent, handleOrientation);
  } else {
    window[orientationEvent] = handleOrientation;
  }

  handleOrientation();

  if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
    define(function () {
      return device;
    });
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = device;
  } else {
    window.device = device;
  }
}).call(this);

},{}],2:[function(require,module,exports){
;(function () {
	'use strict';

	/**
	 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
	 *
	 * @codingstandard ftlabs-jsv2
	 * @copyright The Financial Times Limited [All Rights Reserved]
	 * @license MIT License (see LICENSE.txt)
	 */

	/*jslint browser:true, node:true*/
	/*global define, Event, Node*/


	/**
	 * Instantiate fast-clicking listeners on the specified layer.
	 *
	 * @constructor
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	function FastClick(layer, options) {
		var oldOnClick;

		options = options || {};

		/**
		 * Whether a click is currently being tracked.
		 *
		 * @type boolean
		 */
		this.trackingClick = false;


		/**
		 * Timestamp for when click tracking started.
		 *
		 * @type number
		 */
		this.trackingClickStart = 0;


		/**
		 * The element being tracked for a click.
		 *
		 * @type EventTarget
		 */
		this.targetElement = null;


		/**
		 * X-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartX = 0;


		/**
		 * Y-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartY = 0;


		/**
		 * ID of the last touch, retrieved from Touch.identifier.
		 *
		 * @type number
		 */
		this.lastTouchIdentifier = 0;


		/**
		 * Touchmove boundary, beyond which a click will be cancelled.
		 *
		 * @type number
		 */
		this.touchBoundary = options.touchBoundary || 10;


		/**
		 * The FastClick layer.
		 *
		 * @type Element
		 */
		this.layer = layer;

		/**
		 * The minimum time between tap(touchstart and touchend) events
		 *
		 * @type number
		 */
		this.tapDelay = options.tapDelay || 200;

		/**
		 * The maximum time for a tap
		 *
		 * @type number
		 */
		this.tapTimeout = options.tapTimeout || 700;

		if (FastClick.notNeeded(layer)) {
			return;
		}

		// Some old versions of Android don't have Function.prototype.bind
		function bind(method, context) {
			return function() { return method.apply(context, arguments); };
		}


		var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
		var context = this;
		for (var i = 0, l = methods.length; i < l; i++) {
			context[methods[i]] = bind(context[methods[i]], context);
		}

		// Set up event handlers as required
		if (deviceIsAndroid) {
			layer.addEventListener('mouseover', this.onMouse, true);
			layer.addEventListener('mousedown', this.onMouse, true);
			layer.addEventListener('mouseup', this.onMouse, true);
		}

		layer.addEventListener('click', this.onClick, true);
		layer.addEventListener('touchstart', this.onTouchStart, false);
		layer.addEventListener('touchmove', this.onTouchMove, false);
		layer.addEventListener('touchend', this.onTouchEnd, false);
		layer.addEventListener('touchcancel', this.onTouchCancel, false);

		// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
		// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
		// layer when they are cancelled.
		if (!Event.prototype.stopImmediatePropagation) {
			layer.removeEventListener = function(type, callback, capture) {
				var rmv = Node.prototype.removeEventListener;
				if (type === 'click') {
					rmv.call(layer, type, callback.hijacked || callback, capture);
				} else {
					rmv.call(layer, type, callback, capture);
				}
			};

			layer.addEventListener = function(type, callback, capture) {
				var adv = Node.prototype.addEventListener;
				if (type === 'click') {
					adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
						if (!event.propagationStopped) {
							callback(event);
						}
					}), capture);
				} else {
					adv.call(layer, type, callback, capture);
				}
			};
		}

		// If a handler is already declared in the element's onclick attribute, it will be fired before
		// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
		// adding it as listener.
		if (typeof layer.onclick === 'function') {

			// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
			// - the old one won't work if passed to addEventListener directly.
			oldOnClick = layer.onclick;
			layer.addEventListener('click', function(event) {
				oldOnClick(event);
			}, false);
			layer.onclick = null;
		}
	}

	/**
	* Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
	*
	* @type boolean
	*/
	var deviceIsWindowsPhone = navigator.userAgent.indexOf("Windows Phone") >= 0;

	/**
	 * Android requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone;


	/**
	 * iOS requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !deviceIsWindowsPhone;


	/**
	 * iOS 4 requires an exception for select elements.
	 *
	 * @type boolean
	 */
	var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


	/**
	 * iOS 6.0-7.* requires the target element to be manually derived
	 *
	 * @type boolean
	 */
	var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS [6-7]_\d/).test(navigator.userAgent);

	/**
	 * BlackBerry requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;

	/**
	 * Determine whether a given element requires a native click.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element needs a native click
	 */
	FastClick.prototype.needsClick = function(target) {
		switch (target.nodeName.toLowerCase()) {

		// Don't send a synthetic click to disabled inputs (issue #62)
		case 'button':
		case 'select':
		case 'textarea':
			if (target.disabled) {
				return true;
			}

			break;
		case 'input':

			// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
			if ((deviceIsIOS && target.type === 'file') || target.disabled) {
				return true;
			}

			break;
		case 'label':
		case 'iframe': // iOS8 homescreen apps can prevent events bubbling into frames
		case 'video':
			return true;
		}

		return (/\bneedsclick\b/).test(target.className);
	};


	/**
	 * Determine whether a given element requires a call to focus to simulate click into element.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
	 */
	FastClick.prototype.needsFocus = function(target) {
		switch (target.nodeName.toLowerCase()) {
		case 'textarea':
			return true;
		case 'select':
			return !deviceIsAndroid;
		case 'input':
			switch (target.type) {
			case 'button':
			case 'checkbox':
			case 'file':
			case 'image':
			case 'radio':
			case 'submit':
				return false;
			}

			// No point in attempting to focus disabled inputs
			return !target.disabled && !target.readOnly;
		default:
			return (/\bneedsfocus\b/).test(target.className);
		}
	};


	/**
	 * Send a click event to the specified element.
	 *
	 * @param {EventTarget|Element} targetElement
	 * @param {Event} event
	 */
	FastClick.prototype.sendClick = function(targetElement, event) {
		var clickEvent, touch;

		// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
		if (document.activeElement && document.activeElement !== targetElement) {
			document.activeElement.blur();
		}

		touch = event.changedTouches[0];

		// Synthesise a click event, with an extra attribute so it can be tracked
		clickEvent = document.createEvent('MouseEvents');
		clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
		clickEvent.forwardedTouchEvent = true;
		targetElement.dispatchEvent(clickEvent);
	};

	FastClick.prototype.determineEventType = function(targetElement) {

		//Issue #159: Android Chrome Select Box does not open with a synthetic click event
		if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
			return 'mousedown';
		}

		return 'click';
	};


	/**
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.focus = function(targetElement) {
		var length;

		// Issue #160: on iOS 7, some input elements (e.g. date datetime month) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
		if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
			length = targetElement.value.length;
			targetElement.setSelectionRange(length, length);
		} else {
			targetElement.focus();
		}
	};


	/**
	 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
	 *
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.updateScrollParent = function(targetElement) {
		var scrollParent, parentElement;

		scrollParent = targetElement.fastClickScrollParent;

		// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
		// target element was moved to another parent.
		if (!scrollParent || !scrollParent.contains(targetElement)) {
			parentElement = targetElement;
			do {
				if (parentElement.scrollHeight > parentElement.offsetHeight) {
					scrollParent = parentElement;
					targetElement.fastClickScrollParent = parentElement;
					break;
				}

				parentElement = parentElement.parentElement;
			} while (parentElement);
		}

		// Always update the scroll top tracker if possible.
		if (scrollParent) {
			scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
		}
	};


	/**
	 * @param {EventTarget} targetElement
	 * @returns {Element|EventTarget}
	 */
	FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {

		// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
		if (eventTarget.nodeType === Node.TEXT_NODE) {
			return eventTarget.parentNode;
		}

		return eventTarget;
	};


	/**
	 * On touch start, record the position and scroll offset.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchStart = function(event) {
		var targetElement, touch, selection;

		// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
		if (event.targetTouches.length > 1) {
			return true;
		}

		targetElement = this.getTargetElementFromEventTarget(event.target);
		touch = event.targetTouches[0];

		if (deviceIsIOS) {

			// Only trusted events will deselect text on iOS (issue #49)
			selection = window.getSelection();
			if (selection.rangeCount && !selection.isCollapsed) {
				return true;
			}

			if (!deviceIsIOS4) {

				// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
				// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
				// with the same identifier as the touch event that previously triggered the click that triggered the alert.
				// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
				// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
				// Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
				// which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
				// random integers, it's safe to to continue if the identifier is 0 here.
				if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
					event.preventDefault();
					return false;
				}

				this.lastTouchIdentifier = touch.identifier;

				// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
				// 1) the user does a fling scroll on the scrollable layer
				// 2) the user stops the fling scroll with another tap
				// then the event.target of the last 'touchend' event will be the element that was under the user's finger
				// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
				// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
				this.updateScrollParent(targetElement);
			}
		}

		this.trackingClick = true;
		this.trackingClickStart = event.timeStamp;
		this.targetElement = targetElement;

		this.touchStartX = touch.pageX;
		this.touchStartY = touch.pageY;

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			event.preventDefault();
		}

		return true;
	};


	/**
	 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.touchHasMoved = function(event) {
		var touch = event.changedTouches[0], boundary = this.touchBoundary;

		if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
			return true;
		}

		return false;
	};


	/**
	 * Update the last position.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchMove = function(event) {
		if (!this.trackingClick) {
			return true;
		}

		// If the touch has moved, cancel the click tracking
		if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
			this.trackingClick = false;
			this.targetElement = null;
		}

		return true;
	};


	/**
	 * Attempt to find the labelled control for the given label element.
	 *
	 * @param {EventTarget|HTMLLabelElement} labelElement
	 * @returns {Element|null}
	 */
	FastClick.prototype.findControl = function(labelElement) {

		// Fast path for newer browsers supporting the HTML5 control attribute
		if (labelElement.control !== undefined) {
			return labelElement.control;
		}

		// All browsers under test that support touch events also support the HTML5 htmlFor attribute
		if (labelElement.htmlFor) {
			return document.getElementById(labelElement.htmlFor);
		}

		// If no for attribute exists, attempt to retrieve the first labellable descendant element
		// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
		return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
	};


	/**
	 * On touch end, determine whether to send a click event at once.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchEnd = function(event) {
		var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

		if (!this.trackingClick) {
			return true;
		}

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			this.cancelNextClick = true;
			return true;
		}

		if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {
			return true;
		}

		// Reset to prevent wrong click cancel on input (issue #156).
		this.cancelNextClick = false;

		this.lastClickTime = event.timeStamp;

		trackingClickStart = this.trackingClickStart;
		this.trackingClick = false;
		this.trackingClickStart = 0;

		// On some iOS devices, the targetElement supplied with the event is invalid if the layer
		// is performing a transition or scroll, and has to be re-detected manually. Note that
		// for this to function correctly, it must be called *after* the event target is checked!
		// See issue #57; also filed as rdar://13048589 .
		if (deviceIsIOSWithBadTarget) {
			touch = event.changedTouches[0];

			// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
			targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
			targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
		}

		targetTagName = targetElement.tagName.toLowerCase();
		if (targetTagName === 'label') {
			forElement = this.findControl(targetElement);
			if (forElement) {
				this.focus(targetElement);
				if (deviceIsAndroid) {
					return false;
				}

				targetElement = forElement;
			}
		} else if (this.needsFocus(targetElement)) {

			// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
			// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
			if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
				this.targetElement = null;
				return false;
			}

			this.focus(targetElement);
			this.sendClick(targetElement, event);

			// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
			// Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
			if (!deviceIsIOS || targetTagName !== 'select') {
				this.targetElement = null;
				event.preventDefault();
			}

			return false;
		}

		if (deviceIsIOS && !deviceIsIOS4) {

			// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
			// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
			scrollParent = targetElement.fastClickScrollParent;
			if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
				return true;
			}
		}

		// Prevent the actual click from going though - unless the target node is marked as requiring
		// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
		if (!this.needsClick(targetElement)) {
			event.preventDefault();
			this.sendClick(targetElement, event);
		}

		return false;
	};


	/**
	 * On touch cancel, stop tracking the click.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.onTouchCancel = function() {
		this.trackingClick = false;
		this.targetElement = null;
	};


	/**
	 * Determine mouse events which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onMouse = function(event) {

		// If a target element was never set (because a touch event was never fired) allow the event
		if (!this.targetElement) {
			return true;
		}

		if (event.forwardedTouchEvent) {
			return true;
		}

		// Programmatically generated events targeting a specific element should be permitted
		if (!event.cancelable) {
			return true;
		}

		// Derive and check the target element to see whether the mouse event needs to be permitted;
		// unless explicitly enabled, prevent non-touch click events from triggering actions,
		// to prevent ghost/doubleclicks.
		if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

			// Prevent any user-added listeners declared on FastClick element from being fired.
			if (event.stopImmediatePropagation) {
				event.stopImmediatePropagation();
			} else {

				// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
				event.propagationStopped = true;
			}

			// Cancel the event
			event.stopPropagation();
			event.preventDefault();

			return false;
		}

		// If the mouse event is permitted, return true for the action to go through.
		return true;
	};


	/**
	 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
	 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
	 * an actual click which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onClick = function(event) {
		var permitted;

		// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
		if (this.trackingClick) {
			this.targetElement = null;
			this.trackingClick = false;
			return true;
		}

		// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
		if (event.target.type === 'submit' && event.detail === 0) {
			return true;
		}

		permitted = this.onMouse(event);

		// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
		if (!permitted) {
			this.targetElement = null;
		}

		// If clicks are permitted, return true for the action to go through.
		return permitted;
	};


	/**
	 * Remove all FastClick's event listeners.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.destroy = function() {
		var layer = this.layer;

		if (deviceIsAndroid) {
			layer.removeEventListener('mouseover', this.onMouse, true);
			layer.removeEventListener('mousedown', this.onMouse, true);
			layer.removeEventListener('mouseup', this.onMouse, true);
		}

		layer.removeEventListener('click', this.onClick, true);
		layer.removeEventListener('touchstart', this.onTouchStart, false);
		layer.removeEventListener('touchmove', this.onTouchMove, false);
		layer.removeEventListener('touchend', this.onTouchEnd, false);
		layer.removeEventListener('touchcancel', this.onTouchCancel, false);
	};


	/**
	 * Check whether FastClick is needed.
	 *
	 * @param {Element} layer The layer to listen on
	 */
	FastClick.notNeeded = function(layer) {
		var metaViewport;
		var chromeVersion;
		var blackberryVersion;
		var firefoxVersion;

		// Devices that don't support touch don't need FastClick
		if (typeof window.ontouchstart === 'undefined') {
			return true;
		}

		// Chrome version - zero for other browsers
		chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (chromeVersion) {

			if (deviceIsAndroid) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// Chrome 32 and above with width=device-width or less don't need FastClick
					if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}

			// Chrome desktop doesn't need FastClick (issue #15)
			} else {
				return true;
			}
		}

		if (deviceIsBlackBerry10) {
			blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);

			// BlackBerry 10.3+ does not require Fastclick library.
			// https://github.com/ftlabs/fastclick/issues/251
			if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// user-scalable=no eliminates click delay.
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// width=device-width (or less than device-width) eliminates click delay.
					if (document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}
			}
		}

		// IE10 with -ms-touch-action: none or manipulation, which disables double-tap-to-zoom (issue #97)
		if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		// Firefox version - zero for other browsers
		firefoxVersion = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (firefoxVersion >= 27) {
			// Firefox 27+ does not have tap delay if the content is not zoomable - https://bugzilla.mozilla.org/show_bug.cgi?id=922896

			metaViewport = document.querySelector('meta[name=viewport]');
			if (metaViewport && (metaViewport.content.indexOf('user-scalable=no') !== -1 || document.documentElement.scrollWidth <= window.outerWidth)) {
				return true;
			}
		}

		// IE11: prefixed -ms-touch-action is no longer supported and it's recomended to use non-prefixed version
		// http://msdn.microsoft.com/en-us/library/windows/apps/Hh767313.aspx
		if (layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		return false;
	};


	/**
	 * Factory method for creating a FastClick object
	 *
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	FastClick.attach = function(layer, options) {
		return new FastClick(layer, options);
	};


	if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {

		// AMD. Register as an anonymous module.
		define(function() {
			return FastClick;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = FastClick.attach;
		module.exports.FastClick = FastClick;
	} else {
		window.FastClick = FastClick;
	}
}());

},{}],3:[function(require,module,exports){
/* ==================================================================================
 * app.js
 * 主程序入口
 * ================================================================================== */

var attachFastClick = require('fastclick'); //解决触摸设备浏览器点击延迟300ms

var ViewCtrl = require('./view/viewCtrl');
var FrameAnim = require('./libs/frame-animation');

var Webapp = function () {

    attachFastClick(document.body);
    var viewCtrl = new ViewCtrl();

    const SHAKE_SPEED = 200;
    let lastTime = 0; //上次变化的时间
    let x = y = z = lastX = lastY = lastZ = 0; //位置变量初始化

    let ani = null;
    let animReady = false;
    let isPlaying = false;

    function Webapp() {
        ion.sound({
            sounds: [{
                name: "shaking",
                loop: true
            }, {
                name: "button_tiny",
                loop: true
            }],
            volume: 1,
            path: "./sound/", // my test URL
            preload: true,
            multiplay: false,
            // 保证音频加载完成
            ready_callback: () => {
                play_animation();
            }
        });
    }

    function play_animation() {
        var framesUrl = [];
        for (let i = 0; i < 60; i++) {
            if (i < 10) {
                framesUrl.push('./images/cam__0000' + i + '.png');
            } else {
                framesUrl.push('./images/cam__000' + i + '.png');
            }
        }

        // frame animation
        ani = new FrameAnim({
            canvasTargetId: "mainCanvas", // target canvas ID
            framesUrl: framesUrl, // frames url
            loop: false, // if loop
            height: 720, // source image's height (px)
            width: 1280, // source image's width (px)
            frequency: 20, // count of frames in one second
            onComplete: function () {
                // complete callback
                console.log("Animation end.");
                isPlaying = false;
                $('#loading').html('摇一摇旋转');
            }
        });

        // preload & play
        ani.initialize(() => {
            //$("#loading").hide();
            //ani.play();
            animReady = true;
            $('#loading').html('摇一摇旋转');
            if (window.DeviceMotionEvent) {
                window.addEventListener('devicemotion', motionHandler, false);
            } else {
                alert("你的设备不支持位置感应");
            }
            //ion.sound.play("shaking");
        });
    }

    function motionHandler(event) {
        let acceleration = event.accelerationIncludingGravity;
        let curTime = Date.now(); //取得当前时间
        if (curTime - lastTime > 120) {
            let diffTime = curTime - lastTime;
            lastTime = curTime;
            x = acceleration.x;
            y = acceleration.y;
            z = acceleration.z;
            //计算摇动速度
            let speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 1000;
            if (speed > SHAKE_SPEED) {
                $('#loading').html('');
                //window.navigator.vibrate(2000)
                if (!isPlaying) {
                    ani.reset();
                    ani.play();
                    ion.sound.play("button_tiny");
                    isPlaying = true;
                }
            } else {
                //$('#loading').html('no')
                //window.navigator.vibrate(0)
                if (speed < SHAKE_SPEED * 0.1) ion.sound.stop("button_tiny");
            }
            lastX = x;
            lastY = y;
            lastZ = z;
        }
    }

    Webapp.prototype.getViewCtrl = function () {
        return viewCtrl;
    };

    return Webapp;
}();

$(document).ready(function () {
    window.app = new Webapp();
});

},{"./libs/frame-animation":4,"./view/viewCtrl":5,"fastclick":2}],4:[function(require,module,exports){
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        //AMD
        define(factory);
    } else if (typeof exports === 'object') {
        //Node, CommonJS之类的
        module.exports = factory();
    } else {
        //浏览器全局变量(root 即 window)
        root.frame_ani = factory(root);
    }
})(this, function () {
    var isFunc = function (f) {
        return typeof f === 'function';
    };

    /* 从此处开始主要逻辑 */

    //构造器函数
    function frame_ani(config) {
        this.option = {
            canvasTargetId: null, // 目标画布对象ID（必须）
            framesUrl: [], // 每一帧的url（必须）
            audioObject: null, // 音频的对象（优先级高于ION）
            audioIonName: null, // ION音频的名字（优先级高于路径）
            audioUrl: "", // 音频路径（优先级最低）
            height: 300, // 图片的高度（必须）
            width: 300, // 图片的宽度（必须）
            onStart: null, // 加载开始回调函数，传入参数total
            onComplete: null, // 播放完毕回调
            loop: false, // 是否循环
            frequency: 25 // 每秒帧数

            // 覆盖默认配置
        };if (config) {
            for (i in config) {
                this.option[i] = config[i];
            }
        } else {
            alert('参数错误！');
            return;
        }
        this.status = 0; // 状态，0：未启动   1：正在加载   2：播放中（没写）
        this.total = this.option.framesUrl.length || 0; //资源总数
        this.ctx = document.getElementById(this.option.canvasTargetId).getContext('2d'); // 画布上下文

        var that = this;
        if (this.option.audioObject != null) {
            this.bgm = this.option.audioObject;
        } else if (this.option.audioIonName != null) {
            this.bgm_ion_name = this.option.audioIonName;
        } else {
            this.bgm = new Audio(); // 背景音乐！
            this.bgm.onerror = function () {
                that.bgm = undefined;
            };
            this.bgm.src = this.option.audioUrl;
        }

        // 设置频率
        // this.frequency = 25;

        // 启动缓存
        // this.initialize();
    };

    // 预加载
    frame_ani.prototype.initialize = function (callback) {
        this.initialize_cb = callback;
        // 启动加载，图片按顺序存起来，加载完毕后开始播放
        this.status = 1;
        var that = this;

        this.frames = []; // 存帧对象的
        this.currentIndex = 0; //当前正在加载的资源索引

        for (var i = 0, l = this.option.framesUrl.length; i < l; i++) {
            var url = this.option.framesUrl[i];
            var image = new Image();
            image.onload = function () {
                that.loaded();
            };
            image.onerror = function () {
                console.log('preload error.');
                that.loaded();
            };
            image.src = url;
            this.frames.push(image);
        }
        // 回调一下启动函数
        if (isFunc(this.option.onStart)) {
            this.option.onStart(this.total);
        }
    };

    // 设置封面
    frame_ani.prototype.setPoster = function () {
        this.calculate();
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.drawImage(this.frames[0], this.showX, this.showY, this.sourceWidth, this.sourceHeight, 0, 0, this.canvasWidth, this.canvasHeight);
        // console.log("画好封面了");
        if (isFunc(this.initialize_cb)) {
            this.initialize_cb();
        }
    };

    // 计算一下宽高和显示位置，默认居中靠底部显示（background-position: center bottom）
    // 非默认的没写
    frame_ani.prototype.calculate = function () {
        this.canvasWidth = $("#" + this.option.canvasTargetId).width();
        this.canvasHeight = $("#" + this.option.canvasTargetId).height();
        var canvasR = 1.0 * this.canvasWidth / this.canvasHeight; // 窗口的宽高比
        var imageR = 1.0 * this.option.width / this.option.height;

        // 用来计算裁剪的宽高
        if (imageR < canvasR) {
            // 宽度相同，高度要裁剪
            this.width = this.canvasWidth;
            this.height = this.canvasWidth / imageR;

            this.sourceWidth = this.option.width;
            this.sourceHeight = this.option.width / canvasR;
            this.showX = 0;
            this.showY = this.option.height - this.sourceHeight;
        } else {
            // 高度相同，宽度要裁剪
            this.width = this.canvasHeight * imageR;
            this.height = this.canvasHeight;

            this.sourceWidth = this.option.height * canvasR;
            this.sourceHeight = this.option.height;

            this.showX = (this.option.width - this.sourceWidth) / 2;
            this.showY = 0;
        }

        // // 裁剪的起始位置
        // this.showX = (this.option.width - this.canvasWidth) / 2;
        // this.showY = this.option.height - this.canvasHeight;


        console.log(this.showX, this.showY, this.canvasWidth, this.canvasHeight);
    };

    // 播放视频
    frame_ani.prototype.play = function () {
        // 设置当前播放帧
        this.currentTimes = this.currentTimes || 0;
        this.maxFramesTimes = this.option.framesUrl.length; // 总帧数
        this.lastTimestamp = undefined;
        // 开始播放
        this.status = 2;
        // 如果有音频也播放
        if (this.bgm != undefined) {
            this.bgm.play();
        }
        if (this.bgm_ion_name) {
            ion.sound.play(this.bgm_ion_name);
        }
        window.requestAnimationFrame(this.nextFrame.bind(this));
    };

    // 暂停
    frame_ani.prototype.pause = function () {
        this.status = 3;
        // bgm 也停一下
        if (this.bgm != undefined) {
            this.bgm.pause();
        }
        if (this.bgm_ion_name) {
            ion.sound.pause(this.bgm_ion_name);
        }
    };

    // 重置播放序列和音频
    frame_ani.prototype.reset = function () {
        this.currentTimes = 0;
        if (this.bgm) {
            this.bgm.currentTime = 0;
        }
        if (this.bgm_ion_name) {
            ion.sound.stop(this.bgm_ion_name);
        }
    };

    // 绘制下一帧，核心函数？
    frame_ani.prototype.nextFrame = function (timestamp) {
        if (this.bgm_ion_name) {
            ion.sound.play(this.bgm_ion_name);
        }
        if (this.status === 3) {
            // 提前结束了
            if (isFunc(this.option.onComplete)) {
                this.option.onComplete();
            }
            // 双重保障？
            if (this.bgm != undefined) {
                this.bgm.pause();
            }
            if (this.bgm_ion_name) {
                ion.sound.stop(this.bgm_ion_name);
            }
            return false;
        }
        // console.log(timestamp);
        var needRedraw = false; // 需要重绘
        if (this.lastTimestamp === undefined) {
            this.lastTimestamp = timestamp;
            this.carryTime = 0; // 上次的余数
            var jumpFrames = 0;
            needRedraw = true;
        } else {
            var jumpFrames = parseInt((timestamp - this.lastTimestamp + this.carryTime) / (1000 / this.option.frequency));
            if (jumpFrames > 0) {
                this.currentTimes += jumpFrames;
                needRedraw = true;
                this.carryTime = (timestamp - this.lastTimestamp + this.carryTime) % (1000 / this.option.frequency);
                this.lastTimestamp = timestamp;
            }
        }

        // console.log("准备画第 "+ this.currentTimes + " 帧");
        // 重绘
        if (needRedraw && this.currentTimes < this.maxFramesTimes) {
            // 疯狂更新来监听窗口大小变化
            // this.calculate();
            // console.log("画了一帧！现在在第：" + this.currentTimes + "帧！");
            this.ctx.clearRect(0, 0, this.width, this.height);
            // console.log(this.canvasWidth, this.canvasHeight);
            this.ctx.drawImage(this.frames[this.currentTimes], this.showX, this.showY, this.sourceWidth, this.sourceHeight, 0, 0, this.canvasWidth, this.canvasHeight);
        }

        // 是否继续
        if (this.currentTimes < this.maxFramesTimes) {
            // console.log("下一帧");
            window.requestAnimationFrame(this.nextFrame.bind(this));
        } else if (isFunc(this.option.onComplete)) {
            // console.log("没有下一帧");
            this.option.onComplete();
            if (this.option.loop === true) {
                // 需要循环播放
                this.currentTimes = 0;
                this.lastTimestamp = undefined;
                // 音频也从头开始
                if (this.bgm != undefined) {
                    this.bgm.currentTime = 0;
                    this.bgm.play();
                }
                if (this.bgm_ion_name) {
                    console.log('restart ion sound');
                    ion.sound.stop(this.bgm_ion_name);
                }
                window.requestAnimationFrame(this.nextFrame.bind(this));
            } else {
                // 结束了
                this.status = 3;
                if (this.bgm != undefined) {
                    this.bgm.pause();
                }
                if (this.bgm_ion_name) {
                    ion.sound.stop(this.bgm_ion_name);
                }
            }
        }
        // this.currentTimes++;
    };

    // 计数函数
    frame_ani.prototype.loaded = function () {
        this.currentIndex++;
        if (this.currentIndex === this.total) {
            // 加载完毕，设置一下封面美滋滋
            this.setPoster();
        }
    };

    //暴露粗去
    return frame_ani;
});

},{}],5:[function(require,module,exports){
/* ==================================================================================
 * viewCtrl.js
 * 界面视图相关控制
 * ================================================================================== */
var device = require('../../../../../../bower_components/device.js/lib/device.js');

var ViewCtrl = function () {

    var winSize = {
        width: 0,
        height: 0
    };

    var maxMobileWidth = 640;
    var minMobileWidth = 320;
    var baseFontsize = 100;
    var currentFontSize = baseFontsize;
    var browserType = "";

    var el_canvas = $('#mainCanvas');
    var canvas_ratio = 0.5625;
    var canvasSize = {
        width: 1280,
        height: 720
    };

    function ViewCtrl() {
        this.initLayout();
    }

    ViewCtrl.prototype.initLayout = function () {
        var base = this;

        base.setTouchActive();
        base.setResponsive();

        browserType = base.getBrowserType();
        if (browserType == 'IE9') {
            $('html').addClass('isIE9');
        } else if (browserType == 'IE8' || browserType == 'IE7') {
            alert('提示 ：浏览器版本过低');
        }

        $(window).resize(function () {
            base.setResponsive();
        });
    };

    ViewCtrl.prototype.setTouchActive = function () {
        $('.touch-active, .btn').on('touchstart mousedown', function () {
            $(this).addClass('active');
        });
        $('.touch-active, .btn').on('touchmove touchend mouseup', function () {
            $(this).removeClass('active');
        });
    };

    ViewCtrl.prototype.getWinSize = function () {
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

    ViewCtrl.prototype.getCanvasSize = function () {
        return canvasSize;
    };

    ViewCtrl.prototype.getBrowserType = function () {
        var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
        var isOpera = userAgent.indexOf("Opera") > -1; //判断是否Opera浏览器
        var isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && !isOpera; //判断是否IE浏览器
        var isEdge = userAgent.indexOf("Windows NT 6.1; Trident/7.0;") > -1 && !isIE; //判断是否IE的Edge浏览器
        var isFF = userAgent.indexOf("Firefox") > -1; //判断是否Firefox浏览器
        var isSafari = userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") == -1; //判断是否Safari浏览器
        var isChrome = userAgent.indexOf("Chrome") > -1 && userAgent.indexOf("Safari") > -1; //判断Chrome浏览器

        if (isIE) {
            var reIE = new RegExp("MSIE (\\d+\\.\\d+);");
            reIE.test(userAgent);
            var fIEVersion = parseFloat(RegExp["$1"]);
            if (fIEVersion == 7) {
                return "IE7";
            } else if (fIEVersion == 8) {
                return "IE8";
            } else if (fIEVersion == 9) {
                return "IE9";
            } else if (fIEVersion == 10) {
                return "IE10";
            } else if (fIEVersion == 11) {
                return "IE11";
            } else {
                return "0";
            } //IE版本过低
        } //isIE end

        if (isFF) {
            return "FF";
        }
        if (isOpera) {
            return "Opera";
        }
        if (isSafari) {
            return "Safari";
        }
        if (isChrome) {
            return "Chrome";
        }
        if (isEdge) {
            return "Edge";
        }
    };

    ViewCtrl.prototype.checkTouchable = function () {
        var isTouch = "ontouchstart" in window || navigator.msMaxTouchPoints;
        if (isTouch) {
            $('html').addClass('is-touch');
        } else {
            $('html').addClass('is-not-touch');
        }
        return isTouch;
    };

    ViewCtrl.prototype.checkMobile = function () {
        if (this.checkTouchable() && this.getWinSize().width < maxMobileWidth) {
            return true;
        }
        return false;
    };

    ViewCtrl.prototype.setResponsive = function () {
        this.getWinSize();
        if (device.mobile() || device.tablet()) {
            var winWidth = winSize.width <= minMobileWidth ? minMobileWidth : winSize.width > maxMobileWidth ? maxMobileWidth : winSize.width;
            currentFontSize = winWidth / minMobileWidth * baseFontsize;
            $('html').css('fontSize', currentFontSize + 'px');
        }

        var canvas_width = winSize.width;
        var canvas_height = canvas_width * canvas_ratio;
        if (canvas_height > winSize.height) {
            canvas_width = winSize.height;
            canvas_height = canvas_width * canvas_ratio;
        }
        el_canvas.attr('width', canvas_width);
        el_canvas.attr('height', canvas_height);
        canvasSize.width = canvas_width;
        canvasSize.height = canvas_height;
    };

    return ViewCtrl;
}();

module.exports = ViewCtrl;

},{"../../../../../../bower_components/device.js/lib/device.js":1}]},{},[3]);
