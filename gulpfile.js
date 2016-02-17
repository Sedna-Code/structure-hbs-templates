/** ------------------------------------------------------
 * Este arquivo contém regras de automatização de tarefas.
 * -------------------------------------------------------
 */

/**
 * Definição dos plugins que serão iniciados e todos os plugins
 * instânciados que vão ser utilizados nete arquivo devem estar
 * no package.json.
 */
var autoPrefixBrowserList = ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'];

var gulp = require('gulp'), //
	gutil = require('gulp-util'), //
	sass = require('gulp-sass'), //
	autoprefixer = require('gulp-autoprefixer'), //
	uglify = require('gulp-uglify'), //
	jshint = require('gulp-jshint'), //
	cssminify = require('gulp-cssnano'), //
	imagemin = require('gulp-imagemin'), //
	spritesmith = require('gulp.spritesmith'), //
	sourcemaps = require('gulp-sourcemaps'), //
	plumber = require('gulp-plumber'), //
	concat = require('gulp-concat'), //
	handlebars = require('gulp-handlebars'), //
	wrap = require('gulp-wrap'), //
	declare = require('gulp-declare'), //
	browserSync = require('browser-sync'), //
	argv = require('yargs').argv, //
	hostPort = argv.port || 3000, //
	hostLocal = 'http://localhost:' + hostPort; //


/**
 * Configuração dos diretórios para facilitar os diretórios.
 */
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
};


/**
 * Difinição das tarefas.
 */

// Responsável pela sincronização de arquivos com o navegador.
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

// Responsável pela compilação dos arquivos SCSS/CSS.
gulp.task('styles', ['images:sprite'], function() {

	// Ordena os arquivos por prioridade.
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

	// Evita paralizar o watch e exibe erros.
	.pipe(plumber({
		errorHandler: function (err) {
			console.log(err);
			this.emit('end');
		}
	}))

	// Inicia o sourceMaps
	.pipe(sourcemaps.init())

	// Inclui todos SCSS os arquivos no App.scss.
	.pipe(concat('App.scss'))

	// Compila o que foi gerado do concat.
	.pipe(sass({
		errLogToConsole: true
	}))

	// Adiciona os prefixos automaticamente.
	.pipe(autoprefixer({
		browsers: autoPrefixBrowserList,
		cascade: true
	}))

	// Exibe log's de erro.
	.on('error', gutil.log)

	// Minifica e gera o arquivo final App.css.
	.pipe(cssminify('App.css'))

	// Gera o sourcemaps do arquivo final App.css.
	.pipe(sourcemaps.write())

	// Salva o arquivo final no diretório específico.
	.pipe(gulp.dest(CONFIG.PATH.STYLES.ROOT))

	// Notifica o browserSync a dar refresh depois de gerar os arquivos concatenados e minificados.
	.pipe(browserSync.reload({stream: true}));
});

// Responsável pela validação e padronização dos arquivos JS.
gulp.task('scripts:jshint', function() {

	// Ordena os arquivos por prioridade.
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

	// Evita paralizar o watch e exibe erros.
	.pipe(plumber())

	// Executa o jshint.
	.pipe(jshint('.jshintrc'))

	// Cria erros estilizados pelo jshint-stylish.
	.pipe(jshint.reporter('jshint-stylish'))

	// Exibe os erros.
	.on('error', gutil.log)
});

// Responsável pela compilação dos arquivos JS.
gulp.task('scripts:minify', ['scripts:jshint'], function() {

	// Ordena os arquivos por prioridade.
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

	// Evita paralizar o watch e exibe erros.
	.pipe(plumber())

	// Inclui todos JS os arquivos no App.scss.
	.pipe(concat('App.js'))

	// Responsável pela minificação do JS.
	.pipe(uglify())

	// Exibe log's de erro.
	.on('error', gutil.log)

	// Salva o arquivo final no diretório específico.
	.pipe(gulp.dest(CONFIG.PATH.SCRIPTS.ROOT))

	// Notifica o browserSync a dar refresh depois de gerar os arquivos concatenados e minificados.
	.pipe(browserSync.reload({stream: true}));
});

//compressing images & handle SVG files
gulp.task('images:minify', function() {
	//
	gulp.src(CONFIG.PATH.IMAGES.ROOT + '**/*')

	//prevent pipe breaking caused by errors from gulp plugins
	.pipe(plumber())

	//
	.pipe(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true }))

	//
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
gulp.task('templates', function() {

	//
	gulp.src(CONFIG.PATH.TEMPLATES + '**/*.hbs')
		.pipe(handlebars())
		.pipe(wrap('Handlebars.template(<%= contents %>)'))
		.pipe(declare({
		namespace: 'App.templates',
		noRedeclare: true, // Avoid duplicate declarations
	}))

	//
	.pipe(concat('Templates.js'))

	//
	.pipe(gulp.dest(CONFIG.PATH.SCRIPTS.ROOT))

	//
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
