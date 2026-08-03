require("dotenv").config();
const admin = require("firebase-admin");
const TelegramBot = require("node-telegram-bot-api");

// Firebase কানেক্ট করা
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Telegram বট শুরু করা
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

console.log("Bot চালু হয়ে গেছে...");

// গ্রুপে কেউ মেসেজ দিলে এটা চলবে
bot.on("message", async (msg) => {
  const text = msg.text?.trim().toLowerCase();
  if (!text || text.startsWith("/")) return;

  try {
    const snapshot = await db.collection("movies")
      .where("keywords", "array-contains", text)
      .limit(1)
      .get();

    if (snapshot.empty) {
      bot.sendMessage(msg.chat.id, `"${msg.text}" পাওয়া যায়নি ❌`);
      return;
    }

    const movie = snapshot.docs[0].data();
    bot.sendPhoto(msg.chat.id, movie.poster, {
      caption: `🎬 *${movie.movieName}* (${movie.releaseYear})\n📂 ${movie.category} | 🎞 ${movie.quality}\n🗣 ${movie.language}\n\n👉 [Download Link](${movie.downloadUrl})`,
      parse_mode: "Markdown"
    });
  } catch (err) {
    console.error("Error:", err);
  }
});