require('dotenv').config({});

const {Api, TelegramClient, password} = require('telegram');
const {StringSession} = require('telegram/sessions');
const redisClient = require('./redis');
const {DAY} = require('time-constants');

const API_ID = parseInt(process.env.TELEGRAM_API_ID, 10);
const API_HASH = process.env.TELEGRAM_API_HASH;

function telegramClient(session = '') {
    const stringSession = new StringSession(session); // fill this later with the value from
    return new TelegramClient(stringSession, API_ID, API_HASH, {
        connectionRetries: 5,
    });
}

async function sendAuthCode(client, phone) {
    await client.connect();
    const {phoneCodeHash, isCodeViaApp} = await client.sendCode(
        {
            apiId: API_ID,
            apiHash: API_HASH,
        },
        phone
    );

    let key = `telegram-sign-in:${phone}`;
    await redisClient.set(key, phoneCodeHash, 'EX', DAY / 1000);  // Bu yerda set natijasini tekshirish

    return client;
}

async function authWithCode(client, phone, code) {
    await client.connect();
    let key = `telegram-sign-in:${phone}`;
    let phoneCodeHash = await redisClient.get(key);

    const {user} = await client.invoke(
        new Api.auth.SignIn({
            phoneNumber: phone,
            phoneCodeHash,
            phoneCode: code
        })
    );
    return {sessionToken: client.session.save(), user};
}

async function checkPassword(client, sendingPassword) {
    await client.connect();

    const request = await client.invoke(new Api.account.GetPassword());
    const passwordCheck = await password.computeCheck(request, sendingPassword)
    const result = await client.invoke(
        new Api.auth.CheckPassword({password: passwordCheck})
    );

    return {sessionToken: client.session.save(), user: result.user};
}

async function getHintPassword(client) {
    await client.connect();
    const passwordInformation = await client.invoke(new Api.account.GetPassword());
    return passwordInformation.hint;
}

function formatPassword(password) {
    const part1 = password.slice(0, 3); // Parolning birinchi 3 raqami
    const part2 = password.slice(3);    // Qolgan 2 raqam
    return `${part1} ${part2}`;
}

module.exports = {
    telegramClient,
    sendAuthCode,
    authWithCode,
    checkPassword,
    getHintPassword,
    formatPassword,
    Api
};