 /*
 *
 * jRails form observer plugin
 * version 0.1
 * <aaron@ennerchi.com> | http://www.ennerchi.com
 * 
 */

(function($) {
  $.fn.extend({
    formElementObserver: function(frequency, callback){
      var field = $(this), lastValue = field.formVal();
      setInterval(function(){
        value = field.formVal();
        if (lastValue != value) callback.apply(this, [field[0], value]);
        lastValue = value;
      }, frequency * 1000);
    },
    formElementEventObserver: function(callback){
      var field = $(this), lastValue = field.formVal();
      event = (field.type == 'radio' || field.type == 'checkbox') ? 'click' : 'change';
      field.bind(event, function(){
        value = field.formVal();
        if (lastValue != value) callback.apply(this, [field[0], value]);
        lastValue = value;
      });
    },
    formObserver: function(frequency, callback){
      var form = $(this), lastValue = form.serialize();
      setInterval(function(){
        value = form.serialize();
        if (lastValue != value) callback.apply(this, [form[0], form.serialize()]);
        lastValue = value;
      }, frequency * 1000);
    },
    formEventObserver: function(callback){
      var form = $(this);
      $(form.elements).each(function(){
        field = $(this);
        field.attr('lastValue', field.formVal());
        event = (field.type == 'radio' || field.type == 'checkbox') ? 'click' : 'change';
        field.bind(event, function(){
          field = $(this);
          value = field.formVal();
          if (field.attr('lastValue') != value) callback.apply(this, [form[0], form.serialize()]);
          field.attr('lastValue', value);
        });
      });
    }
  });
})(jQuery);

//gets the value of the first matched form field, or sets
//the value of all the matched form fields
(function($) {
  $.fn.extend({
    formVal: function(newVal) {
    var self = this.get(0);
    var optVal = function(opt) {
        if(opt.value) return opt.value; // non-empty string, use it
        if(!opt.outerHTML) return ''; // not IE, we should trust value
        return /\svalue=""(?:\s|>)/.test(opt.outerHTML) ? '' : opt.text;
    };
    if(newVal == null) {
        if(this.size() < 1) return '';
        if(self.type == 'text') return self.value;
        if(self.tagName == 'TEXTAREA') return this.text();
        if(self.type == 'checkbox' || self.type == 'radio')
          return this.filter('input:checked').val() || '';
        if(self.tagName == 'OPTION') return this.parent().formVal();
        if(self.tagName == 'SELECT' && self.selectedIndex >= 0)
          return optVal(self.options[self.selectedIndex]);
        return '';
    }
    if(self.type == 'text') this.val(newVal);
    else if(self.tagName == 'TEXTAREA') this.text(newVal);
    else if(self.type == 'checkbox' || self.type == 'radio') {
        this.filter(':checked').removeAttr('checked');
        this.filter('[@value=' + newVal + ']').attr('checked', 'checked');
    }
    else if(self.tagName == 'OPTION') this.parent().formVal(newVal);
    else if(self.tagName == 'SELECT') {
        for (var i=0, l=self.options.length; i<l; ++i) {
            if(newVal == optVal(self.options[i])) {
                self.selectedIndex = i;
                break;
            }
        }
    }
    return this;
}
  });
})(jQuery);

 /*
 *
 * jRails visual effects stubs
 * version 0.1
 * <aaron@ennerchi.com> | http://www.ennerchi.com
 * 
 */

(function($) {
  $.fn.extend({
    Appear : function(speed, callback) {
      return this.fadeIn(speed, callback);
    },
    BlindDown : function(speed, callback) {
      this.show({ method: 'blind', direction: 'vertical' }, speed, callback);
      return this;
    },
    BlindUp : function(speed, callback) {
      this.hide({ method: 'blind', direction: 'vertical' }, speed, callback); 
      return this;
    },
    BlindRight : function(speed, callback) {
      this.show({ method: 'blind', direction: 'horizontal' }, speed, callback); 
      return this;
    },
    BlindLeft : function(speed, callback) {
      this.hide({ method: 'blind', direction: 'horizontal' }, speed, callback); 
      return this;
    },
    DropOut : function(speed, callback) {
      this.hide({ method: 'drop', direction: 'down' }, speed, callback); 
      return this;
    },
    DropIn : function(speed, callback) {
      this.show({ method: 'drop', direction: 'down' }, speed, callback); 
      return this;
    },
    Fade : function(speed, callback) {
      return this.fadeOut(speed, callback);
    },
    Grow : function(speed, callback) {
      this.show({ method: 'scale' }, speed, callback); 
      return this;
    },
    Highlight : function(speed, callback) {
      this.show({ method: 'highlight' }, speed, callback); 
      return this;
    },
    Puff : function(speed, callback) {
      this.hide({ method: 'scale', mode: 'puff' }, speed, callback); 
      return this;
    },
    Pulsate : function(speed, callback) {
      this.show({ method: 'pulsate' }, speed, callback); 
      return this;
    },
    Shake : function(speed, callback) {
      this.show({ method: 'shake' }, speed, callback); 
      return this;
    },
    Shrink : function(speed, callback) {
      this.hide({ method: 'scale' }, speed, callback); 
      return this;
    },
    Squish : function(speed, callback) {
      this.hide({ method: 'scale', mode: 'squish' }, speed, callback); 
      return this;
    },
    SlideUp : function(speed, callback) {
      this.hide({ method: 'slide', direction: 'up'}, speed, callback); 
      return this;
    },
    SlideDown : function(speed, callback) {
      this.show({ method: 'slide', direction: 'down'}, speed, callback); 
      return this;
    }
  });
})(jQuery);

 /*
 * [ 0.2 ] Original by Jonathan Howard
 * [ 0.3 ] Updated for current jQuery releases,
 *         and formatted for jQuery namespace by Charles Phillips
 *         <charles@doublerebel.com> | http://www.doublerebel.com/scripts/jquery.pause.js
 *
 * jQuery Pause
 * version 0.3
 *
 */
 
(function($) {
  $.fn.extend({
    pause: function(milli,type) {
      milli = milli || 1000;
      type = type || "fx";
      return this.queue(type,function(){
        var self = this;
        setTimeout(function(){
          $(self).dequeue();
        },milli);
      });
    },
    clearQueue: function(type) {
      return this.each(function(){
        type = type || "fx";
        if(this.queue && this.queue[type]) {
          this.queue[type].length = 0;
        }
      });
    },
    unpause: $.fn.clearQueue
  });
})(jQuery);