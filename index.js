require('dotenv').config()

const token = process.env.TELEGRAM_TOKEN,
    TelegramAPI = require('node-telegram-bot-api'),
    bot = new TelegramAPI(token, {polling: true}),
    {gameOptions, restartOptions} = require('./options.js'),
    sequelize = require('./db/db'),
    User = require('./db/models');

const start = async () => {
    try {
        // Подключение и синхронизация с БД
        await sequelize.authenticate()
        await sequelize.sync()

        // Флаг процесса игры
        let gameOver = false,
            gameCounter = 3,
            currentCounter = 0;

        // Сохраняем ответы пользователя
        const chats = {}

        // Массив команд доступных пользователю
        bot.setMyCommands([
            {command: '/start', description: 'Начать'},
            {command: '/info', description: 'Статистика пользователя'},
            {command: '/game', description: 'Сыграть в игру'},
        ])

        // Игровая логика
        const gameStart = async (chatID) => {
            const user = await User.findOne({where: {chatID: chatID}})
            user.totalGames += 1
            await user.save();
            // При запуске игры, процесс обнуляется
            gameOver = false;
            gameCounter = 3;
            currentCounter = 0;

            // Генерируем рандомное число и сохраняем с id пользователя
            chats[chatID] = Math.floor(Math.random() * 10);
            await bot.sendMessage(chatID, 'Игра угадай число, от 0 до 9 (у тебя 3 попытки)', gameOptions)
        }

        // Основной цикл диалога
        bot.on('message', async msg => {
            const chatID = msg.from.id;

            const findUser = await User.findOne({where: {chatID: chatID}})
            if (!findUser) await User.create({chatID})

            try {
                switch (msg.text) {
                    case '/start':
                        await bot.sendSticker(chatID, 'https://tlgrm.ru/_/stickers/ccd/a8d/ccda8d5d-d492-4393-8bb7-e33f77c24907/1.webp')
                        return await bot.sendMessage(chatID, `Welcome pussy boy`);
                    case '/info':
                        const user = await User.findOne({where: {chatID: chatID}})
                        return await bot.sendMessage(chatID, `Пользователь: ${msg.from.first_name} ${msg.from.last_name}, Побед: ${user?.victory}, Поражений: ${user?.defeat}, Всего игр: ${user?.totalGames}, Всего попыток: ${user?.attempts}`);
                    case '/game':
                        return gameStart(chatID)
                    default:
                        return await bot.sendMessage(chatID, 'Не распознанная команда');
                }
            } catch (error) {
                console.log(error)
                return await bot.sendMessage(chatID, 'Произошла ошибка ', error);
            }
        })

        // Слушаем ответ по нажатию на кнопку
        bot.on('callback_query', async msg => {
            const data = msg.data,
                chatID = msg.from.id;
            try {
                const user = await User.findOne({where: {chatID: chatID}})
                // Если нажата кнопка статистики
                if (data === '/info') {
                    return await bot.sendMessage(chatID, `Пользователь: ${msg.from.first_name} ${msg.from.last_name}, Побед: ${user?.victory}, Поражений: ${user?.defeat}, Всего игр: ${user?.totalGames}, Всего попыток: ${user?.attempts}`);
                }

                // Если нажата кнопка перезапуска
                if (data === '/restart') {
                    return gameStart(chatID)
                }

                // Если нажата кнопка числа
                if (+data !== chats[chatID] && !gameOver) {
                    user.attempts += 1
                    await user.save();
                    currentCounter += 1;
                    if (currentCounter === gameCounter) {
                        user.defeat += 1
                        await user.save();
                        gameOver = true
                        await bot.sendSticker(chatID, 'https://tlgrm.ru/_/stickers/ccd/a8d/ccda8d5d-d492-4393-8bb7-e33f77c24907/9.webp')
                        return await bot.sendMessage(chatID, 'Ты проиграл! Очень жаль. Сыграй еще если хочешь', restartOptions)
                    } else return await bot.sendMessage(chatID, `Не угадал! у тебя осталось ${gameCounter - currentCounter} попыток`)
                } else {
                    if (gameOver) {
                        if (currentCounter === gameCounter) {
                            return await bot.sendMessage(chatID, 'Ты проиграл и этого не изменить, сыграй еще если хочешь', restartOptions)
                        } else return await bot.sendMessage(chatID, 'Ты уже выиграл! начинай заново если хочешь', restartOptions)
                    }
                    gameOver = true
                    user.attempts += 1
                    user.victory += 1
                    await user.save();
                    await bot.sendSticker(chatID, 'https://tlgrm.ru/_/stickers/e65/38d/e6538d88-ed55-39d9-a67f-ad97feea9c01/12.webp')
                    return await bot.sendMessage(chatID, 'Поздравляю! ты отгадал число.', restartOptions)
                }
            } catch (error) {
                return await bot.sendMessage(chatID, 'Произошла ошибка ', error);
            }
        })
    } catch (e) {
        console.log('Error: ', e)
    }
}

start()