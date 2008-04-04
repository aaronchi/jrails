(function($) {

  $.ec = $.ec || {}; //Add the 'ec' scope

  $.extend($.ec, {
    save: function(el, set) {
      for(var i=0;i<set.length;i++) {
        if(set[i] !== null) $.data(el[0], "ec.storage."+set[i], el.css(set[i]));
      }
    },
    restore: function(el, set) {
      for(var i=0;i<set.length;i++) {
        if(set[i] !== null) el.css(set[i], $.data(el[0], "ec.storage."+set[i]));
      }
    },
    setMode: function(el, mode) {
      if (mode == 'toggle') mode = el.is(':hidden') ? 'show' : 'hide'; // Set for toggle
      return mode;
    },
    getBaseline: function(origin, original) { // Translates a [top,left] array into a baseline value
      // this should be a little more flexible in the future to handle a string & hash
      var y, x;
      switch (origin[0]) {
        case 'top': y = 0; break;
        case 'middle': y = 0.5; break;
        case 'bottom': y = 1; break;
        default: y = origin[0] / original.height;
      };
      switch (origin[1]) {
        case 'left': x = 0; break;
        case 'center': x = 0.5; break;
        case 'right': x = 1; break;
        default: x = origin[1] / original.width;
      };
      return {x: x, y: y};
    },
    createWrapper: function(el) {
      if (el.parent().attr('id') == 'fxWrapper')
        return el;
      var props = {width: el.outerWidth({margin:true}), height: el.outerHeight({margin:true}), 'float': el.css('float')};
      el.wrap('<div id="fxWrapper"></div>');
      var wrapper = el.parent();
      if (el.css('position') == 'static'){
        wrapper.css({position: 'relative'});
        el.css({position: 'relative'});
      } else {
        var top = parseInt(el.css('top'), 10); if (top.constructor != Number) top = 'auto';
        var left = parseInt(el.css('left'), 10); if (left.constructor != Number) left = 'auto';
        wrapper.css({ position: el.css('position'), top: top, left: left, zIndex: el.css('z-index') }).show();
        el.css({position: 'relative', top:0, left:0});
      }
      wrapper.css(props);
      return wrapper;
    },
    removeWrapper: function(el) {
      if (el.parent().attr('id') == 'fxWrapper')
        return el.parent().replaceWith(el);
      return el;
    },
    setTransition: function(el, list, factor, val) {
      val = val || {};
      $.each(list,function(i, x){
        unit = el.cssUnit(x);
        if (unit[0] > 0) val[x] = unit[0] * factor + unit[1];
      });
      return val;
    },
    animateClass: function(value, duration, easing, callback) {

      var cb = (typeof easing == "function" ? easing : (callback ? callback : null));
      var ea = (typeof easing == "object" ? easing : null);

      this.each(function() {

        var offset = {}; var that = $(this); var oldStyleAttr = that.attr("style") || '';
        if(typeof oldStyleAttr == 'object') oldStyleAttr = oldStyleAttr["cssText"]; /* Stupidly in IE, style is a object.. */
        if(value.toggle) { that.hasClass(value.toggle) ? value.remove = value.toggle : value.add = value.toggle; }

        //Let's get a style offset
        var oldStyle = $.extend({}, (document.defaultView ? document.defaultView.getComputedStyle(this,null) : this.currentStyle));
        if(value.add) that.addClass(value.add); if(value.remove) that.removeClass(value.remove);
        var newStyle = $.extend({}, (document.defaultView ? document.defaultView.getComputedStyle(this,null) : this.currentStyle));
        if(value.add) that.removeClass(value.add); if(value.remove) that.addClass(value.remove);

        // The main function to form the object for animation
        for(var n in newStyle) {
          if( typeof newStyle[n] != "function" && newStyle[n] /* No functions and null properties */
          && n.indexOf("Moz") == -1 && n.indexOf("length") == -1 /* No mozilla spezific render properties. */
          && newStyle[n] != oldStyle[n] /* Only values that have changed are used for the animation */
          && (n.match(/color/i) || (!n.match(/color/i) && !isNaN(parseInt(newStyle[n],10)))) /* Only things that can be parsed to integers or colors */
          && (oldStyle.position != "static" || (oldStyle.position == "static" && !n.match(/left|top|bottom|right/))) /* No need for positions when dealing with static positions */
          ) offset[n] = newStyle[n];
        }

        that.animate(offset, duration, ea, function() { // Animate the newly constructed offset object
          // Change style attribute back to original. For stupid IE, we need to clear the damn object.
          if(typeof $(this).attr("style") == 'object') { $(this).attr("style")["cssText"] = ""; $(this).attr("style")["cssText"] = oldStyleAttr; } else $(this).attr("style", oldStyleAttr);
          if(value.add) $(this).addClass(value.add); if(value.remove) $(this).removeClass(value.remove);
          if(cb) cb.apply(this, arguments);
        });

      });
    }
  });

  //Extend the methods of jQuery
  $.fn.extend({
    //Save old methods
    _show: $.fn.show,
    _hide: $.fn.hide,
    __toggle: $.fn.toggle,
    _addClass: $.fn.addClass,
    _removeClass: $.fn.removeClass,
    _toggleClass: $.fn.toggleClass,
    // New ec methods
    effect: function(fx,o,speed,callback) {
      return $.ec[fx] ? $.ec[fx].call(this, {method: fx, options: o || {}, duration: speed, callback: callback }) : null;
    },
    show: function() {
      if(!arguments[0] || (arguments[0].constructor == Number || /(slow|normal|fast)/.test(arguments[0])))
        return this._show.apply(this, arguments);
      else {
        var o = arguments[1] || {}; o['mode'] = 'show';
        return this.effect.apply(this, [arguments[0], o, arguments[2] || o.duration, arguments[3] || o.callback]);
      }
    },
    hide: function() {
      if(!arguments[0] || (arguments[0].constructor == Number || /(slow|normal|fast)/.test(arguments[0])))
        return this._hide.apply(this, arguments);
      else {
        var o = arguments[1] || {}; o['mode'] = 'hide';
        return this.effect.apply(this, [arguments[0], o, arguments[2] || o.duration, arguments[3] || o.callback]);
      }
    },
    toggle: function(){
      if(!arguments[0] || (arguments[0].constructor == Number || /(slow|normal|fast)/.test(arguments[0])) || (arguments[0].constructor == Function))
        return this.__toggle.apply(this, arguments);
      else {
        var o = arguments[1] || {}; o['mode'] = 'toggle';
        return this.effect.apply(this, [arguments[0], o, arguments[2] || o.duration, arguments[3] || o.callback]);
      }
    },
    addClass: function(classNames,speed,easing,callback) {
      return speed ? $.ec.animateClass.apply(this, [{ add: classNames },speed,easing,callback]) : this._addClass(classNames);
    },
    removeClass: function(classNames,speed,easing,callback) {
      return speed ? $.ec.animateClass.apply(this, [{ remove: classNames },speed,easing,callback]) : this._removeClass(classNames);
    },
    toggleClass: function(classNames,speed,easing,callback) {
      return speed ? $.ec.animateClass.apply(this, [{ toggle: classNames },speed,easing,callback]) : this._toggleClass(classNames);
    },
    morph: function(remove,add,speed,easing,callback) {
      return $.ec.animateClass.apply(this, [{ add: add, remove: remove },speed,easing,callback]);
    },
    switchClass: function() {
      this.morph.apply(this, arguments);
    },
    // helper functions
    cssUnit: function(key) {
      var style = this.css(key), val = [];
      $.each( ['em','px','%','pt'], function(i, unit){
        if(style.indexOf(unit) > 0)
          val = [parseFloat(style), unit];
      });
      return val;
    }
  });

  /*
   * jQuery Color Animations
   * Copyright 2007 John Resig
   * Released under the MIT and GPL licenses.
   */

    // We override the animation for all of these color styles
    jQuery.each(['backgroundColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'borderTopColor', 'color', 'outlineColor'], function(i,attr){
        jQuery.fx.step[attr] = function(fx){
            if ( fx.state == 0 ) {
                fx.start = getColor( fx.elem, attr );
                fx.end = getRGB( fx.end );
            }

            fx.elem.style[attr] = "rgb(" + [
                Math.max(Math.min( parseInt((fx.pos * (fx.end[0] - fx.start[0])) + fx.start[0]), 255), 0),
                Math.max(Math.min( parseInt((fx.pos * (fx.end[1] - fx.start[1])) + fx.start[1]), 255), 0),
                Math.max(Math.min( parseInt((fx.pos * (fx.end[2] - fx.start[2])) + fx.start[2]), 255), 0)
            ].join(",") + ")";
        }
    });

    // Color Conversion functions from highlightFade
    // By Blair Mitchelmore
    // http://jquery.offput.ca/highlightFade/

    // Parse strings looking for color tuples [255,255,255]
    function getRGB(color) {
        var result;

        // Check if we're already dealing with an array of colors
        if ( color && color.constructor == Array && color.length == 3 )
            return color;

        // Look for rgb(num,num,num)
        if (result = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(color))
            return [parseInt(result[1]), parseInt(result[2]), parseInt(result[3])];

        // Look for rgb(num%,num%,num%)
        if (result = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(color))
            return [parseFloat(result[1])*2.55, parseFloat(result[2])*2.55, parseFloat(result[3])*2.55];

        // Look for #a0b1c2
        if (result = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(color))
            return [parseInt(result[1],16), parseInt(result[2],16), parseInt(result[3],16)];

        // Look for #fff
        if (result = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(color))
            return [parseInt(result[1]+result[1],16), parseInt(result[2]+result[2],16), parseInt(result[3]+result[3],16)];

        // Look for rgba(0, 0, 0, 0) == transparent in Safari 3
        if (result = /rgba\(0, 0, 0, 0\)/.exec(color))
            return colors['transparent']

        // Otherwise, we're most likely dealing with a named color
        return colors[jQuery.trim(color).toLowerCase()];
    }

    function getColor(elem, attr) {
        var color;

        do {
            color = jQuery.curCSS(elem, attr);

            // Keep going until we find an element that has color, or we hit the body
            if ( color != '' && color != 'transparent' || jQuery.nodeName(elem, "body") )
                break;

            attr = "backgroundColor";
        } while ( elem = elem.parentNode );

        return getRGB(color);
    };

    // Some named colors to work with
    // From Interface by Stefan Petre
    // http://interface.eyecon.ro/

    var colors = {
        aqua:[0,255,255],
        azure:[240,255,255],
        beige:[245,245,220],
        black:[0,0,0],
        blue:[0,0,255],
        brown:[165,42,42],
        cyan:[0,255,255],
        darkblue:[0,0,139],
        darkcyan:[0,139,139],
        darkgrey:[169,169,169],
        darkgreen:[0,100,0],
        darkkhaki:[189,183,107],
        darkmagenta:[139,0,139],
        darkolivegreen:[85,107,47],
        darkorange:[255,140,0],
        darkorchid:[153,50,204],
        darkred:[139,0,0],
        darksalmon:[233,150,122],
        darkviolet:[148,0,211],
        fuchsia:[255,0,255],
        gold:[255,215,0],
        green:[0,128,0],
        indigo:[75,0,130],
        khaki:[240,230,140],
        lightblue:[173,216,230],
        lightcyan:[224,255,255],
        lightgreen:[144,238,144],
        lightgrey:[211,211,211],
        lightpink:[255,182,193],
        lightyellow:[255,255,224],
        lime:[0,255,0],
        magenta:[255,0,255],
        maroon:[128,0,0],
        navy:[0,0,128],
        olive:[128,128,0],
        orange:[255,165,0],
        pink:[255,192,203],
        purple:[128,0,128],
        violet:[128,0,128],
        red:[255,0,0],
        silver:[192,192,192],
        white:[255,255,255],
        yellow:[255,255,0],
        transparent: [255,255,255]
    };

})(jQuery);

