namespace :jrails do
	namespace :update do
		desc "Copies the jQuery and jRails javascripts to public/javascripts"
		task :javascripts do
			puts "Copying files..."
			project_dir = RAILS_ROOT + '/public/javascripts/'
			scripts = Dir[File.join(File.dirname(__FILE__), '..', '/javascripts/', '*.js')]
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

  desc 'Remove the prototype / script.aculo.us javascript files'
  task :scrub do
    files = %W[controls.js dragdrop.js effects.js prototype.js]
  	project_dir = File.join(RAILS_ROOT, 'public', 'javascripts')
    files.each do |fname|
      FileUtils.rm File.join(project_dir, fname)
    end
  end
end
