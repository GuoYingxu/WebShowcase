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
      user : 'guoyingxu',
      host : '47.92.100.38',
      ref  : 'origin/master',
      repo : 'https://github.com/GuoYingxu/WebShowcase.git',
      path : '/data/pm2deploy/production/webshowcase',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    },
    dev : {
      user : 'guoyingxu',
      host : '47.92.100.38',
      ref  : 'origin/master',
      repo : 'https://github.com/GuoYingxu/WebShowcase.git',
      path : '/data/pm2deploy/develop/webshowcase',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env dev',
      env  : {
        NODE_ENV: 'dev'
      }
    }
  }
};
