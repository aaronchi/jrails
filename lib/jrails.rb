module ActionView
	module Helpers
		
		module PrototypeHelper

			unless const_defined? :JQUERY_VAR
				JQUERY_VAR = '$'
			end
					
			unless const_defined? :JQCALLBACKS
				JQCALLBACKS = Set.new([ :beforeSend, :complete, :error, :success ] + (100..599).to_a)
				AJAX_OPTIONS = Set.new([ :before, :after, :condition, :url,
												 :asynchronous, :method, :insertion, :position,
												 :form, :with, :update, :script ]).merge(JQCALLBACKS)
			end
			
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

				function = "#{JQUERY_VAR}.ajax(#{javascript_options})"

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
						call "#{JQUERY_VAR}(\"##{id}\").#{insertion}", render(*options_for_render)
					end
					
					def replace_html(id, *options_for_render)
						insert_html(:html, id, *options_for_render)
					end
					
					def replace(id, *options_for_render)
						call "#{JQUERY_VAR}(\"##{id}\").replaceWith", render(*options_for_render)
					end
					
					def remove(*ids)
						call "#{JQUERY_VAR}(\"##{ids.join(',#')}\").remove"
					end
					
					def show(*ids)
						call "#{JQUERY_VAR}(\"##{ids.join(',#')}\").show"
					end
					
					def hide(*ids)
						call "#{JQUERY_VAR}(\"##{ids.join(',#')}\").hide"
					end

					def toggle(*ids)
						call "#{JQUERY_VAR}(\"##{ids.join(',#')}\").toggle"
					end
					
				end
			end
			
		protected
			def options_for_ajax(options)
				js_options = build_callbacks(options)
				
				url_options = options[:url]
				url_options = url_options.merge(:escape => false) if url_options.is_a?(Hash)
				js_options['url'] = "'#{url_for(url_options)}'"
				js_options['async'] = false if options[:type] == :synchronous
				js_options['type'] = options[:method] ? method_option_to_s(options[:method]) : ( options[:form] ? "'post'" : nil )
				js_options['dataType'] = options[:datatype] ? "'#{options[:datatype]}'" : (options[:update] ? nil : "'script'")
				
				if options[:form]
					js_options['data'] = "#{JQUERY_VAR}.param(#{JQUERY_VAR}(this).serializeArray())"
				elsif options[:submit]
					js_options['data'] = "#{JQUERY_VAR}(\"##{options[:submit]} :input\").serialize()"
				elsif options[:with]
					js_options['data'] = options[:with].gsub("Form.serialize(this.form)","#{JQUERY_VAR}.param(#{JQUERY_VAR}(this.form).serializeArray())")
				end
				
				if options[:method]
					if method_option_to_s(options[:method]) == "'put'" || method_option_to_s(options[:method]) == "'delete'"
						js_options['type'] = "'post'"
						if js_options['data']
							js_options['data'] << " + '&"
						else
							js_options['data'] = "'"
						end
						js_options['data'] << "_method=#{options[:method]}'"
					end
				end
				
				if respond_to?('protect_against_forgery?') && protect_against_forgery?
					if js_options['data']
						js_options['data'] << " + '&"
					else
						js_options['data'] = "'"
					end
					js_options['data'] << "#{request_forgery_protection_token}=' + encodeURIComponent('#{escape_javascript form_authenticity_token}')"
				end
			
				options_for_javascript(js_options.reject {|key, value| value.nil?})
			end
			
			def build_update_for_success(html_id, insertion=nil)
				insertion = build_insertion(insertion)
				"#{JQUERY_VAR}('##{html_id}').#{insertion}(request);"
			end

			def build_update_for_error(html_id, insertion=nil)
				insertion = build_insertion(insertion)
				"#{JQUERY_VAR}('##{html_id}').#{insertion}(request.responseText);"
			end

			def build_insertion(insertion)
				insertion ||= 'html'
				insertion = 'append' if insertion == 'bottom'
				insertion = 'prepend' if insertion == 'top'
				insertion.downcase
			end

			def build_observer(klass, name, options = {})
				if options[:with] && (options[:with] !~ /[\{=(.]/)
					options[:with] = "'#{options[:with]}=' + value"
				else
					options[:with] ||= 'value' unless options[:function]
				end

				callback = options[:function] || remote_function(options)
				javascript  = "#{JQUERY_VAR}(\"##{name}\").delayedObserver("
				javascript << "#{options[:frequency] || 0}, "
				javascript << "function(element, value) {"
				javascript << "#{callback}}"
				#javascript << ", '#{options[:on]}'" if options[:on]
				javascript << ")"
				javascript_tag(javascript)
			end
			
			def build_callbacks(options)
				callbacks = {}
				options[:beforeSend] = '';
				[:uninitialized,:loading,:loaded].each do |key|
					options[:beforeSend] << (options[key].last == ';' ? options.delete(key) : options.delete(key) << ';') if options[key]
				end
				options.delete(:beforeSend) if options[:beforeSend].blank?
				options[:error] = options.delete(:failure) if options[:failure]
				if options[:update]
					if options[:update].is_a?(Hash)
						options[:update][:error] = options[:update].delete(:failure) if options[:update][:failure]
						if options[:update][:success]
							options[:success] = build_update_for_success(options[:update][:success], options[:position]) << (options[:success] ? options[:success] : '')
						end
						if options[:update][:error]
							options[:error] = build_update_for_error(options[:update][:error], options[:position]) << (options[:error] ? options[:error] : '')
						end
					else
						options[:success] = build_update_for_success(options[:update], options[:position]) << (options[:success] ? options[:success] : '')
					end
				end
				options.each do |callback, code|
					if JQCALLBACKS.include?(callback)
						callbacks[callback] = "function(request){#{code}}"
					end
				end
				callbacks
			end
			
		end
		
		class JavaScriptElementProxy < JavaScriptProxy #:nodoc:
			
			unless const_defined? :JQUERY_VAR
				JQUERY_VAR = ActionView::Helpers::PrototypeHelper::JQUERY_VAR
			end
			
			def initialize(generator, id)
				@id = id
				super(generator, "#{JQUERY_VAR}(\"##{id}\")")
			end
			
			def replace_html(*options_for_render)
				call 'html', @generator.send(:render, *options_for_render)
			end

			def replace(*options_for_render)
				call 'replaceWith', @generator.send(:render, *options_for_render)
			end
			
			def value()
				call 'val()'
			end

			def value=(value)
				call 'val', value
			end
			
		end
		
		class JavaScriptElementCollectionProxy < JavaScriptCollectionProxy #:nodoc:\
			def initialize(generator, pattern)
				super(generator, "#{JQUERY_VAR}(#{pattern.to_json})")
			end
		end
		
		module ScriptaculousHelper
			
			unless const_defined? :JQUERY_VAR
				JQUERY_VAR = ActionView::Helpers::PrototypeHelper::JQUERY_VAR
			end
			
			unless const_defined? :SCRIPTACULOUS_EFFECTS
				SCRIPTACULOUS_EFFECTS = {
					:appear => {:method => 'fadeIn'},
					:blind_down => {:method => 'blind', :mode => 'show', :options => {:direction => 'vertical'}},
					:blind_up => {:method => 'blind', :mode => 'hide', :options => {:direction => 'vertical'}},
					:blind_right => {:method => 'blind', :mode => 'show', :options => {:direction => 'horizontal'}},
					:blind_left => {:method => 'blind', :mode => 'hide', :options => {:direction => 'horizontal'}},
					:bounce_in => {:method => 'bounce', :mode => 'show', :options => {:direction => 'up'}},
					:bounce_out => {:method => 'bounce', :mode => 'hide', :options => {:direction => 'up'}},
					:drop_in => {:method => 'drop', :mode => 'show', :options => {:direction => 'up'}},
					:drop_out => {:method => 'drop', :mode => 'hide', :options => {:direction => 'down'}},
					:fade => {:method => 'fadeOut'},
					:fold_in => {:method => 'fold', :mode => 'hide'},
					:fold_out => {:method => 'fold', :mode => 'show'},
					:grow => {:method => 'scale', :mode => 'show'},
					:shrink => {:method => 'scale', :mode => 'hide'},
					:slide_down => {:method => 'slide', :mode => 'show', :options => {:direction => 'up'}},
					:slide_up => {:method => 'slide', :mode => 'hide', :options => {:direction => 'up'}},
					:slide_right => {:method => 'slide', :mode => 'show', :options => {:direction => 'left'}},
					:slide_left => {:method => 'slide', :mode => 'hide', :options => {:direction => 'left'}},
					:squish => {:method => 'scale', :mode => 'hide', :options => {:origin => '["top","left"]'}},
					:switch_on => {:method => 'clip', :mode => 'show', :options => {:direction => 'vertical'}},
					:switch_off => {:method => 'clip', :mode => 'hide', :options => {:direction => 'vertical'}},
					:toggle_appear => {:method => 'fadeToggle'},
					:toggle_slide => {:method => 'slide', :mode => 'toggle', :options => {:direction => 'up'}},
					:toggle_blind => {:method => 'blind', :mode => 'toggle', :options => {:direction => 'vertical'}},
				}
			end
			
			def visual_effect(name, element_id = false, js_options = {})
				element = element_id ? element_id : "this"
				
				if SCRIPTACULOUS_EFFECTS.has_key? name.to_sym
					effect = SCRIPTACULOUS_EFFECTS[name.to_sym]
					name = effect[:method]
					mode = effect[:mode]
					js_options = js_options.merge(effect[:options]) if effect[:options]
				end
				
				[:color, :direction].each do |option|
					js_options[option] = "\"#{js_options[option]}\"" if js_options[option]
				end
				
				if js_options.has_key? :duration
					speed = js_options.delete :duration
					speed = (speed * 1000).to_i unless speed.nil?
				else
					speed = js_options.delete :speed
				end
				
				if ['fadeIn','fadeOut','fadeToggle'].include?(name)
					javascript = "#{JQUERY_VAR}(\"##{element_id}\").#{name}("
					javascript << "#{speed}" unless speed.nil?
					javascript << ")"
				else
					javascript = "#{JQUERY_VAR}(\"##{element_id}\").#{mode || 'effect'}(\"#{name}\""
					javascript << ",#{options_for_javascript(js_options)}" unless speed.nil? && js_options.empty?
					javascript << ",#{speed}" unless speed.nil?
					javascript << ")"
				end
				
			end
			
			def sortable_element_js(element_id, options = {}) #:nodoc:
				#convert similar attributes
				options[:handle] = ".#{options[:handle]}" if options[:handle]
				if options[:tag] || options[:only]
					options[:items] = "> "
					options[:items] << options.delete(:tag) if options[:tag]
					options[:items] << ".#{options.delete(:only)}" if options[:only]
				end
				options[:connectWith] = options.delete(:containment).map {|x| "##{x}"} if options[:containment]
				options[:dropOnEmpty] = false unless options[:dropOnEmpty]
				options[:helper] = "'clone'" if options[:ghosting] == true
				options[:axis] = case options.delete(:constraint)
					when "vertical"
						"y"
					when "horizontal"
						"x"
					when false
						nil
					when nil
						"y"
				end
				options.delete(:axis) if options[:axis].nil?
				options.delete(:overlap)
				options.delete(:ghosting)
				
				if options[:onUpdate] || options[:url]
					options[:method] = "post"
					options[:with] ||= "#{JQUERY_VAR}(this).sortable('serialize',{key:'#{element_id}'})"
					options[:onUpdate] ||= "function(){" + remote_function(options) + "}"
				end
				
				options.delete_if { |key, value| PrototypeHelper::AJAX_OPTIONS.include?(key) }
				options[:update] = options.delete(:onUpdate) if options[:onUpdate]
				
				[:items, :axis, :handle].each do |option|
					options[option] = "'#{options[option]}'" if options[option]
				end
				
				options[:connectWith] = array_or_string_for_javascript(options[:connectWith]) if options[:connectWith]
				
				%(#{JQUERY_VAR}("##{element_id}").sortable(#{options_for_javascript(options)});)
			end
			
			def draggable_element_js(element_id, options = {})
				%(#{JQUERY_VAR}("##{element_id}").draggable(#{options_for_javascript(options)});)
			end
			
			def drop_receiving_element_js(element_id, options = {})
				#convert similar options
				options[:hoverClass] = options.delete(:hoverclass) if options[:hoverclass]
				options[:drop] = options.delete(:onDrop) if options[:onDrop]
				
				if options[:drop] || options[:url]
					options[:with] ||= "'id=' + encodeURIComponent(#{JQUERY_VAR}(ui.draggable).attr('id'))"
					options[:drop] ||= "function(ev, ui){" + remote_function(options) + "}"
				end
				
				options.delete_if { |key, value| PrototypeHelper::AJAX_OPTIONS.include?(key) }

				options[:accept] = array_or_string_for_javascript(options[:accept]) if options[:accept]    
				options[:hoverClass] = "'#{options[:hoverClass]}'" if options[:hoverClass]
				
				%(#{JQUERY_VAR}("##{element_id}").droppable(#{options_for_javascript(options)});)
			end
			
		end
		
	end
end
