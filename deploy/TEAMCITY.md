# CI/CD Vitis — TeamCity Dev

Target: TeamCity dan Vitis di **10.100.0.143**. TeamCity yang terpasang adalah **2024.12.2**, agent `teamcity-agent` memakai Docker rootless, dan deploy dilakukan melalui broker Unix socket `/run/tectona-ci-deploy/control.sock`. Pipeline default mengikuti mekanisme ini; agent tidak memerlukan akses Docker host atau SSH private key.

Alur: push default branch → Build image → artifact TeamCity → Deploy lewat broker → health check container. URL Vitis: `http://10.100.0.143:5182`. Deploy ini mencakup frontend dan reverse proxy saja; backend harus sudah berjalan.

## File utama

- `.teamcity/settings.kts`: Kotlin DSL 2024.12, konfigurasi Build dan Deploy, snapshot dependency dan artifact `sameChain()`.
- `scripts/teamcity/build.sh`: `npm ci` dan Vite build di Node 22; menghasilkan `vitis-image.tar`, `image.ref`, `image.id`, `SHA256SUMS` di `ci-out`. `image.id` berisi config digest portabel, dihitung dari stream `docker save` agar kompatibel dengan Docker containerd dan overlay2 serta Docker CLI agent yang berbeda versi.
- `scripts/teamcity/deploy-broker.sh`: verifikasi checksum dan image ID, load image ke builder, panggil broker dengan alias tetap `vitis` dan tag unik `tc-<build-id>`.
- `scripts/teamcity/deploy.sh`: alternatif deploy langsung untuk operator atau agent native dengan akses Docker runtime.
- `scripts/teamcity/register-broker.py`: bootstrap operator untuk mendaftarkan Vitis ke broker setelah container pertama sehat. Tidak dijalankan oleh CI.

## 1. Bootstrap operator pada server

Gunakan SSH key lokal yang sudah tersedia:

```powershell
ssh -i C:\Users\10088341\.ssh\tectona_deploy aiadmf@10.100.0.143
```

Persyaratan: Bash, Docker Engine, Compose dengan `up --wait --wait-timeout`, `flock`, `sha256sum`, curl, Python 3.9+, dan akses administratif untuk bootstrap. Jangan memasang Docker socket host ke agent yang sekarang menggunakan builder rootless.

Dari checkout repository pada server, siapkan konfigurasi operator:

```bash
sudo bash scripts/teamcity/setup-server.sh aiadmf /opt/vitis
# Tinjau port/bind address dan URL backend.
nano /opt/vitis/server.env
# Manifest persisten dipakai oleh broker; salin dari checkout yang ditinjau.
cp deploy/compose.teamcity.yaml /opt/vitis/compose.yaml
```

`setup-server.sh` mempertahankan `server.env` yang sudah ada. Default frontend port 5182; pastikan port kosong. `host.docker.internal` pada container mengarah ke Docker host. Backend harus menerima koneksi dari jaringan Docker. Origin upstream tidak boleh memiliki path atau trailing slash.

Build pertama dapat dijalankan oleh operator dengan builder rootless yang sama:

```bash
export DOCKER_HOST=unix:///var/lib/tectona-ci-builder-runtime/docker.sock
export VITIS_BUILD_ID=2026110301 # ganti dengan ID numerik unik
bash scripts/teamcity/build.sh
mkdir -p ci-in
cp ci-out/vitis-image.tar ci-out/image.ref ci-out/image.id ci-out/SHA256SUMS ci-in/
# Deploy pertama menggunakan Docker runtime host.
unset DOCKER_HOST
bash scripts/teamcity/deploy.sh
sudo python3 scripts/teamcity/register-broker.py
```

Broker memerlukan container awal untuk menyimpan konfigurasi dan menyediakan image rollback. Registrasi hanya menambah alias `vitis`, mempertahankan entri lain, menyimpan backup registry, dan restart broker. Jalankan saat tidak ada deployment broker lain aktif. Setelah registrasi, pipeline menggunakan `deploy-broker.sh`.

## 2. Import konfigurasi TeamCity

1. Commit dan push `.teamcity/`, `Dockerfile`, `.dockerignore`, `.gitattributes`, `deploy/`, `scripts/teamcity/`, `.gitignore`, serta perubahan aplikasi yang ingin dirilis. File pipeline lokal belum tersedia pada checkout Git server sampai di-push. Jangan commit `.env` lokal, key SSH, `deploy/server.env`, atau `deploy/frontend.env`.
2. Buat project dari `https://github.com/AlfaIrawan/react-vitis.git`, default branch `refs/heads/master`. Checkout root harus repository `react-vitis` ini.
3. Aktifkan **Versioned Settings**, format **Kotlin**, direktori `.teamcity`, lalu **Load project settings from VCS**. DSL memakai `DslContext.settingsRoot`.
4. Tambahkan parameter berikut ke `conf/buildAgent.properties` agent `teamcity-agent`, lalu tunggu agent mengirim ulang parameter ke server. Bila belum terdeteksi, restart agent saat idle:

   ```properties
   vitis.build=true
   vitis.deploy=true
   vitis.target=10.100.0.143
   ```

