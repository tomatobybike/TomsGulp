/* = Gulp组件
-------------------------------------------------------------- */
// 引入gulp
var gulp = require('gulp') // 基础库

// 引入我们的gulp组件
var sass = require('gulp-sass'), // CSS预处理/Sass编译
  uglify = require('gulp-uglify'), // JS文件压缩
  minifyCss = require('gulp-minify-css'), // css压缩
  autoprefixer = require('gulp-autoprefixer'),
  rev = require('gulp-rev'),
  revCollector = require('gulp-rev-collector'),
  imagemin = require('gulp-imagemin'), // imagemin 图片压缩
  pngquant = require('imagemin-pngquant'), // imagemin 深度压缩
  webserver = require('gulp-webserver'), // 本地服务器
  rename = require('gulp-rename'), // 文件重命名
  sourcemaps = require('gulp-sourcemaps'), // 来源地图
  changed = require('gulp-changed'), // 只操作有过修改的文件
  concat = require('gulp-concat'), // 文件合并
  del = require('del'), // 文件清理
  browserSync = require('browser-sync'),
  reload = browserSync.reload
/* = 全局设置
-------------------------------------------------------------- */
var srcPath = {
  html: 'src',
  css: 'src/css',
  script: 'src/js',
  image: 'src/images'
}
var destPath = {
  html: 'dist',
  css: 'dist/css',
  script: 'dist/js',
  image: 'dist/images'
}
var revPath = {
  path: 'rev',
  css: 'rev/css',
  script: 'rev/js'
}

/* = 开发环境( Ddevelop Task )
-------------------------------------------------------------- */
// HTML处理
gulp.task('html', function() {
  return gulp
    .src(srcPath.html + '/**/*.html')
    .pipe(changed(destPath.html))
    .pipe(gulp.dest(destPath.html))
})
// 样式处理
gulp.task('sass', () => {
  return gulp
    .src(srcPath.css + '/**/*.scss')
    .pipe(sass({ outputStyle: 'compressed' })) // 指明源文件路径、并进行文件匹配（编译风格：压缩）
    .on('error', function(err) {
      console.error('Error!', err.message) // 显示错误信息
    })
    .pipe(gulp.dest(srcPath.css)) // 输出路径
    .pipe(reload({ stream: true }))
  console.log('sass complete')
})

// JS文件压缩&重命名
gulp.task('script', function() {
  return gulp
    .src([srcPath.script + '/*.js', '!' + srcPath.script + '/*.min.js']) // 指明源文件路径、并进行文件匹配，排除 .min.js 后缀的文件
    .pipe(changed(destPath.script)) // 对应匹配的文件
    .pipe(sourcemaps.init()) // 执行sourcemaps
    .pipe(rename({ suffix: '.min' })) // 重命名
    .pipe(uglify()) // 使用uglify进行压缩，并保留部分注释
    .pipe(sourcemaps.write('maps')) // 地图输出路径（存放位置）
    .pipe(gulp.dest(destPath.script)) // 输出路径
})
// imagemin 图片压缩
gulp.task('images', function() {
  return gulp
    .src(srcPath.image + '/**/*') // 指明源文件路径，如需匹配指定格式的文件，可以写成 .{png,jpg,gif,svg}
    .pipe(changed(destPath.image))
    .pipe(
      imagemin({
        progressive: true, // 无损压缩JPG图片
        svgoPlugins: [{ removeViewBox: false }], // 不要移除svg的viewbox属性
        use: [pngquant()] // 深度压缩PNG
      })
    )
    .pipe(gulp.dest(destPath.image)) // 输出路径
})
// 文件合并
gulp.task('concat', function() {
  return gulp
    .src(srcPath.script + '/*.min.js') // 要合并的文件
    .pipe(concat('libs.js')) // 合并成libs.js
    .pipe(rename({ suffix: '.min' })) // 重命名
    .pipe(gulp.dest(destPath.script)) // 输出路径
})

// 本地服务器
gulp.task('webserver', function() {
  gulp
    .src(srcPath.html) // 服务器目录（.代表根目录）
    .pipe(
      webserver({
        // 运行gulp-webserver
        livereload: true, // 启用LiveReload
        open: true // 服务器启动时自动打开网页
      })
    )
})
// 监听任务
gulp.task('watch', function() {
  // 监听 html
  gulp.watch(srcPath.html + '/**/*.html', ['html'])
  // 监听 scss
  gulp.watch(srcPath.css + '/**/*.scss', ['sass'])
  // 监听 scss
  gulp.watch(srcPath.css + '/**/*.css', ['cssmin'])
  // 监听 images
  gulp.watch(srcPath.image + '/**/*', ['images'])
  // 监听 js
  gulp
    .watch(
      [srcPath.script + '/*.js', '!' + srcPath.script + '/*.min.js'],
      ['script']
    )
    .on('change', reload)
})
// 默认任务

