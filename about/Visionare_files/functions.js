/**
 * All code bollow is created by Marek Zeman as head front-end developer in Madeo.cz
 * For inquiries contact: info@madeo.cz or visit: www.madeo.cz
 */

var $body = $(document.body);

// Sequence script
(function() {
    function Sequence(sequence) {
        this.tasks = sequence || [];
    }

    function launch(instance) {
        if (instance.running) {
            return instance;
        }

        if (!instance.tasks) {
            return instance;
        }
        if (!instance.tasks[instance.current]) {
            return instance;
        }

        instance.running = true;

        var task  = instance.tasks[instance.current].task;
        var wait = instance.tasks[instance.current].wait;

        if (!(+wait === wait)) {
            wait = 0;
        }

        if (typeof task == 'function') {
            instance.timeout = setTimeout(function() {
                instance.running = false;
                task(instance.current);
                next(instance);
            }, wait);
        } else {
            instance.timeout = setTimeout(function() {
                instance.running = false;
                next(instance);
            }, wait);
        }

        return instance;
    }

    function next(instance) {
        if (instance.tasks[instance.current+1]) {
            instance.current++;
            return instance.run();
        }

        if (!instance.tasks[instance.current+1] && instance.repeating) {
            instance.reset();
            return instance.run();
        }

        return instance.stop();
    }

    Sequence.prototype = {
        tasks: [],
        current: 0,
        repeating: false,

        running: false,
        timeout: null,

        run: function() {
            return launch(this);
        },
        stop: function() {
            clearTimeout(this.timeout);

            this.timeout = null;
            this.running = false;

            return this;
        },
        reset: function(customReset) {
            this.stop();
            this.current = 0;

            if (typeof customReset == 'function') {
                customReset(this);
            }

            return this;
        }
    };

    window.Sequence = Sequence;
})();

// swipe gallery
(function() {
    $.fn.swipeGallery = function(options) {
        options = $.extend({
            slidesHolder: '',
            onResize: null,
            onChange: null
        }, options);

        function getTouches(event) {
            var touches = { x: 0, y: 0 };

            if (event && event.changedTouches && event.changedTouches.length) {
                touches.x = event.changedTouches[0].pageX || 0;
                touches.y = event.changedTouches[0].pageY || 0;
            }

            return touches;
        }

        function getPrefixedCSS(property, value) {
            var prefixes = ['-webkit-', '-moz-', '-ms-', '-o-', ''];
            var prefix;
            var css = {};

            for (prefix in prefixes) {
                prefix = prefixes[prefix] + property;
                css[prefix] = value;
            }

            return css;
        }

        function onTouchStart(instance, event) {
            instance.touched = true;
            instance.started = false;

            instance.startPoint = getTouches(event);
            instance.currentPoint = instance.startPoint;

            instance.moveFromX = instance.$slidesHolder.css('left') || '0';
            instance.moveFromX = instance.moveFromX.replace(/[^\d\.\-]/g, '');
            instance.moveFromX = (+instance.moveFromX) || 0;

            instance.moveFromY = instance.$slidesHolder.css('top') || '0';
            instance.moveFromY = instance.moveFromY.replace(/[^\d\.\-]/g, '');
            instance.moveFromY = (+instance.moveFromY) || 0;

            instance.$slidesHolder.css(getPrefixedCSS('transition-duration', '0s'));
        }
        function onTouchMove(instance, event) {
            instance.currentPoint = getTouches(event);

            if (instance.touched && !instance.started) {
                instance.moveByX = Math.abs(instance.currentPoint.x - instance.startPoint.x);
                instance.moveByY = Math.abs(instance.currentPoint.y - instance.startPoint.y);

                if (instance.moveByX > instance.moveByY + 6) {
                    if (event) {
                        event.preventDefault();
                    }

                    instance.started = true;
                    instance.startPoint = getTouches(event);
                    instance.currentPoint = instance.startPoint;
                }
            }

            if (instance.started) {
                if (event) {
                    event.preventDefault();
                }

                instance.moveByX = instance.currentPoint.x - instance.startPoint.x;
                instance.$slidesHolder.css('left', instance.moveFromX + instance.moveByX);
            }
        }
        function onTouchEnd(instance, event) {
            if (event) {
                event.preventDefault();
            }

            if (instance.touched && instance.started) {
                instance.$slidesHolder.css(getPrefixedCSS('transition-duration', '.25s'));

                if (instance.moveByX < 0 && instance.curSlide < instance.maxSlide) {
                    instance.curSlide++;
                }

                if (instance.moveByX > 0 && instance.curSlide > 0) {
                    instance.curSlide--;
                }

                if (instance.curSlide != instance.prevSlide) {
                    if (typeof options.onChange == 'function') {
                        options.onChange(instance);
                    }
                }

                instance.prevSlide = instance.curSlide;

                instance.$slidesHolder.css('left', -(instance.curSlide * 100) + '%');
            }

            instance.touched = false;
            instance.started = false;
        }

        this.each(function() {
            var instance = {
                $slidesHolder: null,
                started: false,
                touched: false,
                currentPoint: 0,
                startPoint: 0,
                moveFromX: 0,
                moveFromY: 0,
                moveByX: 0,
                moveByY: 0,
                prevSlide: 0,
                curSlide: 0,
                maxSlide: 0
            };

            instance.$slidesHolder = $(this).find(options.slidesHolder);
            instance.$slidesHolder.css('left', 0);

            instance.maxSlide = instance.$slidesHolder.children().length;
            instance.maxSlide = instance.maxSlide > 0 ? instance.maxSlide - 1 : 0;

            if (typeof options.onResize == 'function') {
                $(window).resize(function() {
                    options.onResize(instance);

                    if (instance.curSlide >= instance.maxSlide) {
                        instance.curSlide = instance.maxSlide-1;
                        onTouchEnd(instance);
                    }
                });
                options.onResize(instance);
            }

            this.addEventListener('touchcancel', function(event) { onTouchEnd(instance, event) });
            this.addEventListener('touchstart', function(event) { onTouchStart(instance, event) });
            this.addEventListener('touchmove', function(event) { onTouchMove(instance, event) });
            this.addEventListener('touchend', function(event) { onTouchEnd(instance, event) });
        });
        return this;
    };
})();

