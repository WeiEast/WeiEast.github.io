/**
 * Author: Marek Zeman
 * Twitter: MarekZeman91
 * Site: http://marekzeman.cz
 * License: MIT
 * Version: 0.96
 */
var Device = (function() {
    var userAgent = navigator.userAgent;
    var maxSize = Math.max(screen.width, screen.height);
    var minSize = Math.min(screen.width, screen.height);
    var mobile = /Mobile/i.test(userAgent);

    var result = {
        BlackBerry: /BlackBerry/i.test(userAgent),
        Android:    /Android/i.test(userAgent),
        Symbian:    /Symbian/i.test(userAgent),
        iPhone:     /iPhone/i.test(userAgent),
        WebOS:      /WebOS/i.test(userAgent),
        iPod:       /iPod/i.test(userAgent),
        iPad:       /iPad/i.test(userAgent),

        Windows: /Windows|IEMobile/i.test(userAgent),
        Linux:   /Linux/i.test(userAgent),
        Mac:     /Mac OS/i.test(userAgent),

        isTouchscreen: /Touch/i.test(userAgent) || !!('ontouchstart' in window),
        isMobile:      /iP(hone|od)|BlackBerry|Windows CE|Opera mini|Touch|Mobile/i.test(userAgent),
        isTablet:      /Android|iPad|Touch/i.test(userAgent),

        addClasses: function() {
            var html = document.documentElement;
            var item, classes;

            if (html) {
                classes = html.className.match(/[^\s\b\t\n\r\f]+/g) || [];

                for (item in this) {
                    if (item == 'addClasses') {
                        continue;
                    }

                    if (classes.indexOf(item) > -1) {
                        continue;
                    }

                    if (this[item]) {
                        classes.push(item);
                    }
                }

                html.className = classes.join(' ');
            }

            return this;
        }
    };

    if (result.isTablet && result.isMobile) {
        if (result.Android && !mobile) {
            result.isTablet = false;
            result.isMobile = true;
        } else {
            result.isTablet = (maxSize > 1000 && minSize > 750);
            result.isMobile = !result.isTablet;
        }
    }

    return result.addClasses();
})();


/**
 * Author: Marek Zeman
 * Twitter: MarekZeman91
 * Site: http://MarekZeman.cz/
 * Link: http://codepen.io/MarekZeman91/details/arJIn/
 * License: MIT
 * Version: 1
 */
$.fn.hasntClass = function(className) { return !this.hasClass(className) };


/**
 * Author: Marek Zeman
 * Twitter: MarekZeman91
 * Site: http://MarekZeman.cz/
 * Link: http://codepen.io/MarekZeman91/details/DKkHa/
 * License: MIT
 * Version: 1
 */
var isCSSFeatureSupported = (function() {
    var alreadyChecked = {};
    var bodyProperty;

    return function(property) {
        property = ('' + property).toLowerCase();

        if (typeof alreadyChecked[property] == 'boolean') {
            return alreadyChecked[property];
        }

        for (bodyProperty in document.body.style) {
            bodyProperty = bodyProperty.toLowerCase();

            if (bodyProperty.indexOf(property) >= 0) {
                return alreadyChecked[property] = true;
            }
        }

        return alreadyChecked[property] = false;
    }
})();


/**
 * Author: Marek Zeman
 * Twitter: MarekZeman91
 * Site: http://MarekZeman.cz/
 * License: MIT
 * Version: 0.9
 */
(function() {
    var ImagesPreloader = {
        addURL: function(url) {
            addURL(url);
            return this;
        },
        addURLs: function(urls) {
            if (typeof urls == 'object' && urls.length) {
                for (var i = 0, l = urls.length; i < l; i++) {
                    addURL(urls[i]);
                }
            }
            return this;
        },
        start: function() {
            start();
        },
        onUpdate: null,
        onFinish: null,
        onError: null
    };

    var tasks = [];
    var current = 0;
    var image;

    function addURL(url) {
        if ('' + url === url && tasks.indexOf(url) == -1) {
            tasks.push(url);
        }
    }

    function onLoad() {
        if (typeof ImagesPreloader.onUpdate == 'function') {
            ImagesPreloader.onUpdate(current, tasks.length);
        }
        download();
    }
    function onError() {
        if (typeof ImagesPreloader.onError == 'function') {
            ImagesPreloader.onError(tasks[current]);
        }
        download();
    }
    function onFinish() {
        if (typeof ImagesPreloader.onFinish == 'function') {
            ImagesPreloader.onFinish();
        }
    }

    function download() {
        if (current < tasks.length) {
            image = new Image();
            image.src = tasks[current++];
            image.addEventListener('load', onLoad, false);
            image.addEventListener('error', onLoad, false);
        } else {
            onFinish();
        }
    }

    function start() {
        delete ImagesPreloader.addURL;
        delete ImagesPreloader.addURLs;
        delete ImagesPreloader.start;

        download();
    }

    window.ImagesPreloader = ImagesPreloader;
})();