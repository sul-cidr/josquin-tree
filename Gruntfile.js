

module.exports = function(grunt) {

  // var brfs = require('brfs');

  require('time-grunt')(grunt);
  require('jit-grunt')(grunt);

  require('load-grunt-config')(grunt, {
    loadGruntTasks: false,
    // data: { site: '_site/jrp' }
    data: { site: '_site' }
  });

};
