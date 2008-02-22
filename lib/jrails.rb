module ActionView
  module Helpers
    module PrototypeHelper
      
      def periodically_call_remote(options = {})
        frequency = options[:frequency] || 10 # every ten seconds by default
        code = "setInterval(function() {#{remote_function(options)}}, #{frequency} * 1000)"
        javascript_tag(code)
      end
      
      def remote_function(options)
        javascript_options = options_for_ajax(options)

        update = ''
        if options[:update] && options[:update].is_a?(Hash)
          update  = []
          update << "success:'#{options[:update][:success]}'" if options[:update][:success]
          update << "failure:'#{options[:update][:failure]}'" if options[:update][:failure]
          update  = '{' + update.join(',') + '}'
        elsif options[:update]
          update << "'#{options[:update]}'"
        end

        function = "$.ajax(#{javascript_options})"

        function = "#{options[:before]}; #{function}" if options[:before]
        function = "#{function}; #{options[:after]}"  if options[:after]
        function = "if (#{options[:condition]}) { #{function}; }" if options[:condition]
        function = "if (confirm('#{escape_javascript(options[:confirm])}')) { #{function}; }" if options[:confirm]
        return function
      end
      
      class JavaScriptGenerator
        module GeneratorMethods
          
          def insert_html(position, id, *options_for_render)
            insertion = position.to_s.downcase
            insertion = 'append' if insertion == 'bottom'
            insertion = 'prepend' if insertion == 'top'
            call "$(\"##{id}\").#{insertion}", render(*options_for_render)
          end
          
          def replace_html(id, *options_for_render)
            insert_html(:html, id, *options_for_render)
          end
          
          def replace(id, *options_for_render)
            call "$(\"##{id}\").replaceWith", render(*options_for_render)
          end
          
          def remove(*ids)
            call "$(\"##{ids.join(',#')}\").remove"
          end
          
          def show(*ids)
            call "$(\"##{ids.join(',#')}\").show"
          end
          
          def hide(*ids)
            call "$(\"##{ids.join(',#')}\").hide"
          end

          def toggle(*ids)
            call "$(\"##{ids.join(',#')}\").toggle"
          end
          
        end
      end
      
    protected
      def options_for_ajax(options)
        js_options = build_callbacks(options)
        
        url_options = options[:url]
        url_options = url_options.merge(:escape => false) if url_options.is_a?(Hash)
        js_options['url'] = "'#{url_for(url_options)}'"
        js_options['beforeSend'] = "function(xhr) {xhr.setRequestHeader('Accept', 'text/javascript')}"
        js_options['async'] = options[:type] != :synchronous
        js_options['type'] = method_option_to_s(options[:method]) if options[:method]
        js_options['dataType'] = options[:script].nil? ? "'script'" : (options[:script] == false ? "'html'" : "'script'") 
        
        if options[:form]
          js_options['data'] = "$.param($(this).serializeArray())"
        elsif options[:submit]
          js_options['data'] = "$(\"##{options[:submit]}\").serializeArray()"
        elsif options[:with]
          js_options['data'] = options[:with].gsub('Form.serialize(this.form)','$.param($(this.form).serializeArray())')
        end
        
        if respond_to?('protect_against_forgery?') && protect_against_forgery?
          if js_options['data']
            js_options['data'] << " + '&"
          else
            js_options['data'] = "'"
          end
          js_options['data'] << "#{request_forgery_protection_token}=' + encodeURIComponent('#{escape_javascript form_authenticity_token}')"
        end
      
        options_for_javascript(js_options)
      end
      
      def build_update(options)
        insertion = 'html'
        insertion = options[:position].to_s.downcase if options[:position]
        insertion = 'append' if insertion == 'bottom'
        insertion = 'prepend' if insertion == 'top'
        "$(\"##{options[:update]}\").#{insertion}(request.responseText);"
      end
      
      def build_observer(klass, name, options = {})
        if options[:with] && (options[:with] !~ /[\{=(.]/)
          options[:with] = "'#{options[:with]}=' + value"
        else
          options[:with] ||= 'value' unless options[:function]
        end

        callback = options[:function] || remote_function(options)
        javascript  = "$(\"##{name}\").delayedObserver("
        javascript << "#{options[:frequency] || 0}, "
        javascript << "function(element, value) {"
        javascript << "#{callback}}"
        #javascript << ", '#{options[:on]}'" if options[:on]
        javascript << ")"
        javascript_tag(javascript)
      end
      
      def build_callbacks(options)
        callbacks = {}
        if options[:update]
          options[:complete] = build_update(options) << (options[:complete] ? options[:complete] : '')
        end
        options.each do |callback, code|
          if CALLBACKS.include?(callback)
            callbacks[callback] = "function(request){#{code}}"
          end
        end
        callbacks
      end
      
    end
    
    class JavaScriptElementProxy < JavaScriptProxy #:nodoc:
      def initialize(generator, id)
        @id = id
        super(generator, "$(\"##{id}\")")
      end
      
      def replace_html(*options_for_render)
        call 'html', @generator.send(:render, *options_for_render)
      end

      def replace(*options_for_render)
        call 'replaceWith', @generator.send(:render, *options_for_render)
      end
    end
    
    class JavaScriptElementCollectionProxy < JavaScriptCollectionProxy #:nodoc:\
      def initialize(generator, pattern)
        super(generator, "$(#{pattern.to_json})")
      end
    end
    
    module ScriptaculousHelper
      
      unless const_defined? :TOGGLE_EFFECTS
        TOGGLE_EFFECTS = [:toggle_appear, :toggle_slide, :toggle_blind]
      end
      
      unless const_defined? :SCRIPTACULOUS_EFFECTS
        SCRIPTACULOUS_EFFECTS = {
          :appear => {:method => 'fade', :options => {:mode => 'show'}},
          :blind_down => {:method => 'blind', :options => {:direction => 'vertical', :mode => 'show'}},
          :blind_up => {:method => 'blind', :options => {:direction => 'vertical', :mode => 'hide'}},
          :blind_right => {:method => 'blind', :options => {:direction => 'horizontal', :mode => 'show'}},
          :blind_left => {:method => 'blind', :options => {:direction => 'horizontal', :mode => 'hide'}},
          :bounce_in => {:method => 'bounce', :options => {:direction => 'up', :mode => 'show'}},
          :bounce_out => {:method => 'bounce', :options => {:direction => 'up', :mode => 'hide'}},
          :drop_in => {:method => 'drop', :options => {:direction => 'up', :mode => 'show'}},
          :drop_out => {:method => 'drop', :options => {:direction => 'down', :mode => 'hide'}},
          :fold_in => {:method => 'fold', :options => {:mode => 'hide'}},
          :fold_out => {:method => 'fold', :options => {:mode => 'show'}},
          :grow => {:method => 'scale', :options => {:mode => 'show'}},
          :shrink => {:method => 'scale', :options => {:mode => 'hide'}},
          :slide_down => {:method => 'slide', :options => {:direction => 'up', :mode => 'show'}},
          :slide_up => {:method => 'slide', :options => {:direction => 'up', :mode => 'hide'}},
          :slide_right => {:method => 'slide', :options => {:direction => 'left', :mode => 'show'}},
          :slide_left => {:method => 'slide', :options => {:direction => 'left', :mode => 'hide'}},
          :squish => {:method => 'scale', :options => {:origin => '["top","left"]', :mode => 'hide'}},
          :switch_on => {:method => 'clip', :options => {:direction => 'vertical', :mode => 'show'}},
          :switch_off => {:method => 'clip', :options => {:direction => 'vertical', :mode => 'hide'}}
        }
      end
      
      def visual_effect(name, element_id = false, js_options = {})
        element = element_id ? element_id : "this"
        
        if SCRIPTACULOUS_EFFECTS.has_key? name.to_sym
          effect = SCRIPTACULOUS_EFFECTS[name.to_sym]
          name = effect[:method]
          js_options = js_options.merge effect[:options]
        end
        
        [:color, :direction, :mode].each do |option|
          js_options[option] = "\"#{js_options[option]}\"" if js_options[option]
        end
        
        if js_options.has_key? :duration
          speed = js_options.delete :duration
          speed = (speed * 1000).to_i unless speed.nil?
        else
          speed = js_options.delete :speed
        end
        
        #if TOGGLE_EFFECTS.include? name.to_sym
        #  "Effect.toggle(#{element},'#{name.to_s.gsub(/^toggle_/,'')}',#{options_for_javascript(js_options)});"
        
        javascript = "$(\"##{element_id}\").effect(\"#{name.to_s.downcase}\""
        javascript << ",#{options_for_javascript(js_options)}" unless speed.nil? && js_options.empty?
        javascript << ",#{speed}" unless speed.nil?
        javascript << ")"
        
      end
      
      def sortable_element_js(element_id, options = {})
        #options[:with]     ||= "Sortable.serialize(#{element_id.to_json})"
        #options[:onUpdate] ||= "function(){" + remote_function(options) + "}"
        #options.delete_if { |key, value| PrototypeHelper::AJAX_OPTIONS.include?(key) }
        
        #convert similar attributes
        options[:items] = options[:only] if options[:only]
        options[:hoverClass] = options[:hoverclass] if options[:hoverclass]
        
        # quoted attributes
        [:hoverClass].each do |option|
          options[option] = "'#{options[option]}'" if options[option]
        end
        
        # array attributes
        options[:items] = array_or_string_for_javascript(options[:items]) if options[:items]
        
        options.delete_if { |key, value| [:only, :tag, :overlap, :hoverclass].include?(key) }
        
        "$(\"##{element_id}\").sortable(#{options_for_javascript(options) unless options.empty? });"
      end
      
      def draggable_element_js(element_id, options = {})
        "$(\"##{element_id}\").draggable(#{options_for_javascript(options) unless options.empty? });"
      end
      
      def drop_receiving_element_js(element_id, options = {})
        
        options[:hoverClass] = options[:hoverclass] if options[:hoverclass]
        options[:drop] = options[:onDrop] if options[:onDrop]
        
        options[:with]     ||= "'id=' + encodeURIComponent(element.id)"
        options[:drop]   ||= "function(element){" + remote_function(options) + "}"
        options.delete_if { |key, value| PrototypeHelper::AJAX_OPTIONS.include?(key) }
        
        options[:accept] = array_or_string_for_javascript(options[:accept]) if options[:accept]    
        options[:hoverClass] = "'#{options[:hoverClass]}'" if options[:hoverClass]
        
        options.delete_if { |key, value| [:hoverclass].include?(key) }
        
        "$(\"##{element_id}\").droppable(#{options_for_javascript(options) unless options.empty? });"
      end
      
    end
    
  end
end
