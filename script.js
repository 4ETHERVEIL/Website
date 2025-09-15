// Fungsi escape HTML
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

// === GENERATE & STORE DEVICE ID ===
function getDeviceId() {
    let deviceId = localStorage.getItem('bugReporterDeviceId');
    if (!deviceId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        deviceId = 'device_' + timestamp.toString(36) + random;
        localStorage.setItem('bugReporterDeviceId', deviceId);
    }
    return deviceId;
}

// === KIRIM LAPORAN KE TELEGRAM ===
document.getElementById('bugForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const email = document.getElementById('email').value.trim(); // opsional
    const screenshot = document.getElementById('screenshot').files[0];

    if (!title || !description) {
        showError("Judul dan deskripsi wajib diisi!");
        return;
    }

    const deviceId = getDeviceId();

    const messageText = `
🚨 <b>LAPORAN BUG BARU!</b> 🚨

<b>Judul:</b> ${escapeHtml(title)}
<b>Deskripsi:</b> ${escapeHtml(description)}
${email ? `<b>Email:</b> ${escapeHtml(email)}<br>` : ''}
<b>Waktu:</b> ${new Date().toLocaleString()}
<i>ID Perangkat:</i> <code>${deviceId}</code>

⚠️ Admin: gunakan /reply ${deviceId} [pesan] untuk membalas.
`.trim();

    const botToken = "7236427363:AAFLfTCytn7K8dax5jHXUbL0YjHNfUxL6Lc";
    const adminChatId = "5984417495"; // ❗ GANTI DENGAN CHAT ID ANDA!

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: adminChatId,
                text: messageText,
                parse_mode: 'HTML'
            })
        });

        const result = await response.json();

        if (!result.ok) {
            throw new Error(result.description || 'Gagal mengirim ke Telegram');
        }

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
            \nID Perangkat Anda: <code>${deviceId}</code>
            \n\nAdmin akan membalas via Telegram. Balasan akan muncul otomatis di halaman ini.
        `);

        // Tampilkan ID perangkat di halaman
        document.getElementById('deviceIdDisplay').textContent = deviceId;
        document.getElementById('deviceInfo').style.display = 'block';

        // Reset form
        document.getElementById('bugForm').reset();
        document.getElementById('screenshot').value = '';

        // Mulai polling balasan
        startPollingReplies(deviceId);

    } catch (error) {
        showError(`❌ Gagal mengirim: ${error.message}`);
    }
});

// === AUTO-POLLING REPLY FROM replies.json ===
function startPollingReplies(deviceId) {
    const replyBox = document.getElementById('adminReply');
    const replyText = document.getElementById('replyText');
    const replyTime = document.getElementById('replyTime');

    const poll = async () => {
        try {
            const response = await fetch('replies.json', { cache: 'no-cache' }); // Hindari cache
            if (!response.ok) return;

            const replies = await response.json();

            // Cari balasan untuk ID perangkat ini
            const found = replies.find(r => r.to === deviceId && !r.read);

            if (found) {
                // Tandai sebagai sudah dibaca (opsional)
                found.read = true;

                // Update file (opsional — hanya jika Anda bisa tulis ke server)
                // Untuk frontend-only, kita biarkan saja — cukup tampilkan sekali

                replyText.innerHTML = escapeHtml(found.message).replace(/\n/g, '<br>');
                replyTime.textContent = `Dibalas pada: ${new Date(found.timestamp).toLocaleString()}`;
                replyBox.style.display = 'block';

                // Beri efek suara (opsional)
                const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YU9vT18=');
                audio.play().catch(() => {});

                // Hentikan polling setelah ditemukan
                clearInterval(pollInterval);
            }
        } catch (error) {
            // Abaikan error — misalnya file belum ada
        }
    };

    poll(); // Cek segera
    const pollInterval = setInterval(poll, 5000); // Cek tiap 5 detik
}

// === UTILITIES ===
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