/* Copyright (c) 2007 Paul Bakaus (paul.bakaus@googlemail.com) and Brandon Aaron (brandon.aaron@gmail.com || http://brandonaaron.net)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * $LastChangedDate: 2007-12-20 07:43:48 -0700 (Thu, 20 Dec 2007) $
 * $Rev: 4257 $
 *
 * Version: @VERSION
 *
 * Requires: jQuery 1.2+
 */

(function($){
  
$.dimensions = {
  version: '@VERSION'
};

// Create innerHeight, innerWidth, outerHeight and outerWidth methods
$.each( [ 'Height', 'Width' ], function(i, name){
  
  // innerHeight and innerWidth
  $.fn[ 'inner' + name ] = function() {
    if (!this[0]) return;
    
    var torl = name == 'Height' ? 'Top'    : 'Left',  // top or left
        borr = name == 'Height' ? 'Bottom' : 'Right'; // bottom or right
    
    return this.is(':visible') ? this[0]['client' + name] : num( this, name.toLowerCase() ) + num(this, 'padding' + torl) + num(this, 'padding' + borr);
  };
  
  // outerHeight and outerWidth
  $.fn[ 'outer' + name ] = function(options) {
    if (!this[0]) return;
    
    var torl = name == 'Height' ? 'Top'    : 'Left',  // top or left
        borr = name == 'Height' ? 'Bottom' : 'Right'; // bottom or right
    
    options = $.extend({ margin: false }, options || {});
    
    var val = this.is(':visible') ? 
        this[0]['offset' + name] : 
        num( this, name.toLowerCase() )
          + num(this, 'border' + torl + 'Width') + num(this, 'border' + borr + 'Width')
          + num(this, 'padding' + torl) + num(this, 'padding' + borr);
    
    return val + (options.margin ? (num(this, 'margin' + torl) + num(this, 'margin' + borr)) : 0);
  };
});

// Create scrollLeft and scrollTop methods
$.each( ['Left', 'Top'], function(i, name) {
  $.fn[ 'scroll' + name ] = function(val) {
    if (!this[0]) return;
    
    return val != undefined ?
    
      // Set the scroll offset
      this.each(function() {
        this == window || this == document ?
          window.scrollTo( 
            name == 'Left' ? val : $(window)[ 'scrollLeft' ](),
            name == 'Top'  ? val : $(window)[ 'scrollTop'  ]()
          ) :
          this[ 'scroll' + name ] = val;
      }) :
      
      // Return the scroll offset
      this[0] == window || this[0] == document ?
        self[ (name == 'Left' ? 'pageXOffset' : 'pageYOffset') ] ||
          $.boxModel && document.documentElement[ 'scroll' + name ] ||
          document.body[ 'scroll' + name ] :
        this[0][ 'scroll' + name ];
  };
});

$.fn.extend({
  position: function() {
    var left = 0, top = 0, elem = this[0], offset, parentOffset, offsetParent, results;
    
    if (elem) {
      // Get *real* offsetParent
      offsetParent = this.offsetParent();
      
      // Get correct offsets
      offset       = this.offset();
      parentOffset = offsetParent.offset();
      
      // Subtract element margins
      offset.top  -= num(elem, 'marginTop');
      offset.left -= num(elem, 'marginLeft');
      
      // Add offsetParent borders
      parentOffset.top  += num(offsetParent, 'borderTopWidth');
      parentOffset.left += num(offsetParent, 'borderLeftWidth');
      
      // Subtract the two offsets
      results = {
        top:  offset.top  - parentOffset.top,
        left: offset.left - parentOffset.left
      };
    }
    
    return results;
  },
  
  offsetParent: function() {
    var offsetParent = this[0].offsetParent;
    while ( offsetParent && (!/^body|html$/i.test(offsetParent.tagName) && $.css(offsetParent, 'position') == 'static') )
      offsetParent = offsetParent.offsetParent;
    return $(offsetParent);
  }
});

function num(el, prop) {
  return parseInt($.curCSS(el.jquery?el[0]:el,prop,true))||0;
};

})(jQuery);