// scroll controls 这里是滚动控制
(function() {
    function goto(from, to, instance) {
        instance.running = false;
        clearTimeout(instance.timeout);

        if (!instance.running) {

            instance.running = true;
            instance.canEnter = false;

            instance.previous = from < 0 ? 0 : from;
            instance.current = to < 0 ? 0 : to;

            var count = instance.actionsList.length-1;
            instance.previous = from > count ? count : from;
            instance.current = to > count ? count : to;

            if (instance.actionsList[instance.current]) {
                if (instance.actionsList[instance.previous]) {
                    instance.actionsList[instance.previous].exitAction(instance.previous, instance.current);
                }

                instance.canEnter = true;
            }

            if (instance.canEnter) {
                if (instance.actionsList[instance.current].enterAction) {
                    instance.actionsList[instance.current].enterAction(instance.previous, instance.current);
                }

                instance.timeout = setTimeout(function() {
                    instance.running = false;

                    instance.actionsList[instance.current].afterAction(instance.previous, instance.current);
                }, instance.actionsList[instance.current].length || 0);
            } else {
                instance.running = false;
            }
        }
    }

    function next(instance) {
        if (instance.current < instance.actionsList.length) {
            goto(instance.current, instance.current+1, instance);
        }
    }

    function prev(instance) {
        if (instance.current > 0) {
            goto(instance.current, instance.current-1, instance);
        }
    }

    var Action = function() {};

    Action.prototype = {
        enterAction: null,
        exitAction: null,
        afterAction: null,
        length: 0
    };

    function Actions() {       
        var instance = this;
        instance.actionsList = [];
        instance.initied = false;
        instance.running = false;
        instance.canEnter = false;
        instance.current = 0;
        instance.previous = -1;
        instance.timeout = null;
    }

    Actions.prototype = {
        add: function(action) {
            if (action && action instanceof Action) {
                action.enterAction = action.enterAction || function() {};
                action.exitAction = action.exitAction || function() {};
                action.afterAction = action.afterAction || function() {};

                this.actionsList.push(action);
            }
        },
        goto: function(index) {
            goto(this.current, index, this);
        },
        next: function() {
            next(this);
        },
        prev: function() {
            prev(this);
        }
    };

    window.Action = Action;
    window.Actions = Actions;
})();

// Image preloader
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

// force preload
(function() {
    if (Device.isTouchscreen && Device.isMobile) {
        ImagesPreloader.addURLs([
            'img/loading.png',
            'img/dirt.png',
            'img/visionare.png',
            'img/circle-user.png',
            'img/circle-dream.png',
            'img/circle-step.png',
            'img/circle-magazine.png',
            'img/circle-community.png',
            'img/circle-friend.png',
            'img/look_inside.png'
        ]);
        ImagesPreloader.onFinish = function() {
            $('#loading').fadeOut(500);
            $body.css({overflow: 'visible'});
        };
    } else {
        ImagesPreloader.addURLs([
            'img/loading.png',
            'img/dirt.png',
            'img/balloon.png',
            'img/bus.png',
            'img/car.png',
            'img/cloud1.png',
            'img/cloud2.png',
            'img/golf.png',
            'img/ground1.png',
            'img/ground2.png',
            'img/hotdog.png',
            'img/house.png',
            'img/mountains.png',
            'img/rocket.png',
            'img/school.png',
            'img/sign.png',
            'img/skier.png',
            'img/sun.png',
            'img/surfer.png',
            'img/tree.png'
        ]);
        ImagesPreloader.onFinish = function() {
            $('#loading').fadeOut(500, initIntroAnimations);
        };
    }

    ImagesPreloader.start();
})();

// init sidenav toggle
(function() {
    $('#sidenav_toggle').click(function() {
        $(this).removeClass('trigger');
        $body.addClass('sidenav_visible');
    });

    $('#sidenav_close, #main_sections').click(function() {
        $body.removeClass('sidenav_visible');
    });
})();

// init want_select toggle
(function() {
    if (Device.isTouchscreen && Device.isMobile) {
        return false;
    }

    var $selectCurrent = $('#want_select');
    var $selectIcon = $('#want_select-icon');

    var $selectContent = $('#want_content');

    $selectCurrent.click(function(event) {
        event.stopPropagation();

        $(this).toggleClass('open');
    });

    $('#main_sections').click(function() {
        $selectCurrent.removeClass('open');
    });

    var $selectItemsHolder = $('#want_select-items');
    var $selectItems = $selectItemsHolder.find('.want_select-item');

    $selectItems.click(function(event) {
        event.preventDefault();

        $selectCurrent.html(this.children[1].innerHTML);
        $selectIcon.prop('src', this.children[0].src);
        $selectContent.html(this.children[3].innerHTML);
    });
})();

