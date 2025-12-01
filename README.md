# Secure Chat Application - Tugas Besar 1 IF4020 Kriptografi

Aplikasi chat berbasis web yang mengimplementasikan **End-to-End Encryption (E2E)**, **Digital Signature (ECDSA)**, dan **Integrity Hash (SHA-3)** untuk menjamin kerahasiaan, autentikasi pengirim, serta integritas pesan secara *real-time*.

Dibuat untuk memenuhi Tugas Besar 1 mata kuliah IF4020 Kriptografi.

## 👥 Identitas Pembuat

| NIM | Nama | Peran Utama |
| :--- | :--- | :--- |
| 18221005 | Nicholas Francis Aditjandra | **Identity & Auth** (Key Management, Login Flow) |
| 13522008 | Ahmad Farid Mudrika | **Communication** (WebSocket/Transport, Database) |
| 13522016 | Zachary Samuel Tobing | **Security Core** (Crypto Implementation, Integrity Check), **Frontend Pages** |

## ✨ Daftar Fitur

### Fitur Utama
* **Registrasi Aman:** Pembangkitan pasangan kunci (*Key Pair*) ECDSA dilakukan secara lokal di browser. Private key disimpan di `localStorage` dan tidak pernah dikirim ke server.
* **Login Challenge-Response:** Autentikasi tanpa mengirim password, melainkan menggunakan tanda tangan digital terhadap *nonce* acak dari server.
* **Real-time Chat:** Pengiriman pesan instan antar pengguna.
* **Manajemen Kontak:** Menambah dan memilih lawan bicara.

### Fitur Keamanan (Kriptografi)
* 🔒 **End-to-End Encryption (E2E):** Pesan dienkripsi menggunakan **ECC (Elliptic Curve Cryptography)**. Hanya penerima yang memegang Private Key yang dapat membaca pesan.
* ✍️ **Digital Signature:** Setiap pesan ditandatangani menggunakan **ECDSA** untuk menjamin keaslian pengirim (Non-repudiation).
* 🛡️ **Integrity Check:** Menggunakan **SHA-3** untuk memastikan pesan tidak dimodifikasi di tengah jalan (*Tamper-proof*).
* ✅ **Verifikasi Otomatis:**
    * **Sisi Server:** Middleware menolak pesan jika Hash tidak cocok dengan Signature.
    * **Sisi Client:** UI menampilkan status "✅ Verified" atau "❌ Unverified" pada setiap pesan.

## 🛠️ Teknologi yang Digunakan (Tech Stack)

* **Frontend:** React, TypeScript, Tailwind CSS, Vite.
* **Backend:** Go (Golang) dengan Framework **Fiber**.
* **Database:** SQLite (Embedded, tanpa instalasi server tambahan).
* **Library Kriptografi:**
    * TS: `elliptic` (ECDSA), `js-sha3` (Hashing), `eciesjs` (Encryption).
    * Go: `crypto/ecdsa`, `crypto/sha3`.

## 🚀 Tata Cara Menjalankan Program

Pastikan Anda telah menginstall **Go (v1.20+)** dan **Node.js (v18+)** pada komputer Anda.

### 1. Menjalankan Backend (Server)
Buka terminal dan arahkan ke folder `backend`:

```
cd backend

# Install dependencies
go mod tidy

# Jalankan server
go run cmd/main.go
```

_Server akan berjalan pada port default (misal: http://localhost:8080)._

### 2. Menjalankan Frontend (Client)
Buka terminal dan arahkan ke folder `frontend`:

```
cd frontend

# Install dependencies
npm install

# Jalankan mode development
npm run dev
```

_Akses aplikasi melalui browser pada alamat yang muncul (biasanya http://localhost:5173)._

_Disclaimer: Aplikasi ini dibuat untuk tujuan pendidikan. Implementasi penyimpanan Private Key di Local Storage memiliki risiko keamanan tersendiri jika diterapkan pada produksi nyata tanpa pengamanan tambahan._
