document.getElementById('bugForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const email = document.getElementById('email').value.trim() || 'tidak_diketahui@example.com';
    const screenshot = document.getElementById('screenshot').files[0];

    if (!title || !description) {
        showError("Judul dan deskripsi wajib diisi!");
        return;
    }

    // Buat ID unik untuk pengguna (berdasarkan email + waktu)
    const userId = 'user_' + btoa(email + Date.now()).replace(/[+/=]/g, '').substring(0, 12);

    // Format pesan ke admin
    const messageText = `
🚨 *LAPORAN BUG BARU!* 🚨

*Judul:* ${encodeURIComponent(title)}
*Deskripsi:* ${encodeURIComponent(description)}
*Email:* ${encodeURIComponent(email)}
*Waktu:* ${new Date().toLocaleString()}
*ID Pengguna:* \`${userId}\`

⚠️ Gunakan /reply ${userId} [pesan] untuk membalas di Telegram.
`.trim();

    // Token bot Anda
    const botToken = "7236427363:AAFLfTCytn7K8dax5jHXUbL0YjHNfUxL6Lc";
    const adminChatId = "5984417495"; // ❗ GANTI DENGAN CHAT ID ANDA!

    try {
        // Kirim teks ke admin
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: adminChatId,
                text: messageText,
                parse_mode: 'Markdown'
            })
        });

        const result = await response.json();

        if (!result.ok) {
            throw new Error(result.description || 'Gagal mengirim ke Telegram');
        }

        // Jika ada screenshot, kirim sebagai foto
        if (screenshot) {
            const formData = new FormData();
            formData.append('chat_id', adminChatId);
            formData.append('caption', `📸 Screenshot dari laporan bug:\n${title}`);
            formData.append('photo', screenshot);

            await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
                method: 'POST',
                body: formData
            });
        }

        showSuccess(`
            ✅ Laporan berhasil dikirim!
            \nID Anda: <code>${userId}</code>
            \n\nAdmin akan membalas via Telegram.
            \nPastikan Anda sudah chat @BugReporterBot terlebih dahulu.
        `);

        // Reset form
        document.getElementById('bugForm').reset();
        document.getElementById('screenshot').value = '';

    } catch (error) {
        showError(`❌ Gagal mengirim: ${error.message}`);
    }
});

function showSuccess(message) {
    const resultDiv = document.getElementById('result');
    resultDiv.className = 'success';
    resultDiv.innerHTML = message.replace(/<code>(.*?)<\/code>/g, '<span style="background:#eee; padding:2px 6px; border-radius:4px; font-family:monospace;">$1</span>');
    resultDiv.style.display = 'block';

    setTimeout(() => {
        resultDiv.style.display = 'none';
    }, 8000);
}

function showError(message) {
    const resultDiv = document.getElementById('result');
    resultDiv.className = 'error';
    resultDiv.textContent = message;
    resultDiv.style.display = 'block';

    setTimeout(() => {
        resultDiv.style.display = 'none';
    }, 5000);
}