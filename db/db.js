const {Sequelize} = require('sequelize');

module.exports = new Sequelize(
    'telegram_bot',
    'iphonemag_user',
    '1345685Aa',
    {
        host: 'localhost',
        port: '3306',
        dialect: 'mysql'
    }
)