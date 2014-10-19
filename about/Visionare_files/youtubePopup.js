/*
 *  Made by Marek Fajkus
 */
// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, document, undefined ) {

    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window and document are passed through as local variable rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // Create the defaults once
    var pluginName = "youtubePopUp",
        defaults = {
        propertyName: "value"
    };

    // The actual plugin constructor
    function Plugin ( element, options ) {
        this.element = element;
        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.settings = $.extend( {}, defaults, options );
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    Plugin.prototype = {
        init: function () {
            // Place initialization logic here
            // You already have access to the DOM element and
            // the options via the instance, e.g. this.element
            // and this.settings
            // you can add more functions like the one below and
            // call them like so: this.yourOtherFunction(this.element, this.settings).

            // create dom elements if not exist
            if (!$('#youtubepopup-container').length) {
              this.setupContainer();
            }

            // cashe elements
            this.cacheElements();

            this.prepareContent();

            var self = this;

            // open modal
            $(this.element).on('click', function(e) {
              e.preventDefault();

              self.openModal();
            });

            this.cached.body.on('click', function() {
              self.closeModal();
            });

            $(document).keyup(function(e) {
              if (e.keyCode == 27 && self.cached.container.is(':visible')) {
                self.closeModal();
              }
            });
        },
        closeModal: function() {
          this.cached.container.hide();

          // destroy player
          this.cached.content.prop('src', '').html('');
        },
        openModal: function() {
          var content = this.content;
          this.cached.content.html(content);

          // open modal
          this.cached.container.css('display', 'table');
        },
        prepareContent: function() {
          var url = this.buildVideoURL($(this.element).attr('href'));
          this.content = '<iframe src="' + url + '?theme=dark&color=red" class="youtube-embed">';
        },
        buildVideoURL: function(link) {
          return link.replace(/(?:http:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/g, 'www.youtube.com/embed/$1');
        },
        setupContainer: function() {
          var elements = '<div id="youtubepopup-container"><div class="popup-body"><div class="popup-close"></div><div class="popup-content"></div></div></div>';
          $('body').append(elements);
        },
        cacheElements: function() {
          var container = $('#youtubepopup-container'),
              body = container.find('.popup-body'),
              popupContent = container.find('.popup-content');

          this.cached = {
            container: container,
            body: body,
            content: popupContent
          };
        }
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[ pluginName ] = function ( options ) {
        this.each(function() {
            if ( !$.data( this, "plugin_" + pluginName ) ) {
                $.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
            }
        });

        // chain jQuery functions
        return this;
    };

})( jQuery, window, document );
