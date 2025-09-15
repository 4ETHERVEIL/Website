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

// === INISIALISASI FIREBASE ===
const firebaseConfig = {
    apiKey: "AIzaSyBdCjZkXwY7qVWvQrXlJzRmNnLdXoTcD0E",
    authDomain: "bug-reporter-xyz.firebaseapp.com",
    databaseURL: "https://bug-reporter-xyz-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bug-reporter-xyz",
    storageBucket: "bug-reporter-xyz.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// === KIRIM LAPORAN KE TELEGRAM ===
document.getElementById('bugForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const email = document.getElementById('email').value.trim();
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

⚠️ Admin: Klik tombol di bawah ini untuk membalas:
<a href="https://your-app.web.app/send-reply?device_id=${encodeURIComponent(deviceId)}">➡️ KLIK UNTUK BALAS</a>
`.trim();

    const botToken = "7236427363:AAFLfTCytn7K8dax5jHXUbL0YjHNfUxL6Lc";
    const adminChatId = "123456789"; // ❗ GANTI DENGAN CHAT ID ANDA!

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
            \n\nAdmin akan menerima link balasan di Telegram. Klik link itu untuk membalas.
        `);

        document.getElementById('deviceIdDisplay').textContent = deviceId;
        document.getElementById('deviceInfo').style.display = 'block';

        document.getElementById('bugForm').reset();
        document.getElementById('screenshot').value = '';

        // Mulai mendengarkan balasan dari Firebase
        listenForReplies(deviceId);

    } catch (error) {
        showError(`❌ Gagal mengirim: ${error.message}`);
    }
});

// === DENGARKAN BALASAN DI FIREBASE ===
function listenForReplies(deviceId) {
    const replyBox = document.getElementById('adminReply');
    const replyText = document.getElementById('replyText');
    const replyTime = document.getElementById('replyTime');

    const replyRef = db.ref('replies/' + deviceId);

    replyRef.on('value', (snapshot) => {
        const reply = snapshot.val();
        if (reply && reply.message) {
            replyText.innerHTML = escapeHtml(reply.message).replace(/\n/g, '<br>');
            replyTime.textContent = `Dibalas pada: ${new Date(reply.timestamp).toLocaleString()}`;
            replyBox.style.display = 'block';

            // Mainkan suara (opsional)
            const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YU9vT18=');
            audio.play().catch(() => {});
        }
    });
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