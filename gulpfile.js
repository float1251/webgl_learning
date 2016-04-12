var gulp = require("gulp");
var ts = require("gulp-typescript");
var webserver = require("gulp-webserver");

gulp.task("ts", function(){
    return gulp.src("src/**/*.ts")
        .pipe(ts({
            noImplicitAny: true,
            out: "output.js"
        }))
        .pipe(gulp.dest("build/"))
})

gulp.task("webserver", function() {
    gulp.src("./")
        .pipe(webserver({
            livereload: true,
            directoryListing: true,
            open: true
        }))
});
