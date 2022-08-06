require('dotenv').config()

const token = process.env.TELEGRAM_TOKEN,
    TelegramAPI = require('node-telegram-bot-api'),
    bot = new TelegramAPI(token, {polling: true}),
    {gameOptions, restartOptions} = require('./options.js');

// Флаг процесса игры
let gameOver = false;

// Сохраняем ответы пользователя
const chats = {}

// Массив команд доступных пользователю
bot.setMyCommands([
    {command: '/start', description: 'Начальное приветствие'},
    {command: '/info', description: 'Информация о пользователе'},
    {command: '/game', description: 'Сыграть в игру'},
])

// Игровая логика
const gameStart = async (chatID) => {
    // При запуске игры, процесс обнуляется
    gameOver = false;
    // Генерируем рандомное число и сохраняем с id пользователя
    chats[chatID] = Math.floor(Math.random() * 10);
    await bot.sendMessage(chatID, 'Игра "Угадай рандомное число", от 0 до 9', gameOptions)
}

// Основной цикл диалога
bot.on('message', async msg => {
    const chatID = msg.chat.id;

    switch (msg.text) {
        case '/start':
            await bot.sendSticker(chatID, 'https://tlgrm.ru/_/stickers/ccd/a8d/ccda8d5d-d492-4393-8bb7-e33f77c24907/1.webp')
            return await bot.sendMessage(chatID, `Welcome pussy boy`);
        case '/info':
            return await bot.sendMessage(chatID, `Your name: ${msg.from.first_name} ${msg.from.last_name}`);
        case '/game':
            return gameStart(chatID)
        default:
            return await bot.sendMessage(chatID, 'Не распознанная команда');
    }
})

// Слушаем ответ по нажатию на кнопку
bot.on('callback_query', async msg => {
    const data = msg.data,
        chatID = msg.message.chat.id;

    // Если нажата кнопка перезапуска
    if (data === '/restart') {
        return gameStart(chatID)
    }

    // Если нажата кнопка числа
    if (+data !== chats[chatID] && !gameOver) {
        return await bot.sendMessage(chatID, 'Не угадал!')
    } else {
        if(gameOver){
            return await bot.sendMessage(chatID, 'Ты уже выиграл! начинай заново если хочешь', restartOptions)
        }
        gameOver = true
        await bot.sendSticker(chatID, 'https://tlgrm.ru/_/stickers/e65/38d/e6538d88-ed55-39d9-a67f-ad97feea9c01/12.webp')
        return await bot.sendMessage(chatID, 'Поздравляю! ты отгадал число.', restartOptions)
    }
})