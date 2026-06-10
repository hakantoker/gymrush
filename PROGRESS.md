# GymRush — Build İlerlemesi

## Sıradaki task (buradan devam et)
**Oyuncu etkileşimi — tamir & stok yenileme.** Bakım döngüsü çalışıyor (makineler aşınıp bozuluyor, utility'ler tükeniyor) ama oyuncu henüz müdahale edemiyor. Eklenecekler:
- Bozuk / NEEDS_REPAIR durumundaki bir makineyi hedeflemek için raycast tıklama (veya yakınlık + tuş) ve tamir timer'ı.
- Utility'leri (su sebili, sabun) aynı şekilde yeniden stoklamak.
- Tamir/stok sırasında oyuncu "busy" durumu + ekranda ilerleme göstergesi.
- Aksiyon çalıştıktan sonra Economy'ye bağlama (tamir para götürebilir).

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