// init animations
function initIntroAnimations() {
    var canUseCSS3 = isCSSFeatureSupported('animation') && isCSSFeatureSupported('transition');

    var introLettersArr = document.getElementsByClassName('intro_text-letter');
    var hotdogLettersArr = document.getElementsByClassName('hotdog-text_letter');
    var appsLettersArr = document.getElementsByClassName('apps-text_letter');
    var awesomeLettersArr = document.getElementsByClassName('awesome-text_letter');
    var circleIconsArr = document.getElementsByClassName('circle-icon');

    var introLettersSequence = new Sequence();
    var hotdogLettersSequence = new Sequence();
    var appsLettersSequence = new Sequence();
    var awesomeLettersSequence = new Sequence();
    var circleIconsSequence = new Sequence();

    var introAnimationsSequence = new Sequence();
    var hotdogAnimationsSequence = new Sequence();
    var appsAnimationsSequence = new Sequence();
    var awesomeAnimationsSequence = new Sequence();

    var i, l;

    if (introLettersArr && introLettersArr.length) {
        for (i = 0, l = introLettersArr.length; i < l; i++) {
            introLettersSequence.tasks.push({
                wait: 50,
                task: function(taskIndex) {
                    if (canUseCSS3) {
                        $(introLettersArr[taskIndex]).addClass('trigger');
                    } else {
                        $(introLettersArr[taskIndex]).css({visibility: 'visible'});
                        $(introLettersArr[taskIndex]).animate({opacity:1}, 600, 'linear');
                    }
                }
            });
        }
    }

    if (hotdogLettersArr && hotdogLettersArr.length) {
        for (i = 0, l = hotdogLettersArr.length; i < l; i++) {
            hotdogLettersSequence.tasks.push({
                wait: 50,
                task: function(taskIndex) {
                    if (canUseCSS3) {
                        $(hotdogLettersArr[taskIndex]).addClass('trigger');
                    } else {
                        $(hotdogLettersArr[taskIndex]).css({visibility: 'visible'});
                        $(hotdogLettersArr[taskIndex]).animate({opacity:1}, 600, 'linear');
                    }
                }
            });
        }
    }

    if (appsLettersArr && appsLettersArr.length) {
        for (i = 0, l = appsLettersArr.length; i < l; i++) {
            appsLettersSequence.tasks.push({
                wait: 50,
                task: function(taskIndex) {
                    if (canUseCSS3) {
                        $(appsLettersArr[taskIndex]).addClass('trigger');
                    } else {
                        $(appsLettersArr[taskIndex]).css({visibility: 'visible'});
                        $(appsLettersArr[taskIndex]).animate({opacity:1}, 600, 'linear');
                    }
                }
            });
        }
    }

    if (awesomeLettersArr && awesomeLettersArr.length) {
        for (i = 0, l = awesomeLettersArr.length; i < l; i++) {
            awesomeLettersSequence.tasks.push({
                wait: 50,
                task: function(taskIndex) {
                    if (canUseCSS3) {
                        $(awesomeLettersArr[taskIndex]).addClass('trigger');
                    } else {
                        $(awesomeLettersArr[taskIndex]).css({visibility: 'visible'});
                        $(awesomeLettersArr[taskIndex]).animate({opacity:1}, 600, 'linear');
                    }
                }
            });
        }
    }

    if (circleIconsArr && circleIconsArr.length) {
        for (i = 0, l = circleIconsArr.length; i < l; i++) {
            circleIconsSequence.tasks.push({
                wait: i == 0 ? 1000 : 50,
                task: function(taskIndex) {
                    if (canUseCSS3) {
                        $(circleIconsArr[taskIndex]).addClass('trigger');
                    } else {
                        $(circleIconsArr[taskIndex]).css({visibility: 'visible'});
                        $(circleIconsArr[taskIndex]).animate({opacity:1}, 600, 'linear');
                    }
                }
            });
        }
    }

    if (canUseCSS3) {
        introAnimationsSequence.tasks.push({
            wait: 1000,
            task: function () {
                $('#intro_anim--cloud1').addClass('trigger');
                $('#intro_anim--cloud2').addClass('trigger');
            }
        });
        introAnimationsSequence.tasks.push({
            wait: 300,
            task: function () {
                introLettersSequence.run();
                $('#intro_anim--grounds_holder').addClass('trigger');
            }
        });
        introAnimationsSequence.tasks.push({
            wait: 50,
            task: function () {
                $('#intro_anim--ground1_holder').addClass('trigger');
            }
        });
        introAnimationsSequence.tasks.push({
            wait: 300,
            task: function () {
                $('#intro_anim--surfer').addClass('trigger');
                $('#intro_anim--rocket').addClass('trigger');
            }
        });
        introAnimationsSequence.tasks.push({
            wait: 150,
            task: function () {
                $('#intro_anim--mountains').addClass('trigger');
            }
        });
        introAnimationsSequence.tasks.push({
            wait: 150,
            task: function () {
                $('#intro_anim--ground2_top').addClass('trigger');
                $('#intro_anim--ground2_holder').addClass('trigger');
            }
        });
        introAnimationsSequence.tasks.push({
            wait: 150,
            task: function () {
                $('#intro_anim--skier').addClass('trigger');
            }
        });
        introAnimationsSequence.tasks.push({
            wait: 300,
            task: function () {
                $('#intro_anim--tree1').addClass('trigger');
                $('#intro_anim--tree2').addClass('trigger');
                $('#intro_anim--school').addClass('trigger');
                $('#intro_anim--hotdog').addClass('trigger');
            }
        });
        introAnimationsSequence.tasks.push({
            wait: 300,
            task: function () {
                $('#intro_anim--bus').addClass('trigger');
                $('#intro_anim--car').addClass('trigger');
                $('#intro_anim--sign').addClass('trigger');
                $('#intro_anim--golf').addClass('trigger');
                $('#intro_anim--house').addClass('trigger');
            }
        });
        introAnimationsSequence.tasks.push({
            wait: 100,
            task: function () {
                $('#intro_anim--sun').addClass('trigger');
                $('#intro_anim--balloon').addClass('trigger');
            }
        });
        introAnimationsSequence.tasks.push({
            wait: 100,
            task: function () {
                if (canUseCSS3) {
                    $('#intro_slide-desc').addClass('trigger');
                } else {
                    $('#intro_slide-desc').css({visibility: 'visible'});
                    $('#intro_slide-desc').animate({opacity: 1}, 1500);
                }
            }
        });
    } else {
        $('#intro_anim--cloud1').addClass('trigger');
        $('#intro_anim--cloud2').addClass('trigger');
        $('#intro_anim--grounds_holder').addClass('trigger');
        $('#intro_anim--ground1_holder').addClass('trigger');
        $('#intro_anim--surfer').addClass('trigger');
        $('#intro_anim--rocket').addClass('trigger');
        $('#intro_anim--mountains').addClass('trigger');
        $('#intro_anim--ground2_top').addClass('trigger');
        $('#intro_anim--ground2_holder').addClass('trigger');
        $('#intro_anim--skier').addClass('trigger');
        $('#intro_anim--tree1').addClass('trigger');
        $('#intro_anim--tree2').addClass('trigger');
        $('#intro_anim--school').addClass('trigger');
        $('#intro_anim--hotdog').addClass('trigger');
        $('#intro_anim--bus').addClass('trigger');
        $('#intro_anim--car').addClass('trigger');
        $('#intro_anim--sign').addClass('trigger');
        $('#intro_anim--golf').addClass('trigger');
        $('#intro_anim--house').addClass('trigger');
        $('#intro_anim--sun').addClass('trigger');
        $('#intro_anim--balloon').addClass('trigger');

        introAnimationsSequence.tasks.push({
            wait: 1000,
            task: function () {
                introLettersSequence.run();
                if (canUseCSS3) {
                    $('#intro_slide-desc').addClass('trigger');
                } else {
                    $('#intro_slide-desc').css({visibility: 'visible'});
                    $('#intro_slide-desc').animate({opacity: 1}, 1500);
                }
            }
        });
    }

    hotdogAnimationsSequence.tasks.push({
        wait: 1000,
        task: function () {
            if (canUseCSS3) {
                $('#hotdog-dontbe').addClass('trigger');
            } else {
                $('#hotdog-dontbe').css({visibility: 'visible'});
                $('#hotdog-dontbe').animate({opacity:1}, 1500);
            }
        }
    });
    hotdogAnimationsSequence.tasks.push({
        wait: 350,
        task: function () {
            hotdogLettersSequence.run();
        }
    });
    hotdogAnimationsSequence.tasks.push({
        wait: 500,
        task: function () {
            if (canUseCSS3) {
                $('#hotdog-desc').addClass('trigger');
            } else {
                $('#hotdog-desc').css({visibility: 'visible'});
                $('#hotdog-desc').animate({opacity:1}, 1500);
            }
        }
    });
    hotdogAnimationsSequence.tasks.push({
        wait: 200,
        task: function () {
            $('#hotdog-sign').addClass('trigger');
        }
    });

    appsAnimationsSequence.tasks.push({
        wait: 1000,
        task: function () {
            if (canUseCSS3) {
                $('#apps-start').addClass('trigger');
            } else {
                $('#apps-start').css({visibility: 'visible'});
                $('#apps-start').animate({opacity:1}, 1500);
            }
        }
    });
    appsAnimationsSequence.tasks.push({
        wait: 350,
        task: function () {
            appsLettersSequence.run();
        }
    });
    appsAnimationsSequence.tasks.push({
        wait: 200,
        task: function () {
            if (canUseCSS3) {
                $('#apps-desc').addClass('trigger');
            } else {
                $('#apps-desc').css({visibility: 'visible'});
                $('#apps-desc').animate({opacity:1}, 1500);
            }
        }
    });

    awesomeAnimationsSequence.tasks.push({
        wait: 1000,
        task: function () {
            if (canUseCSS3) {
                $('#awesome-be').addClass('trigger');
            } else {
                $('#awesome-be').css({visibility: 'visible'});
                $('#awesome-be').animate({opacity:1}, 1500);
            }
        }
    });
    awesomeAnimationsSequence.tasks.push({
        wait: 350,
        task: function () {
            awesomeLettersSequence.run();
        }
    });
    awesomeAnimationsSequence.tasks.push({
        wait: 200,
        task: function () {
            if (canUseCSS3) {
                $('#awesome-desc').addClass('trigger');
            } else {
                $('#awesome-desc').css({visibility: 'visible'});
                $('#awesome-desc').animate({opacity:1}, 1500);
            }
        }
    });
    awesomeAnimationsSequence.tasks.push({
        wait: 50,
        task: function () {
            if (canUseCSS3) {
                $('#awesome-sun1').addClass('trigger');
            } else {
                $('#awesome-sun1').css({visibility: 'visible'});
                $('#awesome-sun1').animate({opacity:1}, 1000);
            }
        }
    });
    awesomeAnimationsSequence.tasks.push({
        wait: 50,
        task: function () {
            if (canUseCSS3) {
                $('#awesome-sun2').addClass('trigger');
            } else {
                $('#awesome-sun2').css({visibility: 'visible'});
                $('#awesome-sun2').animate({opacity:1}, 1000);
            }
        }
    });

    function resetIntroAnimations() {
        if (canUseCSS3) {
            $(introLettersArr).removeClass('trigger');
            $('#intro_slide-desc').removeClass('trigger');
            $('#intro_anim--cloud1').removeClass('trigger');
            $('#intro_anim--cloud2').removeClass('trigger');
            $('#intro_anim--grounds_holder').removeClass('trigger');
            $('#intro_anim--ground1_holder').removeClass('trigger');
            $('#intro_anim--surfer').removeClass('trigger');
            $('#intro_anim--rocket').removeClass('trigger');
            $('#intro_anim--mountains').removeClass('trigger');
            $('#intro_anim--ground2_top').removeClass('trigger');
            $('#intro_anim--ground2_holder').removeClass('trigger');
            $('#intro_anim--skier').removeClass('trigger');
            $('#intro_anim--tree1').removeClass('trigger');
            $('#intro_anim--tree2').removeClass('trigger');
            $('#intro_anim--school').removeClass('trigger');
            $('#intro_anim--hotdog').removeClass('trigger');
            $('#intro_anim--bus').removeClass('trigger');
            $('#intro_anim--car').removeClass('trigger');
            $('#intro_anim--sign').removeClass('trigger');
            $('#intro_anim--golf').removeClass('trigger');
            $('#intro_anim--house').removeClass('trigger');
            $('#intro_anim--sun').removeClass('trigger');
            $('#intro_anim--balloon').removeClass('trigger');
        } else {
            $(introLettersArr).css({
                visibility: 'hidden',
                opacity: 0
            });
            $('#intro_slide-desc').css({
                visibility: 'hidden',
                opacity: 0
            });
        }
        introAnimationsSequence.reset();
        introLettersSequence.reset();
    };

    function resetHotdogAnimations() {
        if (canUseCSS3) {
            $(hotdogLettersArr).removeClass('trigger');
            $('#hotdog-dontbe').removeClass('trigger');
            $('#hotdog-desc').removeClass('trigger');
        } else {
            $(hotdogLettersArr).css({
                visibility: 'hidden',
                opacity: 0
            });
            $('#hotdog-dontbe').css({
                visibility: 'hidden',
                opacity: 0
            });
            $('#hotdog-desc').css({
                visibility: 'hidden',
                opacity: 0
            });
        }
        $('#hotdog-sign').removeClass('trigger');
        hotdogAnimationsSequence.reset();
        hotdogLettersSequence.reset();
    };

    function resetAppsAnimations() {
        if (canUseCSS3) {
            $(appsLettersArr).removeClass('trigger');
            $('#apps-start').removeClass('trigger');
            $('#apps-desc').removeClass('trigger');
        } else {
            $(appsLettersArr).css({
                visibility: 'hidden',
                opacity: 0
            });
            $('#apps-start').css({
                visibility: 'hidden',
                opacity: 0
            });
            $('#apps-desc').css({
                visibility: 'hidden',
                opacity: 0
            });
        }
        appsAnimationsSequence.reset();
        appsLettersSequence.reset();
    };

    function resetAwesomeAnimations() {
        if (canUseCSS3) {
            $(awesomeLettersArr).removeClass('trigger');

            $('#awesome-desc').removeClass('trigger');
            $('#awesome-be').removeClass('trigger');

            $('#awesome-sun1').removeClass('trigger');
            $('#awesome-sun2').removeClass('trigger');
        } else {
            $(awesomeLettersArr).css({
                visibility: 'hidden',
                opacity: 0
            });
            $('#awesome-be').css({
                visibility: 'hidden',
                opacity: 0
            });
            $('#awesome-desc').css({
                visibility: 'hidden',
                opacity: 0
            });
            $('#awesome-sun1').css({
                visibility: 'hidden',
                opacity: 0
            });
            $('#awesome-sun2').css({
                visibility: 'hidden',
                opacity: 0
            });
        }
        awesomeAnimationsSequence.reset();
        awesomeLettersSequence.reset();
    };

    function resetCircleIcons() {
        $(circleIconsArr).removeClass('trigger');
        circleIconsSequence.reset();
    };

    function resetHandAnimation() {
        $('#lookinside-hand--motion').removeClass('trigger_next trigger_prev');
        $('#lookinside-hand--motion').fadeOut(0);
        $('#lookinside-hand--motion').fadeIn(0);
    };

    var resizeFont = (function() {
        var animsHolder = document.getElementById('intro-anims_holder');
        var hotdogHolder = document.getElementById('intro-hotdog_holder');
        var appsHolder = document.getElementById('intro-apps_holder');
        var awesomeHolder = document.getElementById('intro-awesome_holder');

        var animsBe = document.getElementById('intro_text--be');
        var animsVisionare = document.getElementById('intro_text--visionare');

        var hotdogDontBe = document.getElementById('hotdog-dontbe');
        var hotdogLoser = document.getElementById('hotdog-loser');

        var appsStart = document.getElementById('apps-start');
        var appsApps = document.getElementById('apps-apps');

        var awesomeBe = document.getElementById('awesome-be');
        var awesomeAwesome = document.getElementById('awesome-awesome');

        return function() {
            animsBe.style.fontSize = animsHolder.scrollWidth / 10.2 + 'px';
            animsVisionare.style.fontSize = animsHolder.scrollWidth / 7.53 + 'px';

            hotdogDontBe.style.fontSize = hotdogHolder.scrollWidth / 15.7 + 'px';
            hotdogLoser.style.fontSize = hotdogHolder.scrollWidth / 6.56 + 'px';

            appsStart.style.fontSize = appsHolder.scrollWidth / 21 + 'px';
            appsApps.style.fontSize = appsHolder.scrollWidth / 8.42 + 'px';

            awesomeBe.style.fontSize = awesomeHolder.scrollWidth / 10.65 + 'px';
            awesomeAwesome.style.fontSize = awesomeHolder.scrollWidth / 7 + 'px';
        }
    })();

    window.onresize = resizeFont;

    resizeFont();

    function showSkipButton() {
        $introSkip.css({marginTop: '-66px'});
    }
    function hideSkipButton() {
        $introSkip.css({marginTop: '0px'});
    }

    var skipped = false;
    var disableHand = false;

    var $menuLinks = $('.menu_link', '#sidenav_menu');
    var $menuPoints = $('.timeline-point', '#timeline');

    var $lookinside = $('#lookinside');
    var $switchItem = $('#lookinside_switch').children();
    var $lookinsideCols = $('#lookinside_cols');
    var $lookinsideDesktop = $('#lookinside_desktop');

    var $sectionSlidesHolder = $('#section_slides-holder');
    var $sectionSlides = $('#section_slides');

    var $introSkip = $('#intro-skip');
    var $sectionViewsHolder = $('#section_views-holder');
    var $sectionViews = $('#section_views');

    var intro = new Action();
    intro.enterAction = function(from, to) {
        hideSkipButton();
        console.log(1111);
        resetIntroAnimations();
        introAnimationsSequence.run();

        if (canUseCSS3) {
            $sectionSlidesHolder.css({backgroundColor: '#a8cbd5'});
            $sectionSlides.css({top: '0%'});

            $introSkip.css({top: '100%'});
            $sectionViewsHolder.css({top: '100%'});
        } else {
            $sectionSlidesHolder.stop(true).animate({backgroundColor: '#a8cbd5'}, 1000, 'linear');
            $sectionSlides.stop(true).animate({top: '0%'}, 1000);

            $introSkip.stop(true).animate({top: '100%'}, 1000);
            $sectionViewsHolder.stop(true).animate({top: '100%'}, 1000);
        }

        activateMenuItem($menuLinks[0], $menuPoints[0]);
    };
    intro.afterAction = function() {
        showSkipButton();
    };
    intro.length = canUseCSS3 ? 4000 : 1000;

    var hotdog = new Action();
    hotdog.enterAction = function(from, to) {
        hideSkipButton();

        resetHotdogAnimations();
        hotdogAnimationsSequence.run();

        if (canUseCSS3) {
            $sectionSlidesHolder.css({backgroundColor: '#ee7e72'});
            $sectionSlides.css({top: '-100%'});

            $introSkip.css({top: '100%'});
            $sectionViewsHolder.css({top: '100%'});
        } else {
            $sectionSlidesHolder.stop(true).animate({backgroundColor: '#ee7e72'}, 1000, 'linear');
            $sectionSlides.stop(true).animate({top: '-100%'}, 1000);

            $introSkip.stop(true).animate({top: '100%'}, 1000);
            $sectionViewsHolder.stop(true).animate({top: '100%'}, 1000);
        }

        activateMenuItem($menuLinks[0], $menuPoints[0]);
    };
    hotdog.afterAction = function() {
        showSkipButton();
        resetIntroAnimations();
        resetAppsAnimations();
    };
    hotdog.length = 3000;

    var apps = new Action();
    apps.enterAction = function(from, to) {
        hideSkipButton();

        resetAppsAnimations();
        appsAnimationsSequence.run();

        if (canUseCSS3) {
            $sectionSlidesHolder.css({backgroundColor: '#e4be6c'});
            $sectionSlides.css({top: '-200%'});

            $introSkip.css({top: '100%'});
            $sectionViewsHolder.css({top: '100%'});
        } else {
            $sectionSlidesHolder.stop(true).animate({backgroundColor: '#e4be6c'}, 1000, 'linear');
            $sectionSlides.stop(true).animate({top: '-200%'}, 1000);

            $introSkip.stop(true).animate({top: '100%'}, 1000);
            $sectionViewsHolder.stop(true).animate({top: '100%'}, 1000);
        }

        activateMenuItem($menuLinks[0], $menuPoints[0]);
    };
    apps.afterAction = function() {
        showSkipButton();
        resetHotdogAnimations();
        resetAwesomeAnimations();
    };
    apps.length = 2500;

    var awesome = new Action();
    awesome.enterAction = function(from, to) {
        hideSkipButton();

        resetAwesomeAnimations();
        awesomeAnimationsSequence.run();

        if (from < to) {
            if (canUseCSS3) {
                $sectionSlidesHolder.css({backgroundColor: '#9c91bf'});
                $sectionSlides.css({top: '-300%'});
            } else {
                $sectionSlidesHolder.stop(true).animate({backgroundColor: '#9c91bf'}, 1000, 'linear');
                $sectionSlides.stop(true).animate({top: '-300%'}, 1000);
            }
        }

        if (canUseCSS3) {
            $introSkip.css({top: '100%'});
            $sectionViewsHolder.css({top: '100%'});
        } else {
            $introSkip.stop(true).animate({top: '100%'}, 1000);
            $sectionViewsHolder.stop(true).animate({top: '100%'}, 1000);
        }

        activateMenuItem($menuLinks[0], $menuPoints[0]);
    };
    awesome.afterAction = function() {
        showSkipButton();
        resetAppsAnimations();
    };
    awesome.length = 2500;

    var OPEN = new Action();
    OPEN.enterAction = function(from, to) {
        if (canUseCSS3) {
            $introSkip.css({top: '0%'});
            $sectionViewsHolder.css({top: '0%'});
        } else {
            $introSkip.stop(true).animate({top: '0%'}, 1000);
            $sectionViewsHolder.stop(true).animate({top: '0%'}, 1000);
        }

        actionsOther.goto(1);
    };
    OPEN.afterAction = function() {
        showSkipButton();
    };
    OPEN.length = 1000;

    var CLOSE = new Action();
    CLOSE.enterAction = function(from, to) {
        if (canUseCSS3) {
            $introSkip.css({top: '100%'});
            $sectionViewsHolder.css({top: '100%'});
        } else {
            $introSkip.stop(true).animate({top: '100%'}, 1000);
            $sectionViewsHolder.stop(true).animate({top: '100%'}, 1000);
        }

        if (skipped) {
            actionsIntro.goto(actionsIntro.current);
        } else {
            actionsIntro.goto(actionsIntro.actionsList.length-2);
        }
        skipped = false;
    };
    CLOSE.afterAction = function() {
        showSkipButton();
    };
    CLOSE.length = 1000;

    var wouldLike = new Action();
    wouldLike.enterAction = function(from, to) {
        hideSkipButton();

        if (from > to) {
            if (canUseCSS3) {
                $sectionViews.css({top: '0%'});
            } else {
                $sectionViews.stop(true).animate({top: '0%'}, 1000, 'linear');
            }
        }

        if (canUseCSS3) {
            $introSkip.css({top: '0%'});
            $sectionViewsHolder.css({top: '0%'});
        } else {
            $introSkip.stop(true).animate({top: '0%'}, 1000);
            $sectionViewsHolder.stop(true).animate({top: '0%'}, 1000);
        }
        activateMenuItem($menuLinks[1], $menuPoints[1]);
    };
    wouldLike.afterAction = function() {
        showSkipButton();
    };
    wouldLike.length = 1500;


    function switchPhoneSlide(index) {
        hideSkipButton();

        setTimeout(function() {
            var children = document.getElementById('lookinside-slides').children;

            if (canUseCSS3) {
                $('#lookinside-slides').css({left: -(index * 100) + '%'});

                $introSkip.css({top: '0%'});
                $sectionViewsHolder.css({top: '0%'});
                $sectionViews.css({top: '-100%'});

                $(children).removeClass('trigger');
                $(children[index]).addClass('trigger');
            } else {
                $('#lookinside-slides').stop(true).animate({left: -(index * 100) + '%'}, 1000);

                $introSkip.stop(true).animate({top: '0%'}, 1000);
                $sectionViewsHolder.stop(true).animate({top: '0%'}, 1000);
                $sectionViews.stop(true).animate({top: '-100%'}, 1000, 'linear');

                $(children).addClass('trigger');
            }

            $lookinside.removeClass('notebook_tab');
            $lookinsideCols.stop(true).fadeIn(1000);
            $lookinsideDesktop.stop(true).fadeOut(0);

            $switchItem.removeClass('active');
            $('#lookinside_switch--mobile').addClass('active');
        }, canUseCSS3 ? 500 : 0);

        activateMenuItem($menuLinks[2], $menuPoints[2]);
    }

    var lookInsideMobile1 = new Action();
    lookInsideMobile1.enterAction = function(from, to) {
        resetHandAnimation();
        switchPhoneSlide(0);

        if (from > to && !disableHand) {
            $('#lookinside-hand--motion').addClass('trigger_prev');
        }
        disableHand = false;
    };
    lookInsideMobile1.afterAction = function() {
        showSkipButton();
    };
    lookInsideMobile1.length = 2000;

    var lookInsideMobile2 = new Action();
    lookInsideMobile2.enterAction = function(from, to) {
        resetHandAnimation();
        switchPhoneSlide(1);

        $('#lookinside-hand--motion').addClass(from > to && !disableHand ? 'trigger_prev' : 'trigger_next');
        disableHand = false;
    };
    lookInsideMobile2.afterAction = function() {
        showSkipButton();
    };
    lookInsideMobile2.length = 2000;

    var lookInsideMobile3 = new Action();
    lookInsideMobile3.enterAction = function(from, to) {
        resetHandAnimation();
        switchPhoneSlide(2);

        if (from < to && !disableHand) {
            $('#lookinside-hand--motion').addClass('trigger_next');
        }
        disableHand = false;
    };
    lookInsideMobile3.afterAction = function() {
        showSkipButton();
    };
    lookInsideMobile3.length = 2000;

    var lookInsideDesktop = new Action();
    lookInsideDesktop.enterAction = function(from, to) {
        hideSkipButton();
        resetHandAnimation();

        if (canUseCSS3) {
            $('#lookinside-slides').css({left: '-200%'});

            $introSkip.css({top: '0%'});
            $sectionViewsHolder.css({top: '0%'});
            $sectionViews.css({top: '-100%'});
        } else {
            $('#lookinside-slides').stop(true).animate({left: '-20%'}, 1000);

            $introSkip.stop(true).animate({top: '0%'}, 1000);
            $sectionViewsHolder.stop(true).animate({top: '0%'}, 1000);
            $sectionViews.stop(true).animate({top: '-100%'}, 1000, 'linear');
        }

        $switchItem.removeClass('active');
        $('#lookinside_switch--desktop').addClass('active');

        $lookinside.addClass('notebook_tab');
        $lookinsideCols.stop(true).fadeOut(0);
        $lookinsideDesktop.stop(true).fadeIn(1000);

        activateMenuItem($menuLinks[2], $menuPoints[2]);
    };
    lookInsideDesktop.afterAction = function() {
        showSkipButton();
    };
    lookInsideDesktop.length = 2000;

    var features = new Action();
    features.enterAction = function(from, to) {
        hideSkipButton();

        resetCircleIcons();
        circleIconsSequence.run();

        if (canUseCSS3) {
            $introSkip.css({top: '0%'});
            $sectionViewsHolder.css({top: '0%'});
            $sectionViews.css({top: '-200%'});
        } else {
            $introSkip.stop(true).animate({top: '0%'}, 1000);
            $sectionViewsHolder.stop(true).animate({top: '0%'}, 1000);
            $sectionViews.stop(true).animate({top: '-200%'}, 1000, 'linear');
        }

        activateMenuItem($menuLinks[3], $menuPoints[3]);
    };
    features.afterAction = showSkipButton;
    features.length = 2000;

    var makeWish = new Action();
    makeWish.enterAction = function(from, to) {
        hideSkipButton();

        if (canUseCSS3) {
            $introSkip.css({top: '0%'});
            $sectionViewsHolder.css({top: '0%'});
            $sectionViews.css({top: '-300%'});
        } else {
            $introSkip.stop(true).animate({top: '0%'}, 1000);
            $sectionViewsHolder.stop(true).animate({top: '0%'}, 1000);
            $sectionViews.stop(true).animate({top: '-300%'}, 1000, 'linear');
        }

        activateMenuItem($menuLinks[4], $menuPoints[4]);
    };
    makeWish.afterAction = showSkipButton;
    makeWish.length = 2000;

    var actionsIntro = new Actions();
    actionsIntro.add(intro);
    actionsIntro.add(hotdog);
    actionsIntro.add(apps);
    actionsIntro.add(awesome);
    actionsIntro.add(OPEN);

    var actionsOther = new Actions();
    actionsOther.add(CLOSE);
    actionsOther.add(wouldLike);
    actionsOther.add(lookInsideMobile1);
    actionsOther.add(lookInsideMobile2);
    actionsOther.add(lookInsideMobile3);
    actionsOther.add(lookInsideDesktop);
    actionsOther.add(features);
    actionsOther.add(makeWish);

    $('#intro-skip').click(function() {
        if (!actionsIntro.running) {
            OPEN.enterAction(-1, 0);
            skipped = true;
        }
    });

    function activateMenuItem(link, point) {
        $menuLinks.removeClass('active');
        $menuPoints.removeClass('active');

        if (!link) {
            link = $menuLinks[$(point).index()];
        }

        if (!point) {
            point = $menuPoints[$(link).index()];
        }

        $(link).addClass('active');
        $(point).addClass('active');
    }

    function gotoMenuItem(link, point) {
        switch((link || point).hash) {
            case '#nav_0':
            case '#nav_1':
            case '#nav_2':
            case '#nav_3':
            case '#nav_4':
                actionsIntro.running = false;
                actionsOther.running = false;

                clearTimeout(actionsIntro.timeout);
                clearTimeout(actionsOther.timeout);

                activateMenuItem(link, point);
        }
        switch((link || point).hash) {
            case '#nav_0':
                actionsIntro.goto(0);
                break;
            case '#nav_1':
                actionsOther.goto(1);
                break;
            case '#nav_2':
                actionsOther.goto(2);
                break;
            case '#nav_3':
                actionsOther.goto(actionsOther.actionsList.length-2);
                break;
            case '#nav_4':
                actionsOther.goto(actionsOther.actionsList.length-1);
                break;
        }
    }

    $menuLinks.click(function(event) {
        event.preventDefault();

        gotoMenuItem(this, null);
    });

    $menuPoints.click(function(event) {
        event.preventDefault();

        gotoMenuItem(null, this);
    });

    $switchItem.click(function() {
        disableHand = true;
        if (this.id.indexOf('mobile') == -1) {
            actionsOther.goto(actionsOther.actionsList.length-3);
        } else {
            actionsOther.goto(2);
        }
    });

    actionsIntro.goto(0);

    var fakeEvent = {deltaY: 0};
    function onMouseWheel(event, instance) {
        if (event.deltaY < 0) {
            instance.next(instance);
            console.log(instance);
        } else {
            instance.prev(instance);
            console.log(instance.next);
        }
    }

    $sectionSlidesHolder.mousewheel(function(event) {
        event.stopPropagation();
        // 这里是关键 ，检查是否正在运动，如果不在运动就接着执行下一个task
        if (!actionsIntro.running) {
            onMouseWheel(event, actionsIntro);
        }
    });

    $sectionViewsHolder.mousewheel(function(event) {
        event.stopPropagation();

        if (!actionsOther.running) {
            onMouseWheel(event, actionsOther);
        }
    });

    $body.keydown(function(event) {
        var top = +($introSkip[0].style.top || '0%').replace('%', '');
        var instance = top > 0 ? actionsIntro : actionsOther;

        fakeEvent.deltaY = 0;

        if (event.keyCode == 38) {
            fakeEvent.deltaY = 1;
        }
        if (event.keyCode == 40) {
            fakeEvent.deltaY = -1;
        }

        if (fakeEvent.deltaY != 0) {
            onMouseWheel(fakeEvent, instance);
            return false;
        }
    });

    if (Device.isTouchscreen && !Device.isMobile) {
        var touchStart = 0;
        var touchEnd = 0;
        var touchStarted = false;
        var touchMoved = false;
        var touchInstance;
        var longTouchTimeout;

        function onTouchStart(instance, event) {
            clearTimeout(longTouchTimeout);

            touchStart = event.changedTouches[0].pageY;
            touchInstance = instance;

            touchStarted = true;
            touchMoved = false;

            longTouchTimeout = setTimeout(function() {
                touchStarted = false;
                touchMoved = false;
            }, 250);
        }
        function onTouchMove(instance, event) {
            clearTimeout(longTouchTimeout);

            if (touchStarted && touchInstance === instance) {
                event.preventDefault();
                touchMoved = true;
            }
        }
        function onTouchEnd(instance, event) {
            touchEnd = event.changedTouches[0].pageY;
            fakeEvent.deltaY = touchEnd - touchStart;

            if (touchInstance === instance && touchMoved && Math.abs(fakeEvent.deltaY) > 50) {
                onMouseWheel(fakeEvent, touchInstance);
            }

            touchStarted = false;
            touchMoved = false;
        }

        $sectionSlidesHolder[0].addEventListener('touchcancel', function(event) { onTouchEnd(actionsIntro, event) });
        $sectionSlidesHolder[0].addEventListener('touchstart', function(event) { onTouchStart(actionsIntro, event) });
        $sectionSlidesHolder[0].addEventListener('touchmove', function(event) { onTouchMove(actionsIntro, event) });
        $sectionSlidesHolder[0].addEventListener('touchend', function(event) { onTouchEnd(actionsIntro, event) });

        $sectionViewsHolder[0].addEventListener('touchcancel', function(event) { onTouchEnd(actionsOther, event) });
        $sectionViewsHolder[0].addEventListener('touchstart', function(event) { onTouchStart(actionsOther, event) });
        $sectionViewsHolder[0].addEventListener('touchmove', function(event) { onTouchMove(actionsOther, event) });
        $sectionViewsHolder[0].addEventListener('touchend', function(event) { onTouchEnd(actionsOther, event) });
    }
}

