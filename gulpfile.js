var gulp = require("gulp");
var ts = require("gulp-typescript");

gulp.task("ts", function(){
    return gulp.src("src/**/*.ts")
        .pipe(ts({
            noImplicitAny: true,
            out: "output.js"
        }))
        .pipe(gulp.dest("build/"))
})