(function($) {
  
  $.ec.blind = function(o) {

    return this.queue(function() {

      // Create element
      var el = $(this), props = ['position'];
      
      // Set options
      var mode = $.ec.setMode(el, o.options.mode || 'hide'); // Set Mode
      var direction = o.options.direction || 'vertical'; // Default direction
      
      // Adjust
      $.ec.save(el, props); el.show(); // Save & Show
      var wrapper = $.ec.createWrapper(el).css({overflow:'hidden'}); // Create Wrapper
      var ref = (direction == 'vertical') ? 'height' : 'width';
      var distance = (direction == 'vertical') ? wrapper.height() : wrapper.width();
      if(mode == 'show') wrapper.css(ref, 0); // Shift
      
      // Animation
      var animation = {};
      animation[ref] = mode == 'show' ? distance : 0;
     
      // Animate
      wrapper.animate(animation, o.duration, o.options.easing, function() {
        if(mode == 'hide') el.hide(); // Hide
        $.ec.restore(el, props); $.ec.removeWrapper(el); // Restore
        if(o.callback) o.callback.apply(this, arguments); // Callback
        el.dequeue();
      });
      
    });
    
  };
  
})(jQuery);

(function($) {

  $.ec.bounce = function(o) {

    return this.queue(function() {

      // Create element
      var el = $(this), props = ['position','top','left'];

      // Set options
      var mode = $.ec.setMode(el, o.options.mode || 'effect'); // Set Mode
      var direction = o.options.direction || 'up'; // Default direction
      var distance = o.options.distance || 20; // Default distance
      var times = o.options.times || 5; // Default # of times
      var speed = o.duration || 250; // Default speed per bounce
      if (/show|hide/.test(mode)) props.push('opacity'); // Avoid touching opacity to prevent clearType and PNG issues in IE

      // Adjust
      $.ec.save(el, props); el.show(); // Save & Show
      $.ec.createWrapper(el); // Create Wrapper
      var ref = (direction == 'up' || direction == 'down') ? 'top' : 'left';
      var motion = (direction == 'up' || direction == 'left') ? 'pos' : 'neg';
      var distance = o.options.distance || (ref == 'top' ? el.outerHeight({margin:true}) / 3 : el.outerWidth({margin:true}) / 3);
      if (mode == 'show') el.css('opacity', 0).css(ref, motion == 'pos' ? -distance : distance); // Shift
      if (mode == 'hide') distance = distance / (times * 2);
      if (mode != 'hide') times--;
      
      // Animate
      if (mode == 'show') { // Show Bounce
        var animation = {opacity: 1};
        animation[ref] = (motion == 'pos' ? '+=' : '-=') + distance;
        el.animate(animation, speed / 2, o.options.easing);
        distance = distance / 2;
        times--;
      };
      for (var i = 0; i < times; i++) { // Bounces
        var animation1 = {}, animation2 = {};
        animation1[ref] = (motion == 'pos' ? '-=' : '+=') + distance;
        animation2[ref] = (motion == 'pos' ? '+=' : '-=') + distance;
        el.animate(animation1, speed / 2, o.options.easing).animate(animation2, speed / 2, o.options.easing);
        distance = (mode == 'hide') ? distance * 2 : distance / 2;
      };
      if (mode == 'hide') { // Last Bounce
        var animation = {opacity: 0};
        animation[ref] = (motion == 'pos' ? '-=' : '+=')  + distance;
        el.animate(animation, speed / 2, o.options.easing, function(){
          el.hide(); // Hide
          $.ec.restore(el, props); $.ec.removeWrapper(el); // Restore
          if(o.callback) o.callback.apply(this, arguments); // Callback
        });
      } else {
        var animation1 = {}, animation2 = {};
        animation1[ref] = (motion == 'pos' ? '-=' : '+=') + distance;
        animation2[ref] = (motion == 'pos' ? '+=' : '-=') + distance;
        el.animate(animation1, speed / 2, o.options.easing).animate(animation2, speed / 2, o.options.easing, function(){
          $.ec.restore(el, props); $.ec.removeWrapper(el); // Restore
          if(o.callback) o.callback.apply(this, arguments); // Callback
        });
      };
      el.queue('fx', function() { el.dequeue(); });
      el.dequeue();
    });
    
  };

})(jQuery);

