var markdown = require('node-markdown').Markdown;

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-html2js');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-conventional-changelog');
  grunt.loadNpmTasks('grunt-ngdocs-caitp');
  grunt.loadNpmTasks('grunt-ngmin');
  grunt.loadNpmTasks('grunt-gh-pages');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Project configuration.
  grunt.util.linefeed = '\n';
  var pkg = grunt.file.readJSON('package.json');
  grunt.initConfig({
    modules: [],
    pkg: pkg,
    dist: 'dist',
    filename: 'ui-comments',
    meta: {
      modules: 'angular.module("ui.comments");',
      tplmodules: 'angular.module("ui.comments.tpls", [<%= tplModules %>]);',
      all: 'angular.module("ui.comments", ["ui.comments.tpls", <%= srcModules %>]);'
    },
    delta: {
      html: {
        files: ['template/**/*.html'],
        tasks: ['html2js', 'karma:watch:run']
      },
      js: {
        files: ['src/**/*.js'],
        // we don't need to jshint here, it slows down everything else.
        tasks: ['karma:watch:run']
      }
    },
    concat: {
      dist: {
        options: {
          banner: '<%= meta.all %>\n<%= meta.tplmodules %>\n'
        },
        src: [], // src filled in by build task
        dest: '<%= dist %>/<%= filename %>-<%= pkg.version %>.js'
      }
    },
    copy: {
      demohtml: {
        options: {
          // process html files with gruntfile config
          processContent: grunt.template.process
        },
        files: [{
          expand: true,
          src: ["**/*.html"],
          cwd: "misc/demo/",
          dest: "<%= dist %>/"
        }]
      },
      demoassets: {
        files: [{
          expand: true,
          // Don't re-copy html files, we process those
          src: ["**/**/*", "!**/*.html"],
          cwd: "misc/demo",
          dest: "<%= dist %>/"
        }]
      }
    },
    uglify: {
      dist: {
        options: {
          mangle: {
            except: ['angular']
          },
        },
        files: {
          '<%= dist %>/<%= filename %>-<%= pkg.version %>.min.js':
          '<%= dist %>/<%= filename %>-<%= pkg.version %>.js'
        }
      }
    },
    html2js: {
      dist: {
        options: {
          module: null, // no bundle module for all the html2js templates
          base: '.'
        },
        files: [{
          expand: true,
          src: ['template/**/*.html'],
          ext: '.html.js'
        }]
      },
    },
    jshint: {
      options: {
        curly: true,
        immed: true,
        newcap: true,
        noarg: true,
        sub: true,
        boss: true,
        eqnull: true,
        maxlen: 100,
        trailing: true,
        undef: true,
      },
      gruntfile: {
        options: {
          node: true,
          globals: {
            "console": true
          }
        },
        files: [{
          src: 'Gruntfile.js'
        }]
      },
      sources: {
        options: {
          globals: {
            "console": true,
            angular: true,
            jQuery: true,
            document: true
          }
        },
        files: [{
          src: ['src/*.js', '!src/*.spec.js']
        }]
      }
    },
    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      watch: {
        background: true
      },
      continuous: {
        singleRun: true
      },
      jenkins: {
        singleRun: true,
        colors: false,
        reporter: ['dots', 'junit'],
        browsers: [
          'Chrome',
          'ChromeCanary',
          'Firefox',
          'Opera',
          '/Users/jenkins/bin/safari.sh',
          '/Users/jenkins/bin/ie9.sh'
        ]
      },
      travis: {
        singleRun: true,
        browsers: ['PhantomJS', 'Firefox']
      }
    },
    changelog: {
      options: {
        dest: 'CHANGELOG.md',
        templateFile: 'misc/changelog.tpl.md',
        github: 'caitp/ui-comments'
      }
    },
    shell: {
      // We use %version% and evaluate it at run-time, because 
      // <%= pkg.version is only evaluated once
      'release-prepare': [
        'grunt before-test after-test',
        'grunt clean:dist',
        'grunt version', // remove "-SNAPSHOT"
        'grunt before-test after-test',
        'grunt docgen:%version%',
        'grunt changelog',
      ],
      'release-complete': [
        'git commit CHANGELOG.md package.json -m "chore(release): v%version%"',
        'git tag v%version%',
      ],
      'release-start': [
        'grunt version:%PATCHTYPE%:"SNAPSHOT"',
        'git commit package.json -m "chore(release): Starting v%version%"'
      ]
    },
    ngmin: {
      lib: {
        src: ['<%= dist %>/ui-comments-<%= pkg.version %>.js'],
        dest: '<%= dist %>/ui-comments-<%= pkg.version %>.js'
      }
    },
    ngdocs: {
      options: {
        dest: "<%= dist %>/docs",
        scripts: [
          'angular.js',
          '<%= concat.dist.dest %>'
        ],
        styles: [
          'docs/css/style.css'
        ],
        navTemplate: 'docs/nav.html',
        title: 'UI Comments',
        image: 'logo.png',
        imageLink: 'http://caitp.github.io/ui-comments',
        titleLink: 'http://caitp.github.io/ui-comments',
        html5Mode: false,
        analytics: {
          account: 'UA-44389518-1',
          domainName: 'caitp.github.io'
        }
      },
      api: {
        src: ["src/comments.js", "src/**/*.ngdoc"],
        title: "API Documentation"
      }
    },
    'gh-pages': {
      'gh-pages': {
        options: {
          base: '<%= dist %>',
          repo: 'https://github.com/caitp/ui-comments.git',
          message: 'gh-pages v<%= pkg.version %>',
          add: true
        },
        src: ['**/*']
      }
    },
    connect: {
      docs: {
        options: {
          port: process.env.PORT || '3000',
          base: '<%= dist %>/docs',
          keepalive: true
        }
      },
      dev: {
        options: {
          port: process.env.PORT || '3000',
          base: '<%= dist %>',
          keepalive: true
        }
      }
    },
    clean: {
      dist: {
        src: ['<%= dist %>', 'dist']
      }
    }
  });
  
  // register before and after test tasks so we don't have to change cli
  // options on the CI server
  grunt.registerTask('before-test', ['enforce', 'jshint', 'html2js']);
  grunt.registerTask('after-test', ['build', 'copy']);
  
  // Rename our watch task to 'delta', then make actual 'watch' task build 
  // things, then start test server
  grunt.renameTask('watch', 'delta');
  grunt.registerTask('watch', ['before-test', 'after-test', 'karma:watch', 'delta']);
  
  // Default task.
  grunt.registerTask('default', ['before-test', 'test', 'after-test']);
  grunt.registerTask('all', ['default']);
  
  grunt.registerTask('enforce', 'Install commit message enforce script if it doesn\'t exist',
  function() {
    if (!grunt.file.exists('.git/hooks/commit-msg')) {
      grunt.file.copy('misc/validate-commit-msg.js', '.git/hooks/commit-msg');
      require('fs').chmodSync('.git/hooks/commit-msg', '0755');
    }
  });
  
  // Test
  grunt.registerTask('test', 'Run tests on singleRun karma server', function() {
    // This task can be executed in 3 different environments: local, Travis-CI, 
    // and Jenkins-CI. We need to take settings for each one into account
    if (process.env.TRAVIS) {
      grunt.task.run('karma:travis');
    } else {
      grunt.task.run(this.args.length ? 'karma:jenkins' : 'karma:continuous');
    }
  });

  // Shell commands
  grunt.registerMultiTask('shell', 'Run shell commands', function() {
    var self = this, sh = require('shelljs');
    self.data.forEach(function(cmd) {
      cmd = cmd.replace('%version%', grunt.file.readJSON('package.json').version);
      cmd = cmd.replace('%PATCHTYPE%', grunt.option('patch') && 'patch' ||
                                       grunt.option('major') &&
                                       'major' || 'minor');
      grunt.log.ok(cmd);
      var result = sh.exec(cmd, {silent: true });
      if (result.code !== 0) {
        grunt.fatal(result.output);
      }
    });
  });

  // Version management
  function setVersion(type, suffix) {
    var file = 'package.json',
        VERSION_REGEX = /([\'|\"]version[\'|\"][ ]*:[ ]*[\'|\"])([\d|.]*)(-\w+)*([\'|\"])/,
        contents = grunt.file.read(file),
        version;
    contents = contents.replace(VERSION_REGEX, function(match, left, center) {
      version = center;
      if (type) {
        version = require('semver').inc(version, type);
      }
      // semver.inc strips suffix, if it existed
      if (suffix) {
        version += '-' + suffix;
      }
      return left + version + '"';
    });
    grunt.log.ok('Version set to ' + version.cyan);
    grunt.file.write(file, contents);
    return version;
  }

  grunt.registerTask('version', 'Set version. If no arguments, it just takes off suffix',
  function() {
    setVersion(this.args[0], this.args[1]);
  });

  // Dist
  grunt.registerTask('dist', 'Override dist directory', function() {
    var dir = this.args[0];
    if (dir) {
      grunt.config('dist', dir );
    }
  });

  var foundModules = {};
  function findModule(name) {
    if (foundModules[name]) { return; }
    foundModules[name] = true;

    function breakup(text, separator) {
      return text.replace(/[A-Z]/g, function (match) {
        return separator + match;
      });
    }
    function ucwords(text) {
      return text.replace(/^([a-z])|\s+([a-z])/g, function ($1) {
        return $1.toUpperCase();
      });
    }
    function enquote(str) {
      return '"' + str + '"';
    }
    
    var modname = name;
    if (name === 'comments') {
      modname = 'comments.directive';
    }
    var module = {
      name: name,
      moduleName: enquote('ui.' + modname),
      displayName: ucwords(breakup(name, ' ')),
      srcFiles: grunt.file.expand({ignore: "*.spec.js"}, "src/"+name+".js"),
      tplFiles: grunt.file.expand("template/"+name+"/*.html"),
      tpljsFiles: grunt.file.expand("template/"+name+"/*.html.js"),
      tplModules: grunt.file.expand("template/"+name+"/*.html").map(enquote),
      dependencies: dependenciesForModule(name),
      docs: {
        md: grunt.file.expand("src/"+name+"/docs/*.md")
          .map(grunt.file.read).map(markdown).join("\n"),
        js: grunt.file.expand("src/"+name+"/docs/*.js")
          .map(grunt.file.read).join("\n"),
        html: grunt.file.expand("src/"+name+"/docs/*.html")
          .map(grunt.file.read).join("\n")
      }
    };
    module.dependencies.forEach(findModule);
    grunt.config('modules', grunt.config('modules').concat(module));
  }

  function dependenciesForModule(name) {
    var deps = [];
    grunt.file.expand('src/*.js')
    .map(grunt.file.read)
    .forEach(function(contents) {
      //Strategy: find where module is declared,
      //and from there get everything inside the [] and split them by comma
      var moduleDeclIndex = contents.indexOf('angular.module(');
      var depArrayStart = contents.indexOf('[', moduleDeclIndex);
      var depArrayEnd = contents.indexOf(']', depArrayStart);
      var dependencies = contents.substring(depArrayStart + 1, depArrayEnd);
      dependencies.split(',').forEach(function(dep) {
        if (dep.indexOf('ui.comments.') > -1) {
          var depName = dep.trim().replace('ui.comments.','').replace(/['"]/g,'');
          if (deps.indexOf(depName) < 0) {
            deps.push(depName);
            //Get dependencies for this new dependency
            deps = deps.concat(dependenciesForModule(depName));
          }
        }
      });
    });
    return deps;
  }

  // Build
  grunt.registerTask('build', 'Create ui-comments build files', function() {
    var _ = grunt.util._;

    grunt.file.expand({
      filter: 'isFile', cwd: '.'
    }, 'src/*.js').forEach(function(file) {
      findModule(file.split('/')[1].split('.')[0]);
    });

    var modules = grunt.config('modules');
    grunt.config('srcModules', _.pluck(modules, 'moduleName'));
    grunt.config('tplModules', _.pluck(modules, 'tplModules')
      .filter(function(tpls) {
        return tpls.length > 0;
      })
    );
    grunt.config('demoModules',
      modules.filter(function(module) {
        return module.docs.md && module.docs.js && module.docs.html;
      })
      .sort(function(a, b) {
        if (a.name < b.name) { return -1; }
        if (a.name > b.name) { return 1; }
        return 0;
      }));

    var srcFiles = _.pluck(modules, 'srcFiles');
    var tpljsFiles = _.pluck(modules, 'tpljsFiles');
    
    grunt.config('concat.dist.src',
      grunt.config('concat.dist.src')
      .concat(srcFiles)
      .concat(tpljsFiles));

    grunt.task.run(['concat', 'ngmin', 'uglify', 'ngdocs']);
  });

  grunt.registerTask('docgen', function() {
    var self = this;
    if (typeof self.args[0] === 'string') {
      grunt.config('pkg.version', self.args[0]);
    }
    grunt.task.mark().run('gh-pages');
  });

  return grunt;
};