5. Pastikan agent authorized/connected dan socket broker yang sudah ada tetap di-mount. Tidak diperlukan mount `/opt/vitis` pada agent untuk mode broker.
6. Jalankan **Vitis - Deploy server** untuk menjalankan seluruh chain. Trigger VCS hanya berada pada Deploy, sehingga satu perubahan tidak memicu dua Build terpisah. Hanya default branch yang memicu deployment.

Untuk deploy manual, hapus trigger VCS pada `VitisDeploy`; jika CI tetap otomatis diinginkan, pindahkan trigger ke `VitisBuild`. Jangan mengaktifkan trigger otomatis sebelum file pipeline tersedia di Git dan bootstrap broker selesai.

Build memerlukan Docker daemon builder dan platform CPU yang sama dengan runtime. Node lokal tidak diperlukan. Build Vite wajib lulus. `env.VITIS_RUN_TYPECHECK=false` karena aplikasi saat ini masih memiliki error TypeScript; ubah menjadi `true` setelah diperbaiki. Lint belum menjadi gate.

Frontend memakai konfigurasi publik `deploy/frontend.env.example`. Override melalui parameter Build `env.VITIS_FRONTEND_ENV_FILE` berisi path file pada agent. Semua `VITE_*` masuk bundle browser; jangan berisi secret. `.env` developer tidak dipakai pipeline.

## 3. Verifikasi dan rollback

```bash
curl --fail http://127.0.0.1:5182/healthz
curl --fail http://127.0.0.1:5182/
docker compose --project-name vitis --env-file /opt/vitis/server.env \
  -f /opt/vitis/compose.yaml ps
# Verifikasi registrasi dari agent tanpa mengganti service:
docker exec teamcity-agent curl --fail --silent --show-error \
  --unix-socket /run/tectona-ci-deploy/control.sock \
  -H 'Content-Type: application/json' \
  --data '{"service":"vitis","dry_run":true}' http://localhost/deploy
```

Untuk perintah Compose operator, set `export VITIS_IMAGE=$(cat /opt/vitis/current-image)` terlebih dahulu. `current-image` dicatat oleh deploy langsung saat bootstrap, bukan oleh broker pada setiap rilis. Untuk image runtime terkini gunakan `docker inspect vitis-web-1 --format '{{.Config.Image}}'`.

Broker menyerialisasi deployment dan memakai Compose config operator yang tetap. Jika rollout atau health check gagal, broker mencoba mengembalikan image container sebelumnya dan memberi respons gagal. Broker saat ini belum memverifikasi keberhasilan rollback; operator perlu memeriksa service setelah kegagalan. Rollback ini mencakup image, bukan perubahan konfigurasi operator. Deploy langsung alternatif memverifikasi health rollback dan memakai `flock`.

Health check menguji Nginx `/healthz`, bukan login atau seluruh backend. Uji login dan workflow setelah deploy pertama. Sediakan HTTPS untuk penggunaan login/passkey. Recreate container dapat menimbulkan downtime singkat.

Image/tag lama serta artifact TeamCity perlu disimpan untuk rollback. Jangan menjalankan image prune otomatis. Retention artifact harus mencakup rilis yang ingin disimpan. Rilis lama dapat dipilih sebagai snapshot dependency saat custom build Deploy; hindari menjalankan chain lama bersama deploy baru.

## 4. Validasi script

```bash
bash -n scripts/teamcity/build.sh scripts/teamcity/deploy.sh \
  scripts/teamcity/deploy-broker.sh scripts/teamcity/setup-server.sh
bash scripts/teamcity/test-deploy.sh
```

Test deploy langsung memakai mock Docker untuk alur sukses, rollback, kegagalan deploy pertama, dan artifact korup. Validasi broker memerlukan server yang sudah di-bootstrap. Kotlin DSL perlu diimpor pada TeamCity agar kompilasi konfigurasi diverifikasi oleh server.

Referensi: [Kotlin DSL](https://www.jetbrains.com/help/teamcity/kotlin-dsl.html), [Versioned Settings](https://www.jetbrains.com/help/teamcity/storing-project-settings-in-version-control.html), [artifact dependencies](https://www.jetbrains.com/help/teamcity/artifact-dependencies.html).
