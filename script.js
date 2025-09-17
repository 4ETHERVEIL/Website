document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('barangForm');
    const tableBody = document.querySelector('#barangTable tbody');
    let barangList = JSON.parse(localStorage.getItem('barangList')) || [];
    let nextId = parseInt(localStorage.getItem('nextId')) || 1;

    // Render data awal
    renderTable();

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const nama = document.getElementById('nama').value;
        const jumlah = document.getElementById('jumlah').value;
        const lokasi = document.getElementById('lokasi').value;

        if (!nama || !jumlah || !lokasi) return;

        const newItem = {
            id: nextId++,
            nama,
            jumlah: parseInt(jumlah),
            lokasi
        };

        barangList.push(newItem);
        saveData();
        renderTable();

        // Reset form
        form.reset();
        showToast('✅ Barang berhasil ditambahkan!');
    });

    function renderTable() {
        tableBody.innerHTML = '';

        if (barangList.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="padding:40px; color:#888; font-style:italic;">
                        📭 Belum ada data barang.
                    </td>
                </tr>
            `;
            return;
        }

        barangList.forEach((item, index) => {
            const row = document.createElement('tr');
            row.classList.add('row-enter');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${item.nama}</strong></td>
                <td>${item.jumlah}</td>
                <td>${item.lokasi}</td>
                <td>
                    <button class="btn-delete" data-id="${item.id}">🗑️ Hapus</button>
                </td>
            `;
            tableBody.appendChild(row);

            // Delay animasi agar tidak semua muncul bersamaan
            row.style.animationDelay = `${index * 0.1}s`;
        });

        // Event listener untuk tombol hapus
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                const row = this.closest('tr');
                
                row.classList.add('row-leave');
                setTimeout(() => {
                    barangList = barangList.filter(item => item.id !== id);
                    saveData();
                    renderTable();
                }, 500);
            });
        });
    }

    function saveData() {
        localStorage.setItem('barangList', JSON.stringify(barangList));
        localStorage.setItem('nextId', nextId);
    }

    // Toast notification
    function showToast(message) {
        let toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideInRight 0.4s ease, fadeOut 0.5s 2.5s forwards;
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Animasi tambahan
    document.head.insertAdjacentHTML('beforeend', `
        <style>
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                to { opacity: 0; transform: translateX(100%); }
            }
        </style>
    `);
});