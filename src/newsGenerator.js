export const generateNews = () => {
    const news = [
        "Новина дня: Express.js продовжує набирати популярність!",
        "Нова технологія змінює світ: дізнайтеся більше про Nodemailer.",
        "Програмування – шлях до успіху у сучасному світі!"
    ];
    const randomIndex = Math.floor(Math.random() * news.length);
    return news[randomIndex];
};