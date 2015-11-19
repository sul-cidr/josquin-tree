

module.exports = {

  options: {

    transform: [

      ['babelify', {
        presets: ['es2015', 'stage-1']
      }],

    ],

    watch: true,

    browserifyOptions: {
      debug: true
    }

  },

  dist: {
    src: 'src/javascripts/index.js',
    dest: '<%= site %>/script.js'
  }

};