(function($) {
  
  $.ec.clip = function(o) {

    return this.queue(function() {

      // Create element
      var el = $(this), props = ['position','top','left','width','height'];
      
      // Set options
      var mode = $.ec.setMode(el, o.options.mode || 'hide'); // Set Mode
      var direction = o.options.direction || 'vertical'; // Default direction
      
      // Adjust
      $.ec.save(el, props); el.show(); // Save & Show
      $.ec.createWrapper(el).css({overflow:'hidden'}); // Create Wrapper
      var ref = {
        size: (direction == 'vertical') ? 'height' : 'width',
        position: (direction == 'vertical') ? 'top' : 'left'
      };
      var distance = (direction == 'vertical') ? el.height() : el.width();
      if(mode == 'show') { el.css(ref.size, 0); el.css(ref.position, distance / 2); } // Shift
      
      // Animation
      var animation = {};
      animation[ref.size] = mode == 'show' ? distance : 0;
      animation[ref.position] = mode == 'show' ? 0 : distance / 2;
        
      // Animate
      el.animate(animation, { queue: false, duration: o.duration, easing: o.options.easing, complete: function() {
        if(mode == 'hide') el.hide(); // Hide
        $.ec.restore(el, props); $.ec.removeWrapper(el); // Restore
        if(o.callback) o.callback.apply(this, arguments); // Callback
        el.dequeue();
      }}); 
      
    });
    
  };
  
})(jQuery);

