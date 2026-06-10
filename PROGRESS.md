# GymRush — Build İlerlemesi

## Sıradaki task (buradan devam et)
**Config altyapısı + Gym Level/Slot sistemi.** Bu oturumda büyük bir tasarım genişlemesi yapıldı (bkz. GDD §3a, §6, §7b–§7e, §14). Artık koda geçişin doğal ilk adımı, tüm denge sayılarını tek kaynağa toplamak ve gym level/slot iskeletini kurmak — neredeyse her sistem buna dayanıyor:
- `src/config/balance.js` oluştur — GDD §14'teki TÜM sayıları buraya taşı (zaman, slot kapasiteleri, gym level maliyetleri, makine ekonomisi, tier çarpanları, locker room, personel, rating, vip, müşteri akışı). **GDD §14, balance.js'in insan-okunur kopyasıdır; tek doğruluk kaynağı config.**
- Mevcut hard-coded değerleri (START_MONEY=500, fee'ler, SPAWN_INTERVAL=8, useDuration'lar) config'ten okuyacak şekilde refactor et.
- Gym Level state'i (1–5) + slot kapasitesi level'a bağlı; yeni slot'lar **boş** gelir.
- Görsel öğeler (zemin boyutu, slot yerleşimi) config slot tablosundan türetilmeli.

**Daha sonra (bu tasarımın diğer parçaları):** Rating sistemi (§7b), gün sayacı (§3a), VIP müşteriler (§6), yönetim terminali UI (§7d), personel (§7e). Eski bekleyen task **oyuncu etkileşimi (tamir & stok)** hâlâ geçerli ama artık config/level sisteminden sonra gelmeli.

---

## Tasarım fazı — İlerleme & ekonomi sistemi (GDD'ye işlendi) ✅

Bu oturumda kod yazmadan büyük bir tasarım turu yapıldı. Tüm kararlar GDD'ye işlendi:
- **§3a Soyut gün sayacı** — ≈90 sn muhasebe birimi, ışık değişmez, oyun durmaz, gün sonu toast
- **§6 VIP/Influencer** — rating'e bağlı, görsel belirtilir, 3 yöne çarpan (bahşiş + rating + düşük sabır)
- **§7 Ekonomi** — iki katmanlı ilerleme: Gym Level (renovasyon) vs level-içi satın almalar
- **§7b Rating (1–5 yıldız)** — yavaş/sönümlü, davranışsal, level'dan bağımsız; trafik + VIP olasılığı + bonus
- **§7c Gym Level 1–5** — sadece para, iki kapılı açılım (level → satın alınabilir → para ile inşa)
- **§7d Kasa = yönetim terminali** — planlama yaparken kasa meşgul (fırsat maliyeti)
- **§7e Worker'lar** — hire + maaş; para yetmezse grev; game-over yok
- **§14 Denge Tablosu** — TÜM somut başlangıç sayıları (test değerleri, config-driven olacak)

## Araçlar (bu oturumda eklendi)
- **graphify** — global kurulu (uv tool). Knowledge graph ile token tasarrufu. `graphify-out/` git-ignore'da. AST modunda çalışır (LLM/API key yok). Güncelleme: `graphify update .`. Sorgu: `graphify query "..."`.
- **44 proje skill'i** — `.claude/skills/` altında, repo'ya commit'li: GSAP (8, resmi), PixiJS v8 (26, resmi), Three.js (10, CloudAI-X). Doğru API kalıpları için referans.
- **Docs Türkçeye çevrildi** — CLAUDE.md, PROGRESS.md, GDD.md (teknik terimler İngilizce). CLAUDE.md'ye 4 çalışma kuralı eklendi.

---

