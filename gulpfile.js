/** ------------------------------------------------------------------
 * Este arquivo é reponsável pelas regras de automatização de tarefas.
 * -------------------------------------------------------------------
 */

/**
 * Definição dos plugins que serão iniciados e todos os plugins
 * instânciados que vão ser utilizados nete arquivo devem estar
 * no package.json.
 */
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

// Comprimi as imagens e arquivos svg.
gulp.task('images:minify', function() {

	// Rota do diretório das imagens.
	gulp.src(CONFIG.PATH.IMAGES.ROOT + '**/*')

	// Evita paralizar o watch e exibe erros.
	.pipe(plumber())

	// Inicia o imagemin e suas pré configurações.
	.pipe(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true }))

	// Salva o arquivo final no diretório específico.
	.pipe(gulp.dest(CONFIG.PATH.IMAGES.ROOT));
});

// Gera o arquivo Sprite.png
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

	// Salva a imagem final no diretório específico.
	spriteData.img.pipe(gulp.dest(CONFIG.PATH.IMAGES.ROOT));

	// Salva o arquivo final no diretório específico.
	spriteData.css.pipe(gulp.dest(CONFIG.PATH.STYLES.SCSS));

	return spriteData;
});

// Converte os templates.hbs para arquivos JS.
gulp.task('templates', function() {

	// Rota do diretório dos templates .hbs.
	gulp.src(CONFIG.PATH.TEMPLATES + '**/*.hbs')

	// Transforma o hbs em js
	.pipe(handlebars())

	// Copila e subtitui as variáveis dos objetos
	.pipe(wrap('Handlebars.template(<%= contents %>)'))

	.pipe(declare({
		namespace: 'App.Templates', // Variável onde fica armazenado o template
		noRedeclare: true, // Evita declarações duplicadas.
	}))

	// Inclui todos os templates no Templates.js.
	.pipe(concat('Templates.js'))

	// Salva o arquivo final no diretório específico.
	.pipe(gulp.dest(CONFIG.PATH.SCRIPTS.ROOT))

	// Notifica o browserSync a dar refresh depois de gerar os arquivos concatenados e minificados.
	.pipe(browserSync.reload({stream: true}));
});


/**
 * Responsável por vigiar e executar todas as tarefas de:
 * copilação, minificação, padronização e alertas dos módulos
 * (Style, Images, Scripts, Templates)
 */
gulp.task('watch', ['browserSync'], function () {
	function reportChange(event) {
		console.log('\nEvent type: ' + event.type); // Adicinar, Alterar ou Deletar.
		console.log('Event path: ' + event.path + '\n'); // O caminho onde foi modificado o arquivo.
	};

	//Styles watch
	gulp.watch(['!' + CONFIG.PATH.STYLES.SCSS + 'Sprite.scss', CONFIG.PATH.STYLES.SCSS + '**/*.scss'], ['styles']).on('change', reportChange);

	//Images watch
	gulp.watch([CONFIG.PATH.IMAGES.SPRITE + '*.png'], ['images:sprite']).on('change', reportChange);

	//Scripts watch
	gulp.watch(CONFIG.PATH.SCRIPTS.SRC + '**/*', ['scripts:minify']).on('change', reportChange);

	//Templates.hbs watch
	gulp.watch(CONFIG.PATH.TEMPLATES + '**/*.hbs', ['templates']).on('change', reportChange);
});

// Task utilizada para chamar o watch
gulp.task('default', ['templates', 'styles', 'scripts:minify' ]);