(function($) {
  
  $.ec.drop = function(o) {

    return this.queue(function() {

      // Create element
      var el = $(this), props = ['position','top','left','opacity'];
      
      // Set options
      var mode = $.ec.setMode(el, o.options.mode || 'hide'); // Set Mode
      var direction = o.options.direction || 'left'; // Default Direction
      
      // Adjust
      $.ec.save(el, props); el.show(); // Save & Show
      $.ec.createWrapper(el); // Create Wrapper
      var ref = (direction == 'up' || direction == 'down') ? 'top' : 'left';
      var motion = (direction == 'up' || direction == 'left') ? 'pos' : 'neg';
      var distance = o.options.distance || (ref == 'top' ? el.outerHeight({margin:true}) / 2 : el.outerWidth({margin:true}) / 2);
      if (mode == 'show') el.css('opacity', 0).css(ref, motion == 'pos' ? -distance : distance); // Shift
      
      // Animation
      var animation = {opacity: mode == 'show' ? 1 : 0};
      animation[ref] = (mode == 'show' ? (motion == 'pos' ? '+=' : '-=') : (motion == 'pos' ? '-=' : '+=')) + distance;
      
      // Animate
      el.animate(animation, { queue: false, duration: o.duration, easing: o.options.easing, complete: function() {
        if(mode == 'hide') el.hide(); // Hide
        $.ec.restore(el, props); $.ec.removeWrapper(el); // Restore
        if(o.callback) o.callback.apply(this, arguments); // Callback
        el.dequeue();
      }});
      
    });
    
  };
  
})(jQuery);

(function($) {
  
  $.ec.fade = function(o) {

    return this.queue(function() {
      
      // Create element
      var el = $(this), props = ['opacity'];
      
      // Set options
      var mode = $.ec.setMode(el, o.options.mode || 'effect'); // Set Mode
      if (mode == 'toggle') mode = el.is(':hidden') ? 'show' : 'hide'; // Set for toggle
      var opacity = o.options.opacity || 0; // Default fade opacity
      
      // Adjust
      $.ec.save(el, props); el.show(); // Save & Show
      if(mode == 'show') el.css({opacity: 0}); // Shift
      
      // Animation
      var animation = {opacity: mode == 'show' ? 1 : opacity};
      
      // Animate
      el.animate(animation, { queue: false, duration: o.duration, easing: o.options.easing, complete: function() {
        if(mode == 'hide') el.hide(); // Hide
        if(mode == 'hide') $.ec.restore(el, props); // Restore
        if(o.callback) o.callback.apply(this, arguments); // Callback
        el.dequeue();
      }});
      
    });
    
  };
  
})(jQuery);

