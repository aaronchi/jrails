namespace :jrails do
  namespace :update do
    desc "Copies the jQuery and jRails javascripts to public/javascripts"
    task :javascripts do
	puts "Copying files..."
      JRAILS_PATH = RAILS_ROOT + '/vendor/plugins/jrails'
      project_dir = RAILS_ROOT + '/public/javascripts/'
      scripts = Dir[JRAILS_PATH + '/javascripts/*.js']
      FileUtils.cp(scripts, project_dir)
	puts "files copied successfully."
    end
  end
  
  namespace :install do
    desc "Installs the jQuery and jRails javascripts to public/javascripts"
    task :javascripts do
      Rake::Task['jrails:update:javascripts'].invoke
    end
  end
end
