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
          
          def select(pattern)
            record "$('#{pattern}')"
          end
          
          def insert_html(position, id, *options_for_render)
            insertion = position.to_s.downcase
            insertion = 'append' if insertion == 'bottom'
            insertion = 'prepend' if insertion == 'top'
            record "$('##{id}').#{insertion}('#{escape_javascript(render(*options_for_render))}')"
          end
          
          def replace_html(id, *options_for_render)
            insert_html(:html, id, *options_for_render)
          end
          
          def replace(id, *options_for_render)
            record "$('##{id}').replaceWith('#{escape_javascript(render(*options_for_render))}')"
          end
          
          def remove(*ids)
            record "$('##{ids.join(',#')}').remove()"
          end
          
          def show(*ids)
            record "$('##{ids.join(',#')}').show()"
          end
          
          def hide(*ids)
            record "$('##{ids.join(',#')}').hide()"     
          end

          def toggle(*ids)
            record "$('##{ids.join(',#')}').toggle()"         
          end
          
        end
      end
      
    protected
      def options_for_ajax(options)
        js_options = build_callbacks(options)
        
        url_options = options[:url]
        url_options = url_options.merge(:escape => false) if url_options.is_a?(Hash)
        js_options['url'] = "'#{url_for(url_options)}'"
        js_options['async'] = options[:type] != :synchronous
        js_options['type']       = method_option_to_s(options[:method]) if options[:method]
        js_options['dataType'] = options[:script].nil? ? "'script'" : (options[:script] == false ? "'html'" : "'script'") 
        
        if options[:form]
          js_options['data'] = "$.param($(this).serializeArray())"
        elsif options[:submit]
          js_options['data'] = "$('##{options[:submit]}').serializeArray()"
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
        "$('##{options[:update]}').#{insertion}(request.responseText);"
      end
      
      def build_observer(klass, name, options = {})
        if options[:with] && (options[:with] !~ /[\{=(.]/)
          options[:with] = "'#{options[:with]}=' + value"
        else
          options[:with] ||= 'value' unless options[:function]
        end

        callback = options[:function] || remote_function(options)
        javascript  = "$('##{name}').delayedObserver("
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
    
    module ScriptaculousHelper
      
      def visual_effect(name, element_id = false, js_options = {})
        #element = element_id ? element_id.to_json : "element"
        
        js_options[:queue] = if js_options[:queue].is_a?(Hash)
          '{' + js_options[:queue].map {|k, v| k == :limit ? "#{k}:#{v}" : "#{k}:'#{v}'" }.join(',') + '}'
        elsif js_options[:queue]
          "'#{js_options[:queue]}'"
        end if js_options[:queue]
        
        [:endcolor, :direction, :startcolor, :scaleMode, :restorecolor].each do |option|
          js_options[option] = "'#{js_options[option]}'" if js_options[option]
        end

        if TOGGLE_EFFECTS.include? name.to_sym
          "Effect.toggle(#{element},'#{name.to_s.gsub(/^toggle_/,'')}',#{options_for_javascript(js_options)});"
        else
          "$('##{element_id}').#{name.to_s.camelize}(#{options_for_javascript(js_options) unless js_options.empty?});"
        end
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
        
        "$('##{element_id}').sortable(#{options_for_javascript(options) unless options.empty? });"
      end
      
      def draggable_element_js(element_id, options = {})
        "$('##{element_id}').draggable(#{options_for_javascript(options) unless options.empty? });"
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
        
        "$('##{element_id}').droppable(#{options_for_javascript(options) unless options.empty? });"
      end
      
    end
    
  end
end