## Milestone 3 — Memnuniyet HUD'u + para fly-up'ları ✅
- [x] Memnuniyet barı (sağ üst PixiJS): aktif müşterilerin `satisfaction` değerlerini ortalar, kırmızı→amber→yeşil, gym boşken soluk (`UI.updateSatisfaction`, `CustomerSpawner.averageSatisfaction`)
- [x] Her ödemede kasada GSAP `+$N` fly-up'ı — `Economy.earn(amount, worldPosition)` kaynak noktasını taşır; `index.js` dünya→ekran projeksiyonu yapıp `UI.showMoneyFlyup` çağırır
- [x] HUD overlay'leri için `index.js` içinde dünya→ekran projeksiyon helper'ı

---

## Milestone 1 — Çekirdek sahne + item sistemi + oyuncu ✅

Spor salonunu görmek ve içinde dolaşmak için gereken her şey tamam. Bu, tüm oyun sistemlerinin üzerine inşa edildiği temel.

### Proje kurulumu
- [x] Webpack + Three.js + PixiJS + GSAP iskeleti
- [x] İkili canvas mimarisi (`#game-canvas` Three.js, `#ui-canvas` PixiJS overlay)
- [x] Core sistemler: `Renderer`, `GameLoop`, `InputManager`, `UI`
- [x] Git repo başlatıldı, GitHub'a yayınlandı (`hakantoker/gymrush`)

### Tasarım kararları (hepsi kilitli — bkz. GDD §13)
- [x] Stamina barı yok, day/night döngüsü yok, failure state yok
- [x] Sabit predefined makine slot'ları (Monkey Mart tarzı)
- [x] İki item kategorisi: Machine (IDLE/IN_USE/NEEDS_REPAIR/BROKEN) ve Utility (AVAILABLE/NEEDS_REFILL)
- [x] Aşınma bazlı bozulma şansı: `min(max, base + useCount × growth)`, her session sonunda kontrol edilir
- [x] Aşınma yalnızca full repair'de sıfırlanır (BROKEN), quick fix'te (NEEDS_REPAIR) değil
- [x] Havlu sistemi: ikili slot'lu Towel Box, Washing Machine döngüsü
- [x] Worker'lar: post-MVP
- [x] Oyuncu hareketi: izometrik ekran-uzayı projeksiyonu ile WASD

### Sahne
- [x] Orthographic izometrik kamera (18,18,18), `VIEW_SIZE=13`
- [x] `GymRoom` — 20×16 dünya birimi, 10 col × 8 row, `CELL=2`
- [x] Procedural grid zemin texture'ı (hücre başına 128 px, lastik fayans görünümü)
- [x] Alçak duvarlar (1.5 u), 4 birimlik giriş boşluğu, yeşil giriş paspası
- [x] 7 slot işaretçisi (3 treadmill, 1 bench, 1 bike, 1 dumbbell rack, 2 rezerve)

### Item sistemi
- [x] `itemTypes.js` — 9 tip config (TREADMILL, BENCH, BIKE, DUMBBELL_RACK, BOXING_RING, MAT_AREA, WATER_DISPENSER, SOAP_DISPENSER, TOWEL_BOX)
- [x] `GymItem` — base: state, emissive renklendirilmiş mesh, `interact(actor)`, `update(delta)`
- [x] `OccupiableItem` — `usingPeople[]`, `maxCapacity`, queue sistemi (`queue[]`, `queuePositions[]`, enqueue/dequeue/leaveQueue)
- [x] `Machine` — aşınma birikimi, `repairTimer`, timer eskalasyonlu NEEDS_REPAIR/BROKEN
- [x] `SharedFeature` — çok müşterili kapasite
- [x] `Utility` — stock/capacity, AVAILABLE/NEEDS_REFILL
- [x] `TowelBox` — ikili cleanCount/dirtyCount, `washComplete()` hook'u
- [x] `meshBuilders.js` — Treadmill, Bench, Bike, Dumbbell Rack kompoze Three.js geometrisi olarak
- [x] `ItemManager` — typeKey ile factory, frame başına tick, raycast lookup

