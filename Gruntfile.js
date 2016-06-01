module.exports = function init(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    env: {
      test: {
        NODE_ENV: 'test'
      }
    },
    eslint: {
      options: {
        config: '.eslintrc.json',
        globals: ['it', 'describe', 'before', 'after', 'afterEach', 'beforeEach']
      },
      target: ['Gruntfile.js', '/*.js']
    },
    exec: {
      gitRev: {
        cmd: 'echo "{\\"current\\":\\"`git rev-parse HEAD`\\"}" > ./version.json'
      }
    },
  });
  grunt.registerTask('build', ['env:test', 'eslint']);
};
