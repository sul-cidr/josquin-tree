

module.exports = {

  livereload: {
    files: '<%= site %>/jrp/*',
    // files: '<%= site %>/*',
    options: { livereload: true }
  },

  templates: {
    files: ['src/templates/*'],
    tasks: 'jade'
  },

  stylesheets: {
    files: 'src/stylesheets/*',
    tasks: 'less'
  }

};