### Oyuncu
- [x] Low-poly insansı model (amber tişört — müşterilerden ayrı)
- [x] İzometrik ekran-projeksiyonu ile WASD hareketi, hız 6.5 u/s
- [x] Hareket yönüne yumuşak rotasyon lerp'i
- [x] Oda sınırı clamp'leme
- [x] `DesktopControls` (WASD) + `MobileControls` stub'ı (joystick, UI bağlantısına hazır)
- [x] Ok tuşları → kamera kaydırma (`CameraController`)

---

## Milestone 2 — Müşteriler, ekonomi, RPG statları, kasiyer ✅

Tam müşteri kazanç döngüsü uçtan uca çalışıyor: spawn → programına göre makine seç → kuyruğa gir → kullan (ücret biriktir) → belki su iç → kasada öde → çık.

### Müşteri agent'ları
- [x] `Customer.js` — tam AI state machine (WALKING_TO_MACHINE, IN_QUEUE, USING_MACHINE, WALKING_TO_DISPENSER, AT_DISPENSER, WAITING, WALKING_TO_CASHIER, IN_CASHIER_QUEUE, AT_CASHIER, WALKING_TO_EXIT, LEAVING_UNHAPPY)
- [x] `customerModel.js` — low-poly insansı, 4 tişört paleti × 4 ten tonu (amber oyuncudan ayrı)
- [x] `CustomerSpawner.js` — 8 saniyede bir spawn, eşzamanlı 8 limiti
- [x] Düz çizgi pathfinding (tek oda, engel yok)
- [x] Çok makineli session'lar: her müşteri program başına 3–4 makine ziyaret eder
- [x] Makinelerin üzerinde kullanım timer barı (kameraya dönük, yeşil→amber→kırmızı)

### RPG stat sistemi (makine seçimini + ödemeyi yönetir)
- [x] 10 kas grubu (`muscleGroups.js`)
- [x] Disiplinler (`disciplines.js`) — Bodybuilder, Cardio Runner, CrossFit, Weight Loss, + %20 Casual
- [x] Antrenman programları (`trainingPrograms.js`) — ağırlıklı kas grubu hedefleri, makine sayısı, su şansı
- [x] Skor bazlı makine seçimi: `score = Σ machineEffect[g] × programGoal[g]`
- [x] Açgözlü `_decide()` wish-list oluşturur ve her makineden sonra yeniden seçer

### Memnuniyet + ekonomi
- [x] `Economy.js` — para (başlangıç 500), `earn()`/`spend()`, listener API'ı
- [x] Memnuniyet 50'den başlar, beklerken/kuyruktayken azalır (duruma göre farklı oranlar)
- [x] Wish-list tamamlandığında uygulanan hedef-tamamlama bonusu (+30'a kadar)
- [x] Para HUD sayacı (PixiJS, sol üst)

### Kasiyer istasyonu
- [x] `CashierStation.js` — girişin solunda, queue API'ı OccupiableItem'ı yansıtır, MAX_QUEUE=5
- [x] `cashierModel.js` — tezgah + yazar kasa, amber marka şeridi, oda içine dönük
- [x] Ücretler makine başına birikir, yalnızca kasada toplanır: `tip = round(accruedFee × satisfaction/50 × 0.3)`
- [x] Tasarım sonucu: kasiyer sırasında sabrı tükenen müşteriler birikmiş tüm ücretlerini kaybeder

---

## Sırada ne var (sırasıyla)

1. **Oyuncu etkileşimi** ← sıradaki — bozuk/tamir gereken makineleri raycast-tıklama ile tamir; utility'leri yeniden stoklama
2. **Waypoint pathfinding** — çok odalı gelecek için düz çizgiyi node graph ile değiştir
3. **Areas sistemi** — Area sınıfı, Locker Room / Bathroom vb. için unlock mekaniği
4. **Havlu / Çamaşır sistemi** — Washing Machine döngüsü, ikili Towel Box
5. **Worker'lar** — task öncelik döngülü NPC worker'lar (post-MVP)
6. **Polish** — gün sonu özeti, ses
7. **Save sistemi** — `localStorage` JSON snapshot

---

## Açık kararlar
- Yok. Tüm kararlar çözüldü — bkz. GDD §13.