if (Device.isTouchscreen && Device.isMobile) {
    $('#section_slides').remove();
    $('#lookinside_switch').remove();
    $('#lookinside_cols').parent().remove();
    $('#iwantto').replaceWith($('#features'));

    $('#lookinside').find('.section_subtitle').html('Mobile');

    var $circles = $('#circles');
    var $circleItems = $circles.find('.circle-item');
    var $circlesSlides = $('#circles-slides');
    var $circlesPoints = $('#circles-slides_points');
    var $circlesPoint = $circlesPoints.children().remove();

    var count = $circleItems.length;
    var width;

    $circles.find('.circles-split').remove();
    $circlesSlides.append($circleItems);

    function resizeSlides(instance) {
        width = $circles.width();

        if ($body.width() > $body.height()) {
            instance.maxSlide = Math.round(count/2);
            $circleItems.css({maxWidth: width/2});
        } else {
            instance.maxSlide = count;
            $circleItems.css({maxWidth: width});
        }

        $circlesSlides.css({width: width * instance.maxSlide});

        $circlesPoints.html('');

        for (var i = 0; i < instance.maxSlide; i++) {
            $circlesPoint.clone().appendTo($circlesPoints);
        }

        changedSlides(instance);

        instance.maxSlide = instance.maxSlide > 0 ? instance.maxSlide - 1 : 0;
    }

    function changedSlides(instance) {
        var $children = $circlesPoints.children().removeClass('active');
        $($children[instance.curSlide]).addClass('active');
    }

    $circles.swipeGallery({
        slidesHolder: '#circles-slides',
        onResize: resizeSlides,
        onChange: changedSlides
    });
} else {
    $('#watch_video').youtubePopUp();
}

