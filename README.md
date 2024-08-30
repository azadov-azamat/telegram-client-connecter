# Telegram autentifikatsiya moduli

Ushbu modul `telegram` kutubxonasidan foydalanib, Telegram orqali autentifikatsiya qilish uchun funksiyalarni taqdim etadi. Unda autentifikatsiya kodlarini yuborish va tasdiqlash, ikki faktorli autentifikatsiya (2FA) bilan ishlash va Telegram sessiyalarini boshqarish uchun usullar mavjud.

## Talablar

Ushbu moduldan foydalanishdan oldin quyidagilarga ega ekanligingizga ishonch hosil qiling:

- **Node.js** tizimingizga o'rnatilgan bo'lishi kerak.
- **Redis serveri** ishlayotgan bo'lishi kerak, vaqtinchalik ma'lumotlarni, masalan, telefon kodi xeshlarini saqlash uchun.
- Telegram API ma'lumotlarini o'z ichiga olgan **`.env` fayli** mavjud bo'lishi kerak.

### Muhit o'zgaruvchilari

`.env` faylingizda quyidagi muhit o'zgaruvchilari mavjud ekanligiga ishonch hosil qiling:

```plaintext
TELEGRAM_API_ID=your_telegram_api_id
TELEGRAM_API_HASH=your_telegram_api_hash
```
Bu yerda `your_telegram_api_id` va `your_telegram_api_hash` o'rniga sizning haqiqiy Telegram API ma'lumotlaringiz bo'lishi kerak, bu ma'lumotlarni my.telegram.org saytida olishingiz mumkin.

# O'rnatish

1. **Repodan nusxa oling:**

   ```bash
   git clone https://github.com/your-repo/telegram-auth-module.git
   cd telegram-auth-module

2. **Bog'liqliklarni o'rnating:**

   ```bash
   yarn install

3. Redis serveringizni ishga tushiring agar u hali ishlayotgan bo'lmasa. Bu modul vaqtinchalik ma'lumotlarni saqlash uchun Redisdan foydalanadi.

4. `.env` faylini yarating va Telegram API ma'lumotlaringizni qo'shing.

# Foydalanish
Ushbu modul Telegram API bilan autentifikatsiyani amalga oshirish uchun bir nechta funksiyalarni taqdim etadi. Quyida har bir funksiyadan qanday foydalanish bo'yicha yo'riqnoma keltirilgan.

## Modulni import qilish
Avval, kerakli funksiyalarni moduldan import qilish kerak:

```bash
const {
    telegramClient,
    sendAuthCode,
    authWithCode,
    checkPassword,
    getHintPassword,
    formatPassword,
    Api
} = require('./path_to_your_module');
```

1. **telegramClient(session = '')**
Bu funksiya yangi Telegram klient instansiyasini yaratadi. Agar oldingi sessiyani tiklash uchun sessiya satrini uzatsangiz, uni qayta tiklashingiz mumkin.
```bash
const client = telegramClient();  // Yangi klient yaratish
```
2. **sendAuthCode(client, phone)**
Bu funksiya berilgan telefon raqamiga autentifikatsiya kodini yuboradi. Kod Redisda telefon raqamiga asoslangan kalit bilan saqlanadi.
```bash
await sendAuthCode(client, '+998901234567');  // Belgilangan telefon raqamiga kod yuborish
```
3. **authWithCode(client, phone, code)**
Bu funksiya foydalanuvchini telefon raqami va yuborilgan autentifikatsiya kodi yordamida tasdiqlaydi. Agar muvaffaqiyatli bo'lsa, sessiya tokeni va foydalanuvchi ma'lumotlarini qaytaradi.
```bash
const {sessionToken, user} = await authWithCode(client, '+998901234567', '12345');  // Foydalanuvchini tasdiqlash
```
4. **checkPassword(client, sendingPassword)**
Bu funksiya ikki faktorli autentifikatsiya (2FA) bilan ishlaydi, ya'ni foydalanuvchi kiritgan parolni tekshiradi. Bu foydalanuvchining Telegram akkauntida 2FA yoqilgan bo'lsa, talab qilinadi.
```bash
const {sessionToken, user} = await checkPassword(client, 'your_password');  // 2FA parolini tekshirish
```
5. **getHintPassword(client)**
Bu funksiya 2FA yoqilgan akkauntlar uchun Telegram tomonidan taqdim etilgan parol eslatmasini (hint) oladi. Bu foydalanuvchiga parolini eslatish uchun foydali
```bash
const hint = await getHintPassword(client);  // Parol eslatmasini olish
```
6. **formatPassword(password)**
Bu yordamchi funksiya parolni o'qilishi osonroq bo'lgan formatga keltiradi. U parolning dastlabki 3 ta belgisi bilan oxirgi 2 ta belgisini ajratib ko'rsatadi.
  ```bash
const formattedPassword = formatPassword('12345');  // Parolni '123 45' tarzida formatlash
```

##Misol Workflow
Quyida Telegram orqali foydalanuvchini autentifikatsiya qilish uchun ushbu funksiyalarni qanday birlashtirish mumkinligi haqida misol keltirilgan:
```bash
const client = telegramClient();

try {
    // Foydalanuvchining telefoniga autentifikatsiya kodini yuboring
    await sendAuthCode(client, '+998901234567');

    // Foydalanuvchi kodni kiritishini kuting va tasdiqlang
    const {sessionToken, user} = await authWithCode(client, '+998901234567', '12345');

    console.log('Tasdiqlangan foydalanuvchi:', user);
    console.log('Sessiya tokeni:', sessionToken);

    // Agar 2FA yoqilgan bo'lsa, parol eslatmasini so'rang
    const hint = await getHintPassword(client);
    console.log('Parol eslatmasi:', hint);

    // Agar kerak bo'lsa, parolni tekshiring
    const {sessionToken: newSessionToken, user: newUser} = await checkPassword(client, 'your_password');
    console.log('Parol bilan tasdiqlangan foydalanuvchi:', newUser);
    console.log('Yangi sessiya tokeni:', newSessionToken);

} catch (error) {
    console.error('Autentifikatsiya jarayonida xatolik:', error);
}
```