gulp.task(
  'default',
  gulp.series('webserver', 'watch', function() {
    // Do something after a, b, and c are finished.
  })
)

/* = 发布环境( Release Task )
-------------------------------------------------------------- */
// 清理文件
gulp.task('clean', function() {
  return del([destPath.html, revPath.path])
  // return gulp
  //   .src([destPath.html, revPath.path], { read: false }) // 清理maps文件
  //   .pipe(clean())
})
// 样式处理
gulp.task('sassRelease', function() {
  return gulp
    .src(srcPath.css + '/*.scss')
    .pipe(sass({ outputStyle: 'compressed' })) // 指明源文件路径、并进行文件匹配（编译风格：压缩）
    .on('error', function(err) {
      console.error('Error!', err.message) // 显示错误信息
    })
    .pipe(rev())
    .pipe(gulp.dest(revPath.css)) // 输出路径
})
// css 压缩
gulp.task('cssmin', function() {
  return gulp
    .src(srcPath.css + '/**/*.css')
    .pipe(
      autoprefixer({
        browsers: ['last 2 versions', 'Android >= 4.0'],
        // browsers: ['>5%'],
        cascade: true, //是否美化属性值 默认：true 像这样：
        //-webkit-transform: rotate(45deg);
        //        transform: rotate(45deg);
        remove: true //是否去掉不必要的前缀 默认：true
      })
    )
    .pipe(minifyCss())
    .pipe(rev())
    .on('error', function(err) {
      console.error('Error!', err.message) // 显示错误信息
    })
    .pipe(gulp.dest(destPath.css))
    .pipe(rev.manifest()) //生成文件映射
    .pipe(gulp.dest(revPath.css)) //将映射文件导出到rev/css
})
// 脚本压缩&重命名
gulp.task('jsmin', function() {
  return (
    gulp
      .src([srcPath.script + '/*.js', '!' + srcPath.script + '/*.min.js']) // 指明源文件路径、并进行文件匹配，排除 .min.js 后缀的文件
      // .pipe(rename({ suffix: '.min' })) // 重命名
      .pipe(uglify()) // 使用uglify进行压缩，并保留部分注释
      .pipe(rev())
      .pipe(gulp.dest(destPath.script))
      .pipe(rev.manifest()) //生成文件映射
      .pipe(gulp.dest(revPath.script)) //将映射文件导出到rev/css
  ) // 输出路径
})

gulp.task('rev', function() {
  return gulp
    .src([revPath.path + '/**/*.json', srcPath.html + '/**/*.html'])
    .pipe(
      revCollector({
        replaceReved: true, //允许替换, 已经被替换过的文件
        dirReplacements: {
          css: 'css',
          js: 'js'
        }
      })
    )
    .pipe(gulp.dest(destPath.html))
})

// 打包发布
gulp.task(
  'release',
  gulp.series(
    'clean',
    // gulp.parallel('sassRelease', 'jsmin', 'images'),'rev',
    gulp.parallel('cssmin', 'jsmin', 'images'),
    'rev',
    'html',
    done => {
      // Do something after a, b, and c are finished.
      console.log('release complete');
      done();
    }
  )
)
// gulp.task('release', ['clean'], function() {
//   // 开始任务前会先执行[clean]任务
//   return gulp.start('sassRelease', 'jsmin', 'images') // 等[clean]任务执行完毕后再执行其他任务
// })

/* = 帮助提示( Help )
-------------------------------------------------------------- */
gulp.task('help', function() {
  console.log('----------------- 开发环境 -----------------')
  console.log('gulp default		开发环境（默认任务）')
  console.log('gulp html		HTML处理')
  console.log('gulp sass		样式处理')
  console.log('gulp script		JS文件压缩&重命名')
  console.log('gulp images		图片压缩')
  console.log('gulp concat		文件合并')
  console.log('---------------- 发布环境 -----------------')
  console.log('gulp release		打包发布')
  console.log('gulp clean		清理文件')
  console.log('gulp sassRelease		样式处理')
  console.log('gulp jsmin	脚本压缩&重命名')
  console.log('---------------------------------------------')
})