(function($) {
  
  $.ec.fold = function(o) {

    return this.queue(function() {

      // Create element
      var el = $(this), props = ['position'];
      
      // Set options
      var mode = $.ec.setMode(el, o.options.mode || 'hide'); // Set Mode
      var size = o.options.size || 15; // Default fold size
      
      // Adjust
      $.ec.save(el, props); el.show(); // Save & Show
      var wrapper = $.ec.createWrapper(el).css({overflow:'hidden'}); // Create Wrapper
      var ref = (mode == 'show') ? ['width', 'height'] : ['height', 'width'];
      var distance = (mode == 'show') ? [wrapper.width(), wrapper.height()] : [wrapper.height(), wrapper.width()];
      if(mode == 'show') wrapper.css({height: size, width: 0}); // Shift
      
      // Animation
      var animation1 = {}, animation2 = {};
      animation1[ref[0]] = mode == 'show' ? distance[0] : size;
      animation2[ref[1]] = mode == 'show' ? distance[1] : 0;
      
      // Animate
      wrapper.animate(animation1, o.duration / 2, o.options.easing)
      .animate(animation2, o.duration / 2, o.options.easing, function() {
        if(mode == 'hide') el.hide(); // Hide
        $.ec.restore(el, props); $.ec.removeWrapper(el); // Restore
        if(o.callback) o.callback.apply(this, arguments); // Callback
        el.dequeue();
      });
      
    });
    
  };
  
})(jQuery);

(function($) {
  
  $.ec.highlight = function(o) {

    return this.queue(function() {
      
      // Create element
      var el = $(this), props = ['backgroundImage','backgroundColor','opacity'];
      
      // Set options
      var mode = $.ec.setMode(el, o.options.mode || 'show'); // Set Mode
      var color = o.options.color || "#ffff99"; // Default highlight color
      
      // Adjust
      $.ec.save(el, props); el.show(); // Save & Show
      el.css({backgroundImage: 'none', backgroundColor: color}); // Shift
      
      // Animation
      var animation = {backgroundColor: $.data(this, "ec.storage.backgroundColor")};
      if (mode == "hide") animation['opacity'] = 0;
      
      // Animate
      el.animate(animation, { queue: false, duration: o.duration, easing: o.options.easing, complete: function() {
        if(mode == "hide") el.hide();
        $.ec.restore(el, props);
        if(o.callback) o.callback.apply(this, arguments);
        el.dequeue();
      }});
      
    });
    
  };
  
})(jQuery);

(function($) {
  
  $.ec.pulsate = function(o) {

    return this.queue(function() {
      
      // Create element
      var el = $(this);
      
      // Set options
      var mode = $.ec.setMode(el, o.options.mode || 'show'); // Set Mode
      var times = o.options.times || 5; // Default # of times
      
      // Adjust
      if (mode != 'hide') times--;
      if (el.is(':hidden')) { // Show fadeIn
        el.css('opacity', 0);
        el.show(); // Show
        el.animate({opacity: 1}, o.duration / 2, o.options.easing);
        times--;
      }
      
      // Animate
      for (var i = 0; i < times; i++) { // Pulsate
        el.animate({opacity: 0}, o.duration / 2, o.options.easing).animate({opacity: 1}, o.duration / 2, o.options.easing);
      };
      if (mode == 'hide') { // Last Pulse
        el.animate({opacity: 0}, o.duration / 2, o.options.easing, function(){
          el.hide(); // Hide
          if(o.callback) o.callback.apply(this, arguments); // Callback
        });
      } else {
        el.animate({opacity: 0}, o.duration / 2, o.options.easing).animate({opacity: 1}, o.duration / 2, o.options.easing, function(){
          if(o.callback) o.callback.apply(this, arguments); // Callback
        });
      };
      el.queue('fx', function() { el.dequeue(); });
      el.dequeue();
    });
    
  };
  
})(jQuery);

