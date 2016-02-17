//Todos plugins utilizados devem estar no package.json
var autoPrefixBrowserList = ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'];

var gulp = require('gulp'),
	gutil = require('gulp-util'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    uglify = require('gulp-uglify'),
    jshint = require('gulp-jshint'),
	cssminify = require('gulp-cssnano'),
	imagemin = require('gulp-imagemin'),
    spritesmith = require('gulp.spritesmith'),
	sourcemaps = require('gulp-sourcemaps'),
	plumber = require('gulp-plumber'),
	concat = require('gulp-concat'),
	handlebars = require('gulp-handlebars'),
	wrap = require('gulp-wrap'),
	declare = require('gulp-declare'),
	browserSync = require('browser-sync'),
    argv = require('yargs').argv,
    hostPort = argv.port || 3000,
    hostLocal = 'http://localhost:' + hostPort;

var CONFIG = {
	PATH : {
		SCRIPTS : {
			ROOT: 'App/Scripts/',
			SRC: 'App/Scripts/Source/'
		},
		STYLES: {
			ROOT: 'App/Styles/',
			SCSS: 'App/Styles/Scss/'
		},
		IMAGES: {
			ROOT: 'App/Images/',
			SPRITE: 'App/Images/Sprite/'
		},
		TEMPLATES: 'App/Views/'
	}
}
console.log(hostLocal);
gulp.task('browserSync', function() {
    browserSync({
        server: {
            baseDir: ''
        },
        options: {
            reloadDelay: 250
        },
        notify: false,
        port: hostPort
    });
});

//compiling our SCSS files
gulp.task('styles', ['images:sprite'], function() {
    //the initializer / master SCSS file, which will just be a file that imports everything
    return gulp.src([
    	CONFIG.PATH.STYLES.SCSS + 'Base/Reset.scss',
        CONFIG.PATH.STYLES.SCSS + 'Sprite.scss',
    	CONFIG.PATH.STYLES.SCSS + 'Base/*.scss',
    	CONFIG.PATH.STYLES.SCSS + 'Layout/*.scss',
    	CONFIG.PATH.STYLES.SCSS + 'Modules/*.scss',
    	CONFIG.PATH.STYLES.SCSS + 'Plugins/*.scss',
    	CONFIG.PATH.STYLES.SCSS + 'Themes/*.scss',
    	CONFIG.PATH.STYLES.SCSS + 'Utilities/*.scss',
    	CONFIG.PATH.STYLES.SCSS + 'Comum.scss'
	])
    //prevent pipe breaking caused by errors from gulp plugins
    .pipe(plumber({
      errorHandler: function (err) {
        console.log(err);
        this.emit('end');
      }
    }))
    //get sourceMaps ready
    .pipe(sourcemaps.init())
    //include SCSS and list every "include" folder
    .pipe(concat('App.scss'))
    .pipe(sass({
          errLogToConsole: true
    }))
    .pipe(autoprefixer({
       browsers: autoPrefixBrowserList,
       cascade:  true
    }))
    //catch errors
    .on('error', gutil.log)
    //the final filename of our combined css file
    .pipe(cssminify('App.css'))
    //get our sources via sourceMaps
    .pipe(sourcemaps.write())
    //where to save our final, compressed css file
    .pipe(gulp.dest(CONFIG.PATH.STYLES.ROOT))
    //notify browserSync to refresh
    .pipe(browserSync.reload({stream: true}));
});

//validate our Javascripts
gulp.task('scripts:jshint', function() {
    //this is where our dev JS scripts are
    return gulp.src([
        CONFIG.PATH.SCRIPTS.SRC + 'Config.js',
        CONFIG.PATH.SCRIPTS.SRC + 'Base/*.js',
        CONFIG.PATH.SCRIPTS.SRC + 'Layout/*.js',
        CONFIG.PATH.SCRIPTS.SRC + 'Modules/*.js',
        CONFIG.PATH.SCRIPTS.SRC + 'Themes/*.js',
        CONFIG.PATH.SCRIPTS.SRC + 'Utilities/*.js',
        CONFIG.PATH.SCRIPTS.SRC + 'Library/*.js',
        CONFIG.PATH.SCRIPTS.SRC + 'Comum.js'
    ])
    //prevent pipe breaking caused by errors from gulp plugins
    .pipe(plumber())
    //this is the filename of the compressed version of our JS
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    //catch errors
    .on('error', gutil.log)
    //where we will store our finalized, compressed script
});

//minify our Javascripts
gulp.task('scripts:minify', ['scripts:jshint'], function() {
    //this is where our dev JS scripts are
    return gulp.src([
    	CONFIG.PATH.SCRIPTS.SRC + 'Config.js',
        CONFIG.PATH.SCRIPTS.SRC + 'Plugins/**/*.js',
    	CONFIG.PATH.SCRIPTS.SRC + 'Base/**/*.js',
    	CONFIG.PATH.SCRIPTS.SRC + 'Layout/**/*.js',
    	CONFIG.PATH.SCRIPTS.SRC + 'Modules/**/*.js',
    	CONFIG.PATH.SCRIPTS.SRC + 'Themes/**/*.js',
    	CONFIG.PATH.SCRIPTS.SRC + 'Utilities/**/*.js',
        CONFIG.PATH.SCRIPTS.SRC + 'Library/**/*.js',
    	CONFIG.PATH.SCRIPTS.SRC + 'Comum.js'
	])
    //prevent pipe breaking caused by errors from gulp plugins
    .pipe(plumber())
    //this is the filename of the compressed version of our JS
    .pipe(concat('App.js'))
    .pipe(uglify())
    //catch errors
    .on('error', gutil.log)
    //where we will store our finalized, compressed script
    .pipe(gulp.dest(CONFIG.PATH.SCRIPTS.ROOT))
    //notify browserSync to refresh
    .pipe(browserSync.reload({stream: true}));
});

//compressing images & handle SVG files
gulp.task('images:minify', function() {
    gulp.src(CONFIG.PATH.IMAGES.ROOT + '**/*')
        //prevent pipe breaking caused by errors from gulp plugins
        .pipe(plumber())
        .pipe(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true }))
        .pipe(gulp.dest(CONFIG.PATH.IMAGES.ROOT));
});

