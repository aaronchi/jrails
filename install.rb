# Install hook code here
puts "Copying files..."
Rake::Task["jrails:install:javascripts"].invoke
puts "Files copied - Installation complete!"
