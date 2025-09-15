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

    // Buat ID unik untuk pengguna
    const userId = 'user_' + btoa(email + Date.now()).replace(/[+/=]/g, '').substring(0, 12);

    // Fungsi escape HTML untuk mencegah masalah parsing
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '<',
            '>': '>',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };
        return text.replace(/[&<>"'\/]/g, function (char) {
            return map[char];
        });
    }

    // Format pesan dalam HTML (lebih aman dari Markdown)
    const messageText = `
🚨 <b>LAPORAN BUG BARU!</b> 🚨

<b>Judul:</b> ${escapeHtml(title)}
<b>Deskripsi:</b> ${escapeHtml(description)}
<b>Email:</b> ${escapeHtml(email)}
<b>Waktu:</b> ${new Date().toLocaleString()}
<i>ID Pengguna:</i> <code>${userId}</code>

⚠️ Admin: gunakan /reply ${userId} [pesan] untuk membalas.
`.trim();

    const botToken = "7236427363:AAFLfTCytn7K8dax5jHXUbL0YjHNfUxL6Lc";
    const adminChatId = "123456789"; // ❗ GANTI DENGAN CHAT ID ANDA!

    try {
        // Kirim teks ke admin dengan parse_mode=HTML
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: adminChatId,
                text: messageText,
                parse_mode: 'HTML' // ✅ GUNAKAN HTML, BUKAN MARKDOWN
            })
        });

        const result = await response.json();

        if (!result.ok) {
            throw new Error(result.description || 'Gagal mengirim ke Telegram');
        }

        // Kirim screenshot jika ada
        if (screenshot) {
            const formData = new FormData();
            formData.append('chat_id', adminChatId);
            formData.append('caption', `📸 Screenshot dari laporan bug:\n${escapeHtml(title)}`);
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