//generate sprite file
gulp.task('images:sprite', function () {
    var spriteData = gulp.src(CONFIG.PATH.IMAGES.SPRITE + '*.png')
        .pipe(spritesmith({
            imgName: '../Images/Sprite.png',
            cssName: 'Sprite.scss',
            cssFormat: 'css',
            padding: 10,
            cssOpts: {
                cssSelector: function (item) {
                    return '.' + item.name;
                },
                padding: 10
            }
        }));
    spriteData.img.pipe(gulp.dest(CONFIG.PATH.IMAGES.ROOT));
    spriteData.css.pipe(gulp.dest(CONFIG.PATH.STYLES.SCSS));

    return spriteData;
});

//convert templates .hbs to javascript file
gulp.task('templates', function(){
  gulp.src(CONFIG.PATH.TEMPLATES + '**/*.hbs')
    .pipe(handlebars())
    .pipe(wrap('Handlebars.template(<%= contents %>)'))
    .pipe(declare({
      namespace: 'App.templates',
      noRedeclare: true, // Avoid duplicate declarations
    }))
    .pipe(concat('Templates.js'))
    .pipe(gulp.dest(CONFIG.PATH.SCRIPTS.ROOT))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('watch', ['browserSync'], function () {
    function reportChange(event){
        console.log('\nEvent type: ' + event.type); // added, changed, or deleted
        console.log('Event path: ' + event.path + '\n'); // The path of the modified file
    }

    //styles watch
    gulp.watch(['!' + CONFIG.PATH.STYLES.SCSS + 'Sprite.scss', CONFIG.PATH.STYLES.SCSS + '**/*.scss'], ['styles']).on('change', reportChange);

    //images watch
    gulp.watch([CONFIG.PATH.IMAGES.SPRITE + '*.png'], ['images:sprite']).on('change', reportChange);

    //scripts watch
    gulp.watch(CONFIG.PATH.SCRIPTS.SRC + '**/*', ['scripts:minify']).on('change', reportChange);

    //templates hbs watch
    gulp.watch(CONFIG.PATH.TEMPLATES + '**/*.hbs', ['templates']).on('change', reportChange);
});

// Task utilizada para chamar o watch
gulp.task('default', ['templates', 'styles', 'scripts:minify' ]);
