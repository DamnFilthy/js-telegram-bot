const sequelize = require('./db'),
    {DataTypes} = require('sequelize');

const User = sequelize.define('user', {
    id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
    chatID: {type: DataTypes.STRING, unique: true},
    victory: {type: DataTypes.INTEGER, defaultValue: 0},
    defeat: {type: DataTypes.INTEGER, defaultValue: 0},
    totalGames: {type: DataTypes.INTEGER, defaultValue: 0},
    attempts:  {type: DataTypes.INTEGER, defaultValue: 0},
})

module.exports = User;