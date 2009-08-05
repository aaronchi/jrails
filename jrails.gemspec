Gem::Specification.new do |s|
  s.name = "jrails"
  s.version = "0.5.0"
  s.date = "2009-07-31"

  s.summary = "jRails is a drop-in jQuery replacement for the Rails Prototype/script.aculo.us helpers."
  s.description = "Using jRails, you can get all of the same default Rails helpers for javascript functionality using the lighter jQuery library."
  
  s.authors = ["Aaron Eisenberger", "Patrick Hurley"]
  s.email = "aaronchi@gmail.com"
  s.homepage = "http://ennerchi.com/projects/jrails"

  s.has_rdoc = false

  s.files = %w(CHANGELOG LICENSE README.rdoc install.rb init.rb bin bin/jrails javascripts javascripts/jquery-ui.js javascripts/jquery.js javascripts/jrails.js javascripts/sources javascripts/sources/jrails.js lib lib/jrails.rb tasks/ tasks/jrails.rake rails/init.rb)
  s.executables = ['jrails']

end
