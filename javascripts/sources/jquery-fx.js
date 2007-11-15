(function($) {

  $.fx = $.fx || {}; //Add the 'fx' scope

  /*
   * Public methods (jQuery FX scope)
   */

  $.extend($.fx, {
    relativize: function(el) {
      if(!el.css("position") || !el.css("position").match(/fixed|absolute|relative/)) el.css("position", "relative"); //Relativize
    },
    save: function(el, set) {
      for(var i=0;i<set.length;i++) {
        if(set[i] !== null) $.data(el[0], "fx.storage."+set[i], el.css(set[i]));  
      }
    },
    restore: function(el, set, ret) {
      if(ret) var obj = {};
      for(var i=0;i<set.length;i++) {
        if(ret) obj[set[i]] = $.data(el[0], "fx.storage."+set[i]);
        if(set[i] !== null && !ret) el.css(set[i], $.data(el[0], "fx.storage."+set[i]));  
      }
      if(ret) return obj;
    },
    findSides: function(el) { //Very nifty function (especially for IE!)
      return [ !!parseInt(el.css("left")) ? "left" : "right", !!parseInt(el.css("top")) ? "top" : "bottom" ];
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
            && (n.match(/color/i) || (!n.match(/color/i) && !isNaN(parseInt(newStyle[n])))) /* Only things that can be parsed to integers or colors */
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
    effect: function(fx,o) { if($.fx[fx]) this.each(function() { $.fx[fx].apply(this, [o]); }); }, //This just forwards single used effects
    _show: $.fn.show,
    _hide: $.fn.hide,
    _addClass: $.fn.addClass,
    _removeClass: $.fn.removeClass,
    _toggleClass: $.fn.toggleClass,
    show: function(obj,speed,callback){
      return typeof obj == 'string' || typeof obj == 'undefined' ? this._show(obj, speed) : $.fx[obj.method].apply(this, ['show',obj,speed,callback]);
    },
    
    hide: function(obj,speed,callback){
      return typeof obj == 'string' || typeof obj == 'undefined' ? this._hide(obj, speed) : $.fx[obj.method].apply(this, ['hide',obj,speed,callback]);
    },
    addClass: function(classNames,speed,easing,callback) {
      return speed ? $.fx.animateClass.apply(this, [{ add: classNames },speed,easing,callback]) : this._addClass(classNames);
    },
    removeClass: function(classNames,speed,easing,callback) {
      return speed ? $.fx.animateClass.apply(this, [{ remove: classNames },speed,easing,callback]) : this._removeClass(classNames);
    },
    toggleClass: function(classNames,speed,easing,callback) {
      return speed ? $.fx.animateClass.apply(this, [{ toggle: classNames },speed,easing,callback]) : this._toggleClass(classNames);
    },
    morph: function(remove,add,speed,easing,callback) {
      return $.fx.animateClass.apply(this, [{ add: add, remove: remove },speed,easing,callback]);
    },
    switchClass: function() { this.morph.apply(this, arguments); }
  });
  
})(jQuery);

(function($) {
  
  $.fx.blind = function(type, set, speed, callback) {

    this.each(function() {

      var cur = $(this).show(); $.fx.relativize(cur);
      var modifier = set.direction != "vertical" ? "width" : "height"; //Use the right modifier (width/height)
      $.fx.save(cur, ["overflow", modifier]); //Save values that need to be restored after animation
      
      var ani = {}; ani[modifier] = (type == "show" ? $.data(this, "fx.storage."+modifier) : 0); //This will be our animation
      
      if(type == "show") cur.css(modifier, 0);
      cur.animate(ani, speed, set.easing, function() {
        if(type != "show") cur.hide(); //if we want to hide the element, set display to none after the animation
        $.fx.restore(cur, ["overflow", (type == "show" ? null : modifier)]); //Then restore changed values
        if(callback) callback.apply(this, arguments); //And optionally apply the callback
      });   
  
    });
    
  }
  
})(jQuery);

(function($) {

  //Store some stuff for easy reference later on
  var restoreThis = [
    "width", "height", "fontSize", "left", "top",
    "borderLeftWidth", "borderRightWidth", "borderTopWidth", "borderBottomWidth",
    "paddingLeft", "paddingRight", "paddingTop", "paddingBottom",
    "marginTop", "marginLeft", "marginBottom", "marginRight"
  ];
  
  $.fx.scale = function(type, set, speed, callback) {

    this.each(function() {
      
      if(!set.mode) set.mode = "default"; //Default mode
      var el = $(this);
      if(set.mode != "squish") $.fx.relativize(el);
      $.fx.save(el, restoreThis.concat(["overflow"])); //Save values to restore them later again

      if(type == "show") {

        //Grow the children
        $('*', el).each(function() {
          var cur = $(this); if(cur.css("width") == "auto" || cur.css("height") == "auto") return; //Don't continue if 'auto' sized element
          $.fx.save(cur, ["width", "height", "overflow"]);  //Store data
          $(this).css({ overflow: 'hidden', width: 0, height: 0 }).animate($.fx.restore(cur, ["width", "height"], true), speed, set.easing, function() { $.fx.restore($(this), ["overflow"]); });
        });
  
        //Grow the parent
        el.css({
          fontSize: 0, width: 0, height: 0, left: (parseInt(el.css("left")) || 0)+(el.width() / 2), top: (parseInt(el.css("top")) || 0)+(el.height() / 2),
          borderLeftWidth: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomWidth: 0,
          paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0,
          marginTop: 0, marginLeft: 0, marginBottom: 0, marginRight: 0
        });
        
        el.css("overflow", "hidden").animate($.fx.restore(el, restoreThis, true), speed, set.easing, function() {
          $.fx.restore(el, ["overflow"]);
          if(callback) callback.apply(this, arguments);
        });

      } else {
         
        if(set.mode == 'puff') {
        
        //Puff the children
        $('*', el).each(function() {
          var cur = $(this); if(cur.css("width") == "auto" || cur.css("height") == "auto") return; //Don't continue if 'auto' sized element
          $.fx.save(cur, ["width", "height", "overflow"]);  //Store data
          $(this).css({ overflow: 'hidden', width: el.width() * 2, height: el.height() * 2 }).animate($.fx.restore(cur, ["width", "height"], true), speed, set.easing, function() { $.fx.restore($(this), ["overflow"]); });
        });
        
        //Puff the parent
        el.css("overflow", "hidden").animate({
          fontSize: '200%', width: el.width() * 2, height: el.height() * 2, opacity: 'hide', top: -(el.height()/2), left: -(el.height()/2)
        }, speed, set.easing, function() {
          el.hide(); $.fx.restore(el, restoreThis.concat(["overflow"])); //Hide and restore properties
          if(callback) callback.apply(this, arguments);
        });
        
        } else {
        //Shrink the children 
        $('*', el).each(function() {
          var cur = $(this); if(cur.css("width") == "auto" || cur.css("height") == "auto") return; //Don't continue if 'auto' sized element
          $.fx.save(cur, ["width", "height", "overflow"]);        
          $(this).css("overflow", "hidden").animate({ width: 0, height: 0 }, speed, set.easing, function() { $.fx.restore($(this), ["width", "height", "overflow"]); });
        });

        //Shrink the parent
        el.css("overflow", "hidden").animate({
          fontSize: 0, width: 0, height: 0, left: '+='+(el.width() / 2), top: '+='+(el.height() / 2),
          borderLeftWidth: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomWidth: 0,
          paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0,
          marginTop: 0, marginLeft: 0, marginBottom: 0, marginRight: 0
        }, speed, set.easing, function() {
          el.hide(); $.fx.restore(el, restoreThis.concat(["overflow"])); //Hide and restore properties
          if(callback) callback.apply(this, arguments);
        });
        }
      }

    });

  }

})(jQuery);

(function($) {
  
  $.fx.drop = function(type, set, speed, callback) {

    this.each(function() {

      if(!set.direction) set.direction = "left"; //Default direction
      var cur = $(this);
      
      $.fx.relativize(cur);
      $.fx.save(cur, ["left","top","opacity"]);
      var ref = (set.direction == "up" || set.direction == "down") ? "top" : "left";
      var motion = (set.direction == "up" || set.direction == "right") ? "pos" : "neg";
      var distance = 100;
      
      if(type == "show") {
        cur.css('opacity', 0).css(ref, parseInt(cur.css(ref)) + (motion == "pos" ? distance : -distance));
        animation = {opacity: 1};
        animation[ref] = (motion == "pos" ? '-=' : '+=') + distance;
        cur.animate(animation, speed, set.easing, function() { //Animate
          $.fx.restore(cur, ["left","top","opacity"]);
          if(callback) callback.apply(this, arguments);
        }); 
      } else { 
        animation = {opacity: 0};
        animation[ref] = (motion == "pos" ? '-=' : '+=') + distance;
        cur.animate(animation, speed, set.easing, function() { //Animate
          cur.hide();
          $.fx.restore(cur, ["left","top","opacity"]);
          if(callback) callback.apply(this, arguments);
        }); 
      }
      
    });
    
  }
  
})(jQuery);

(function($) {
  
  $.fx.slide = function(type, set, speed, callback) {

    this.each(function() {

      if(!set.direction) set.direction = "left"; //Default direction
      var cur = $(this);
      $.fx.relativize(cur);
      
      // create a wrapper
      cur.wrap('<div id="fxWrapper"></div>');
      var wrapper = cur.parent();
      wrapper.css({position: 'absolute', overflow: 'hidden'});
      
      $.fx.save(cur, ["left","top","opacity"]);
      var ref = (set.direction == "up" || set.direction == "down") ? "top" : "left";
      var motion = (set.direction == "up" || set.direction == "right") ? "pos" : "neg";
      var distance = set.ref == "top" ? wrapper.height() : wrapper.width();
      
      if(type == "show") {
        cur.css(ref, parseInt(cur.css(ref)) + (motion == "pos" ? distance : -distance));
        animation = {};
        animation[ref] = (motion == "pos" ? '-=' : '+=') + distance;
        cur.animate(animation, speed, set.easing, function() { //Animate
          $.fx.restore(cur, ["left","top","opacity"]);
          wrapper.replaceWith(cur);
          if(callback) callback.apply(this, arguments);
        }); 
      } else { 
        animation = {};
        animation[ref] = (motion == "pos" ? '-=' : '+=') + distance;
        cur.animate(animation, speed, set.easing, function() { //Animate
          cur.hide();
          $.fx.restore(cur, ["left","top","opacity"]);
          wrapper.replaceWith(cur);
          if(callback) callback.apply(this, arguments);
        }); 
      }
      
    });
    
  }
  
})(jQuery);


(function($) {
  
  $.fx.shake = function(type, set, speed, callback) {

    this.each(function() {
      
      if(!set.times) set.times = 2;
      //if(!set.speed) set.speed = (speed || 1000) / (set.times * 3)
      if(!set.distance) set.distance = 15;
      var cur = $(this), i=0; $.fx.relativize(cur);
        
      cur.animate({left: -set.distance}, 60);
      while (i < set.times) {
        cur.animate({left: set.distance}, 60).animate({left: -set.distance}, 120);
        i++;
      } 
      cur.animate({left: 0}, 60, function() { //Animate
        if(callback) callback.apply(this, arguments);
      });   
  
    });
    
  }
  
})(jQuery);

(function($) {
  
  $.fx.pulsate = function(type, set, speed, callback) {

    this.each(function() {
      
      if(!set.times) set.times = 5;
      if(!set.speed) set.speed = (speed || 3000) / (set.times * 2);
      var cur = $(this), i=0;
      
      while (i < set.times) {
        cur.fadeOut(set.speed).fadeIn(set.speed);
        i++;
      } 
  
    });
    
  }
  
})(jQuery);

(function($) {
  
  $.fx.highlight = function(type, set, speed, callback) {

    this.each(function() {
      
      if(!set.color) set.color = '#ffff99'; //Default color
      var cur = $(this);
      var bg = cur.css('backgroundImage');
      var background = cur.css('backgroundColor');
      cur.css('backgroundColor', set.color);
      cur.css('backgroundImage', 'none');
      cur.animate({backgroundColor: background}, speed, set.easing, function() { //Animate
        cur.css('backgroundImage', bg);
        if(callback) callback.apply(this, arguments);
      });
    });
    
  }
  
})(jQuery);

/*
 * jQuery Color Animations
 * Copyright 2007 John Resig
 * Released under the MIT and GPL licenses.
 */

(function(jQuery){

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
    yellow:[255,255,0]
  };
  
})(jQuery);