// form controls mostly created by Marek Fajkus as front-end developer in Madeo.cz
// edited by Marek Zeman as head front-end developer in Madeo.cz
(function() {
    var $inputDream = $('#makeawish-dream');
    var $inputEmail = $('#makeawish-email');
    var $errorDream = $('#makeawish-dream-error');
    var $errorEmail = $('#makeawish-email-error');
    var $success = $('#makeawish-success');
    var $form = $('#makeawish-form');
    var $alert = $form.find('.alert-error');

    $alert.click(function() {
        $form.toggleClass('step-b');
    });

    $('#makeawish-nextstepBtn').click(function() {
        if (isNotEmpty($inputDream.val(), 5)) {
            $errorDream.hide(0);
        } else {
            $errorDream.show(0);
        }
        $form.toggleClass('step-b');
    });

    $('#makeawish-submit').on('click', function(event) {
        if (isEmail($inputEmail.val())) {
            $success.html('Sending ...').show(0);
            $errorEmail.hide(0);
        } else {
            event.preventDefault();

            $success.hide(0);
            $errorEmail.show(0);
        }

        $form.removeClass('step-b');
    });

    $form.on('keyup keypress', function(event) {
        if ((event.keyCode || event.which) == 13) {
            event.preventDefault();
            return false;
        }
    });

    $form.submit(function(event) {
        event.preventDefault();

        $.support.cors = true;

        $.ajax({
            url: $form.attr('action'),
            type: $form.attr('method') || 'POST',
            data: $form.serialize(),
            crossDomain: true,
            success: function() {
                $success.html('Sent successfully. Thank you!').off('click').css({cursor:'default'});
            },
            error: function(event) {
                console.log('error:', event);

                $success.hide(0);
                $errorEmail.html('There is an error please try again later.').off('click').css({cursor:'default'}).show(0);
            }
        });
    });

    function isEmail(string) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(string);
    }
    function isNotEmpty(string, minLength) {
        return ('' + string).replace(/[^\w\d]+/g, '').length >= minLength;
    }
})();