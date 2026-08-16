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

// মেসেজ কত সেকেন্ড পর অটো-ডিলিট হবে (১০ মিনিট = ৬০০ সেকেন্ড)
const AUTO_DELETE_SECONDS = 600;

// গ্রুপে কেউ মেসেজ দিলে এটা চলবে
bot.on("message", async (msg) => {
  const text = msg.text?.trim().toLowerCase();
  if (!text || text.startsWith("/")) return;

  try {
    const snapshot = await db.collection("movies")
      .where("keywords", "array-contains", text)
      .limit(1)
      .get();

    // ================= মুভি পাওয়া যায়নি =================
    if (snapshot.empty) {
      bot.sendMessage(msg.chat.id,
`Movie 🍿 Not Found 🚫 
📨 Sᴇɴᴅ Mᴏᴠɪᴇ Oʀ Sᴇʀɪᴇs Nᴀᴍᴇ ᴀɴᴅ Yᴇᴀʀ Aꜱ Pᴇʀ Gᴏᴏɢʟᴇ Sᴘᴇʟʟɪɴɢ..!! 👍
𝐓𝐡𝐞𝐧 𝐈𝐟 𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐭𝐡𝐢𝐬 𝐦𝐨𝐯𝐢𝐞 𝐢 𝐚𝐦 𝐚𝐥𝐬𝐨 𝐩𝐫𝐨𝐯𝐢𝐝𝐞𝐝 🍿🍿🥰🥰 
𝐓𝐡𝐢𝐬 𝐁𝐨𝐭 𝐌𝐚𝐢𝐧𝐭𝐚𝐢𝐧 𝐁𝐲 
@arghadipde
Also Check My Website
🔗 [ARMOVIE26](https://armovie26.online)
Thank You For Using
This Bot.....`,
        { parse_mode: "Markdown", disable_web_page_preview: true }
      );
      return;
    }

    // ================= Movie Uoloaded... =================
    const movie = snapshot.docs[0].data();
    const sentMsg = await bot.sendPhoto(msg.chat.id, movie.poster, {
      caption: `🎬 *${movie.movieName}* (${movie.releaseYear})\n📂 ${movie.category} | 🎞 ${movie.quality}\n🗣 ${movie.language}\n\n👉 [Download Link](${movie.downloadUrl})\n\n⏳ *This link will be automatically deleted after 10 minutes. (auto-delete)*`,
      parse_mode: "Markdown"
    });

    // This link will be automatically deleted after 10 minutes.
    setTimeout(async () => {
      try {
        await bot.deleteMessage(sentMsg.chat.id, sentMsg.message_id);
      } catch (err) {
        console.error("Auto-delete failed (হয়তো ইউজার আগেই মুছে দিয়েছে):", err.message);
      }
    }, AUTO_DELETE_SECONDS * 1000);

  } catch (err) {
    console.error("Error:", err);
  }
});