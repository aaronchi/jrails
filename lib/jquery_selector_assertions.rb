#
#  jQuery Selector Assertions (modifications to the prototype/scriptaculous assertions)
#
#   From http://pastie.org/303776
#
# 1. Make sure to use '#' prefix when referring to element IDs in assert_select_rjs(),
#    like this:
#            assert_select_rjs :replace_html, '#someid'
#    instead of prototype convention:
#             assert_select_rjs :replace_html, 'someid' 
#
# We monkey-patch some RJS-matching constants for assert_select_rjs to work 
# with jQuery-based code as opposed to Prototype's:
#
module ActionController
   module Assertions
      module SelectorAssertions
         silence_warnings do
            RJS_PATTERN_HTML  = "\"((\\\\\"|[^\"])*)\""
#            RJS_ANY_ID      = "\"([^\"])*\""
#	better match with single or double quoted ids
            RJS_ANY_ID      = "[\"']([^\"])*[\"']"
            
            RJS_STATEMENTS   = {
               :chained_replace      => "\(jQuery|$\)\\(#{RJS_ANY_ID}\\)\\.replaceWith\\(#{RJS_PATTERN_HTML}\\)",
               :chained_replace_html => "\(jQuery|$\)\\(#{RJS_ANY_ID}\\)\\.updateWith\\(#{RJS_PATTERN_HTML}\\)",
               :replace_html         => "\(jQuery|$\)\\(#{RJS_ANY_ID}\\)\\.html\\(#{RJS_PATTERN_HTML}\\)",
               :replace              => "\(jQuery|$\)\\(#{RJS_ANY_ID}\\)\\.replaceWith\\(#{RJS_PATTERN_HTML}\\)",
               :insert_top           => "\(jQuery|$\)\\(#{RJS_ANY_ID}\\)\\.prepend\\(#{RJS_PATTERN_HTML}\\)",
               :insert_bottom        => "\(jQuery|$\)\\(#{RJS_ANY_ID}\\)\\.append\\(#{RJS_PATTERN_HTML}\\)",
               :effect               => "\(jQuery|$\)\\(#{RJS_ANY_ID}\\)\\.effect\\(",
               :highlight            => "\(jQuery|$\)\\(#{RJS_ANY_ID}\\)\\.effect\\('highlight'"
               
=begin TODO: 

I've never used the chained_* so I don't know if they work.

I couldn't seem to get assert_select_rjs to actually match the single quoted ids
which are created by some of the effects like ... 
 ... jQuery('#item_1559').effect('highlight',{},1000);
so I modified jrails/lib/jrails.rb line 337 
 ... javascript = "#{JQUERY_VAR}('#{jquery_id(element_id)}').#{mode || 'effect'}('#{name}'"
to
 ... javascript = "#{JQUERY_VAR}(\"#{jquery_id(element_id)}\").#{mode || 'effect'}('#{name}'"
so it writes double quotes like most of the others.  This change should probably be 
done to the others, but as I don't use them so haven't tested them.

My other option seemed to require modifying rails' selector_assertions.rb line 427
 ... id ? statement.gsub(RJS_ANY_ID, "\"#{id}\"") : statement
which forces the expectation that the id is double quoted.  If I changed it to 
 ... statement.gsub(RJS_ANY_ID, "[\"']{1}#{id}[\"']{1}")
I believe that it would work as the logic seemed to work in some testing.
I have not actually tried to modify rails, as this file doesn't seem to
actually be in the git repository.


jrails now uses a nonconflict option so $ is jQuery.  I put both in the pattern in case it gets changed.

              :insert_after => "",
              :insert_before => "",
=end
               
            }
            
            [:remove, :show, :hide, :toggle, :reset ].each do |action|
               RJS_STATEMENTS[action] = "\(jQuery|$\)\\(#{RJS_ANY_ID}\\)\\.#{action}\\(\\)"
            end
            
            # TODO: 
            #RJS_STATEMENTS[:insert_html] = "Element.insert\\(#{RJS_ANY_ID}, \\{ (#{RJS_INSERTIONS.join('|')}):            
							#{RJS_PATTERN_HTML} \\}\\)"
            
            RJS_STATEMENTS[:any] = Regexp.new("(#{RJS_STATEMENTS.values.join('|')})")
            RJS_PATTERN_UNICODE_ESCAPED_CHAR = /\\u([0-9a-zA-Z]{4})/
         end
      end
   end
end
