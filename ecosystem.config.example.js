module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [

    // First application
    {
      name      : 'webshowcase',
      script    : 'index.js',
      env: {
        PORT:3028,
        COMMON_VARIABLE: 'true'
      },
      env_production : {
        PORT: 3028,
        NODE_ENV: 'production'
      }
    }
    //,

    // // Second application
    // {
    //   name      : 'WEB',
    //   script    : 'web.js'
    // }
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy : {
    production : {
      user : '{username}',
      host : '{yourhost}',
      ref  : 'origin/master',
      repo : 'https://github.com/Mutueye/WebShowcase.git',
      path : '{path}',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    },
    dev : {
      user : 'username',
      host : '{yourhost}',
      ref  : 'origin/master',
      repo : 'https://github.com/Mutueye/WebShowcase.git',
      path : '{path}',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env dev',
      env  : {
        NODE_ENV: 'dev'
      }
    }
  }
};
