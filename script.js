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
        // Buat ID unik dari timestamp + random string
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

    const deviceId = getDeviceId(); // ✅ Ambil ID perangkat dari localStorage
    document.getElementById('checkId').value = deviceId; // Tampilkan di form cek balasan

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
            \n\nAdmin akan membalas via Telegram.<br>
            Setelah itu, klik tombol “Cek Balasan” untuk melihat jawabannya.
        `);

        document.getElementById('bugForm').reset();
        document.getElementById('screenshot').value = '';

    } catch (error) {
        showError(`❌ Gagal mengirim: ${error.message}`);
    }
});

// === CEK BALASAN BERDASARKAN ID PERANGKAT ===
document.getElementById('checkBtn').addEventListener('click', async function() {
    const deviceId = getDeviceId(); // Ambil ID perangkat dari localStorage
    document.getElementById('checkId').value = deviceId; // Pastikan selalu terisi

    const replyResult = document.getElementById('replyResult');
    replyResult.innerHTML = "⏳ Memuat balasan...";
    replyResult.style.display = "block";

    try {
        const response = await fetch('replies.json');
        if (!response.ok) throw new Error("File replies.json tidak ditemukan atau belum diperbarui.");

        const replies = await response.json();

        // Cari balasan berdasarkan ID perangkat
        const found = replies.find(r => r.to === deviceId);

        if (found) {
            replyResult.innerHTML = `
                <strong>💬 Balasan dari Admin:</strong>
                <p style="margin: 10px 0; padding: 10px; background: #f0f7ff; border-radius: 6px; border-left: 4px solid #667eea;">
                    ${escapeHtml(found.message).replace(/\n/g, '<br>')}
                </p>
                <small style="color: #777;">Dibalas pada: ${new Date(found.timestamp).toLocaleString()}</small>
            `;
        } else {
            replyResult.innerHTML = `
                <p>🔍 Belum ada balasan untuk ID perangkat Anda:<br>
                <code>${deviceId}</code></p>
                <p>Admin mungkin belum membalas, atau belum memperbarui file <code>replies.json</code>.</p>
            `;
        }
    } catch (error) {
        replyResult.innerHTML = `
            <p style="color: #d32f2f;">⚠️ Gagal memuat balasan: ${error.message}</p>
            <p><strong>Pastikan:</strong><br>
            1. File <code>replies.json</code> ada di folder yang sama<br>
            2. File itu berisi data dalam format JSON<br>
            3. Server/web hosting Anda mendukung akses ke file statis</p>
        `;
    }
});

// === INISIALISASI: Isi ID perangkat saat halaman dimuat ===
window.addEventListener('load', function() {
    const deviceId = getDeviceId();
    document.getElementById('checkId').value = deviceId;
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