(function($) {
  
  $.ec.puff = function(o) {
  
    return this.queue(function() {
  
      // Create element
      var el = $(this);
    
      // Set options
      var mode = $.ec.setMode(el, o.options.mode || 'hide'); // Set Mode
      var percent = parseInt(o.options.percent) || 150; // Set default puff percent
      o.options.fade = true; // It's not a puff if it doesn't fade! :)
      var original = {height: el.height(), width: el.width()}; // Save original
    
      // Adjust
      var factor = percent / 100;
      el.from = (mode == 'hide') ? original : {height: original.height * factor, width: original.width * factor};
    
      // Animation
      o.options.from = el.from;
      o.options.percent = (mode == 'hide') ? percent : 100;
      o.options.mode = mode;
    
      // Animate
      el.effect('scale', o.options, o.duration, o.callback);
      el.dequeue();
    });
    
  };

  $.ec.scale = function(o) {
    
    return this.queue(function() {
    
      // Create element
      var el = $(this);

      // Set options
      var mode = $.ec.setMode(el, o.options.mode || 'effect'); // Set Mode
      var percent = parseInt(o.options.percent) || (parseInt(o.options.percent) == 0 ? 0 : (mode == 'hide' ? 0 : 100)); // Set default scaling percent
      var direction = o.options.direction || 'both'; // Set default axis
      var origin = o.options.origin; // The origin of the scaling
      if (mode != 'effect') { // Set default origin and restore for show/hide
        origin = origin || ['middle','center'];
        o.options.restore = true;
      }
      var original = {height: el.height(), width: el.width()}; // Save original
      el.from = o.options.from || (mode == 'show' ? {height: 0, width: 0} : original); // Default from state
    
      // Adjust
      var factor = { // Set scaling factor
        y: direction != 'horizontal' ? (percent / 100) : 1,
        x: direction != 'vertical' ? (percent / 100) : 1
      };
      el.to = {height: original.height * factor.y, width: original.width * factor.x}; // Set to state
      if (origin) { // Calculate baseline shifts
        var baseline = $.ec.getBaseline(origin, original);
        el.from.top = (original.height - el.from.height) * baseline.y;
        el.from.left = (original.width - el.from.width) * baseline.x;
        el.to.top = (original.height - el.to.height) * baseline.y;
        el.to.left = (original.width - el.to.width) * baseline.x;
      };
      if (o.options.fade) { // Fade option to support puff
        if (mode == 'show') {el.from.opacity = 0; el.to.opacity = 1;};
        if (mode == 'hide') {el.from.opacity = 1; el.to.opacity = 0;};
      };
    
      // Animation
      o.options.from = el.from; o.options.to = el.to;
    
      // Animate
      el.effect('size', o.options, o.duration, o.callback);
      el.dequeue();
    });
    
  };
  
  $.ec.size = function(o) {

    return this.queue(function() {
      
      // Create element
      var el = $(this), props = ['position','top','left','width','height','overflow','opacity'];
      var props1 = ['position','overflow','opacity']; // Always restore
      var props2 = ['width','height','overflow']; // Copy for children
      var cProps = ['fontSize'];
      var vProps = ['borderTopWidth', 'borderBottomWidth', 'paddingTop', 'paddingBottom'];
      var hProps = ['borderLeftWidth', 'borderRightWidth', 'paddingLeft', 'paddingRight'];
      
      // Set options
      var mode = $.ec.setMode(el, o.options.mode || 'effect'); // Set Mode
      var restore = o.options.restore || false; // Default restore
      var scale = o.options.scale || 'both'; // Default scale mode
      var original = {height: el.height(), width: el.width()}; // Save original
      el.from = o.options.from || original; // Default from state
      el.to = o.options.to || original; // Default to state
      
      // Adjust
      var factor = { // Set scaling factor
        from: {y: el.from.height / original.height, x: el.from.width / original.width},
        to: {y: el.to.height / original.height, x: el.to.width / original.width}
      };
      if (scale == 'box' || scale == 'both') { // Scale the css box
        if (factor.from.y != factor.to.y) { // Vertical props scaling
          props = props.concat(vProps);
          el.from = $.ec.setTransition(el, vProps, factor.from.y, el.from);
          el.to = $.ec.setTransition(el, vProps, factor.to.y, el.to);
        };
        if (factor.from.x != factor.to.x) { // Horizontal props scaling
          props = props.concat(hProps);
          el.from = $.ec.setTransition(el, hProps, factor.from.x, el.from);
          el.to = $.ec.setTransition(el, hProps, factor.to.x, el.to);
        };
      };
      if (scale == 'content' || scale == 'both') { // Scale the content
        if (factor.from.y != factor.to.y) { // Vertical props scaling
          props = props.concat(cProps);
          el.from = $.ec.setTransition(el, cProps, factor.from.y, el.from);
          el.to = $.ec.setTransition(el, cProps, factor.to.y, el.to);
        };
      };
      $.ec.save(el, restore ? props : props1); el.show(); // Save & Show
      $.ec.createWrapper(el); // Create Wrapper
      el.css('overflow','hidden').css(el.from); // Shift
      
      // Animate
      if (scale == 'content' || scale == 'both') { // Scale the children
        vProps = vProps.concat(['marginTop','marginBottom']).concat(cProps); // Add margins/font-size
        hProps = hProps.concat(['marginLeft','marginRight']); // Add margins
        props2 = props.concat(vProps).concat(hProps); // Concat
        el.find("*[width]").each(function(){
          child = $(this);
          if (restore) $.ec.save(child, props2);
          var c_original = {height: child.height(), width: child.width()}; // Save original
          child.from = {height: c_original.height * factor.from.y, width: c_original.width * factor.from.x};
          child.to = {height: c_original.height * factor.to.y, width: c_original.width * factor.to.x};
          if (factor.from.y != factor.to.y) { // Vertical props scaling
            child.from = $.ec.setTransition(child, vProps, factor.from.y, child.from);
            child.to = $.ec.setTransition(child, vProps, factor.to.y, child.to);
          };
          if (factor.from.x != factor.to.x) { // Horizontal props scaling
            child.from = $.ec.setTransition(child, hProps, factor.from.x, child.from);
            child.to = $.ec.setTransition(child, hProps, factor.to.x, child.to);
          };
          child.css(child.from); // Shift children
          child.animate(child.to, o.duration, o.options.easing, function(){
            if (restore) $.ec.restore(child, props2); // Restore children
          }); // Animate children
        });
      };
      
      // Animate
      el.animate(el.to, { queue: false, duration: o.duration, easing: o.options.easing, complete: function() {
        if(mode == 'hide') el.hide(); // Hide
        $.ec.restore(el, restore ? props : props1); $.ec.removeWrapper(el); // Restore
        if(o.callback) o.callback.apply(this, arguments); // Callback
        el.dequeue();
      }}); 
      
    });

  };
  
})(jQuery);

