module.exports = function(grunt) {
    process.env.NODE_ENV = 'test';
    grunt.config.set('mochaTest', {
        test: {
            options: {
                reporter: 'spec'
            },
            src: ['test/**/*.test.js']
        }
    });
    grunt.loadNpmTasks('grunt-mocha-test');

};