(function($) {
  
  $.ec.shake = function(o) {

    return this.queue(function() {

      // Create element
      var el = $(this), props = ['position','top','left'];
      
      // Set options
      var mode = $.ec.setMode(el, o.options.mode || 'effect'); // Set Mode
      var direction = o.options.direction || 'left'; // Default direction
      var distance = o.options.distance || 20; // Default distance
      var times = o.options.times || 3; // Default # of times
      var speed = o.duration || o.options.duration || 140; // Default speed per shake
      
      // Adjust
      $.ec.save(el, props); el.show(); // Save & Show
      $.ec.createWrapper(el); // Create Wrapper
      var ref = (direction == 'up' || direction == 'down') ? 'top' : 'left';
      var motion = (direction == 'up' || direction == 'left') ? 'pos' : 'neg';
      
      // Animation
      var animation = {}, animation1 = {}, animation2 = {};
      animation[ref] = (motion == 'pos' ? '-=' : '+=')  + distance;
      animation1[ref] = (motion == 'pos' ? '+=' : '-=')  + distance * 2;
      animation2[ref] = (motion == 'pos' ? '-=' : '+=')  + distance * 2;
      
      // Animate
      el.animate(animation, speed, o.options.easing);
      for (var i = 1; i < times; i++) { // Shakes
        el.animate(animation1, speed, o.options.easing).animate(animation2, speed, o.options.easing);
      };
      el.animate(animation1, speed, o.options.easing).
      animate(animation, speed / 2, o.options.easing, function(){ // Last shake
        $.ec.restore(el, props); $.ec.removeWrapper(el); // Restore
        if(o.callback) o.callback.apply(this, arguments); // Callback
      });
      el.queue('fx', function() { el.dequeue(); });
      el.dequeue();
    });
    
  };
  
})(jQuery);

(function($) {
  
  $.ec.slide = function(o) {

    return this.queue(function() {

      // Create element
      var el = $(this), props = ['position','top','left'];
      
      // Set options
      var mode = $.ec.setMode(el, o.options.mode || 'show'); // Set Mode
      var direction = o.options.direction || 'left'; // Default Direction
      
      // Adjust
      $.ec.save(el, props); el.show(); // Save & Show
      $.ec.createWrapper(el).css({overflow:'hidden'}); // Create Wrapper
      var ref = (direction == 'up' || direction == 'down') ? 'top' : 'left';
      var motion = (direction == 'up' || direction == 'left') ? 'pos' : 'neg';
      var distance = o.options.distance || (ref == 'top' ? el.outerHeight({margin:true}) : el.outerWidth({margin:true}));
      if (mode == 'show') el.css(ref, motion == 'pos' ? -distance : distance); // Shift
      
      // Animation
      var animation = {};
      animation[ref] = (mode == 'show' ? (motion == 'pos' ? '+=' : '-=') : (motion == 'pos' ? '-=' : '+=')) + distance;
      
      // Animate
      el.animate(animation, { queue: false, duration: o.duration, easing: o.options.easing, complete: function() {
        if(mode == 'hide') el.hide(); // Hide
        $.ec.restore(el, props); $.ec.removeWrapper(el); // Restore
        if(o.callback) o.callback.apply(this, arguments); // Callback
        el.dequeue();
      }});
      
    });
    
  };
  
})(jQuery);

(function($) {
  
  $.ec.transfer = function(o) {

    return this.queue(function() {

      // Create element
      var el = $(this);
      
      // Set options
      var mode = $.ec.setMode(el, o.options.mode || 'effect'); // Set Mode
      var target = $(document.getElementById(o.options.to)); // Find Target
      var position = el.position();
      $('body', document).append('<div id="fxTransfer"></div>');
      var transfer = $('#fxTransfer');
      
      // Set target css
      transfer.addClass(o.options.className);
      transfer.css({
        top: position['top'],
        left: position['left'],
        height: el.outerHeight({margin:true}) - parseInt(transfer.css('borderTopWidth')) - parseInt(transfer.css('borderBottomWidth')),
        width: el.outerWidth({margin:true}) - parseInt(transfer.css('borderLeftWidth')) - parseInt(transfer.css('borderRightWidth')),
        position: 'absolute'
      });
      
      // Animation
      position = target.position();
      animation = {
        top: position['top'],
        left: position['left'],
        height: target.outerHeight() - parseInt(transfer.css('borderTopWidth')) - parseInt(transfer.css('borderBottomWidth')),
        width: target.outerWidth() - parseInt(transfer.css('borderLeftWidth')) - parseInt(transfer.css('borderRightWidth'))
      };
      
      // Animate
      transfer.animate(animation, o.duration, o.options.easing, function() {
        transfer.remove(); // Remove div
        if(o.callback) o.callback.apply(this, arguments); // Callback
        el.dequeue();
      }); 
      
    });
    
  };
  
})(jQuery);
