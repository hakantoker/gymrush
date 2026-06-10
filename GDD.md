# Oyun Tasarım Dokümanı — GymRush (Geçici İsim)

## 1. Genel Bakış

| Alan | Değer |
|---|---|
| Tür | Idle / Yönetim Simülatörü |
| Perspektif | 2.5D Orthographic |
| Platform | Web (Tarayıcı) |
| Sanat Stili | Low-poly, flat shading, sınırlı palet |
| Çekirdek Fantezi | Şehrin en iyi spor salonunu kur ve işlet |

---

## 2. Görsel Stil

- **Kamera:** Sabit orthographic kamera, hafif yukarıdan açı (izometrik benzeri)
- **Modeller:** Basit low-poly 3D insansılar ve eşyalar, texture yok — flat `MeshToonMaterial` veya `MeshPhongMaterial`
- **Palet:** Spor salonu zemini/duvarları için sıcak nötr tonlar, makine tier'ı başına vurgu renkleri
- **Aydınlatma:** Yumuşak ambient + tek directional ışık, sert gölge yok
- **UI:** PixiJS 2D overlay — temiz, minimal ikonlar ve paneller. Popup/bildirimler için GSAP geçişleri.

---

## 3. Çekirdek Oyun Döngüsü

```
Müşteri spor salonuna girer
    → Makine kullanır (timer geri sayar)
    → Müşteri aktifken oyuncu salonu yönetir
        → Bozuk makineleri tamir eder
        → Tuvaleti temizler
        → Zorda kalan müşterilere yardım eder
    → Müşteri bitirir ve öder
        → Oyuncu para kazanır
→ Oyuncu parayı upgrade'lere harcar
→ Daha fazla müşteri / daha iyi makinelerle tekrar
```

---

## 4. Oyuncu

### Karakter
- Low-poly 3D insansı — müşterilere karşı net görsel kontrast için amber tişört
- **Masaüstü:** WASD serbest hareket, izometrik-projeksiyonlu (W/A/S/D ekran yukarı/sol/aşağı/sağ ile eşlenir)
- **Mobil:** sanal joystick (PixiJS overlay — post-MVP)
- Oyuncu hareket yönüne doğru yumuşakça döner
- Task etkileşimi: oyuncu bir item'a yaklaşır ve tıklar/dokunur → `interact(actor)` çağrılır

### Oyuncu Task'ları
| Task | Tetikleyici | Zaman Maliyeti | İhmal Edilirse Sonuç |
|---|---|---|---|
| Makine tamir et | Makine NEEDS_REPAIR göstergesi gösterir | Orta | repairTimer dolar → BROKEN, müşteriye iade |
| Tam onarım | Makine BROKEN durumda | Uzun + $ maliyeti | Makine kullanılamaz kalır |
| Utility doldur | Utility NEEDS_REFILL gösterir | Kısa | Doldurulana kadar utility kullanılamaz |
| Müşteriye yardım et | Müşteri "!" ikonu gösterir | Kısa | Müşteri ödemeden ayrılır, memnuniyet cezası |

### Oyuncu Hareketi
- WASD hareketi, hız 6.5 u/s, oda sınırlarına clamp'li
- Hareket yönüne yumuşak rotasyon lerp'i (14 rad/s, kısa-yay)
- Yürüme animasyonu: TODO (Three.js AnimationMixer — post-MVP)
- Ok tuşları kamerayı bağımsız olarak kaydırır

---

## 5. Item'lar

Spor salonundaki tüm etkileşimli item'lar iki kategoriden birine aittir: **Machine** veya **Utility**. Her kategorinin kendi state machine'i vardır. Her item tipi bir config objesiyle tanımlanır (data-driven), böylece yeni item'lar yeni sınıf olmadan eklenebilir.

---

### Kategori A — Machine'ler (spor salonu ekipmanı)

Müşteriler bir session boyunca makineleri işgal eder. Makineler arızalanabilir ve ihmal edilirse bozuk duruma yükselebilir.

**State machine:**
```
IDLE → IN_USE ──(session başına arıza şansı)──→ NEEDS_REPAIR
  ↑                                                      ↓
  └──────────── oyuncu tamir eder (hızlı) ───────────────┘
                                                          ↓ (timer dolar)
                                                       BROKEN
                                                          ↓
                                          oyuncu tamir eder ($ maliyeti) → IDLE
```

| State | Gösterge | Açıklama |
|---|---|---|
| IDLE | — | Sonraki müşteri için müsait |
| IN_USE | Mavi | Dolu, session timer'ı çalışıyor |
| NEEDS_REPAIR | Turuncu | Arızalandı — oyuncu tamir penceresi içinde onarmalı |
| BROKEN | Kırmızı | Tamir penceresi kaçırıldı — onarması para gerektirir, müşteriye iade |

**Arıza** session sırasında rastgele olur (item tipi başına yapılandırılabilir şans). NEEDS_REPAIR'in geri sayım timer'ı vardır; dolarsa makine BROKEN'a geçer.

**Makine listesi:**

| Item | Alan | Tier | Notlar |
|---|---|---|---|
| Treadmill | Main Gym | 1–3 | En yaygın, yüksek arıza oranı |
| Weight Bench | Main Gym | 1–3 | Orta sıklık |
| Stationary Bike | Main Gym | 1–3 | Daha ucuz kardiyo seçeneği |
| Dumbbell Rack | Main Gym | 1 | Pasif — timer yok, arıza yok |
| Pull-up Bar | Main Gym | 1 | Bütçe seçeneği |
| Boxing Bag | Boxing Ring | 1–2 | Açılabilir alan |
| Sauna Chair | Sauna | 2–3 | Açılabilir alan |

**Makine tier'ları:**

| Tier | Görsel | Ücret | Açılış | Notlar |
|---|---|---|---|---|
| 1 | Basit, yıpranmış | Düşük | Ücretsiz | Başlangıç |
| 2 | Temiz, modern | Orta | Oyun ortası | Daha fazla müşteri |
| 3 | Premium, parlayan | Yüksek | Oyun sonu | Nadir müşteriler, büyük ödeme |

---

### Kategori B — Utility'ler (sarf malzemeleri & servis araçları)

Utility'ler müşteriler tarafından session için kullanılmaz — salon ortamını desteklerler. Zamanla veya kullanım başına tükenir ve oyuncu ya da bir worker tarafından yeniden stoklanmaları/doldurulmaları gerekir.

**State machine:**
```
AVAILABLE ──(kullanım başına veya zamanla tükenir)──→ NEEDS_REFILL
                                                            ↓
                                      oyuncu/worker doldurur → AVAILABLE
```

| Item | Alan | Tükenme şekli | Notlar |
|---|---|---|---|
| Water Dispenser | Locker Room | Müşteri kullanımı başına | Müşteriler session sonrası uğrar |
| Towel Box (temiz) | Locker Room | Müşteri başına (1 havlu alınır) | Havlu sisteminin parçası — bkz. §5a |
| Towel Box (kirli) | Locker Room | Müşteri başına (1 havlu iade) | Dolar — çamaşır ihtiyacını tetikler |
| Soap Dispenser | Bathroom | Duş kullanımı başına | — |
| Toilet Paper | Bathroom | Zamanla | — |

---

### 5a. Havlu Sistemi (Laundry Area açılışı)

**Laundry Area**'yı açmak salona tam havlu döngüsünü ekler.

**Towel Box ikili slot'lu bir utility'dir:**
- **Temiz taraf** — müşterilerin antrenman öncesi aldığı taze havlu stoğu
- **Kirli taraf** — müşterilerin antrenman sonrası iade ettiği kullanılmış havlu yığını

**Müşteri havlu döngüsü:**
```
Müşteri girer
→ 1 temiz havlu alır (temiz sayı -1)
→ antrenman yapar
→ havluyu kirli tarafa iade eder (kirli sayı +1)
→ çıkar
```

**Çamaşır döngüsü:**
```
Kirli taraf eşiğe ulaşır
→ NEEDS_WASH göstergesi belirir
→ Oyuncu veya Laundry Worker Washing Machine'i yükler
→ Washing Machine çalışır (zamanlı döngü)
→ Döngü biter → kirli sayı sıfırlanır, temiz sayı yeniden dolar
```

Temiz havlular biterse → müşteriler havlu alamaz → memnuniyet cezası.

---

## 6. Müşteriler

### Davranış Akışı
```
Girişte spawn
→ Göz at (tercih edilen tipte boş makine ara)
→ Makine kullan (rezervasyon öde)
→ Bitir → çıkışa yürü → kalanı öde
         VEYA
→ Takıl / yardım gerek → "!" göster → oyuncuyu bekle
→ Çok uzun ihmal edilirse → ödemeden ayrıl + memnuniyet cezası
```

### Müşteri Tipleri (MVP)

| Tip | Tercih Edilen Makineler | Sabır | Bahşiş Şansı |
|---|---|---|---|
| Casual | Treadmill, Bike | Yüksek | Düşük |
| Bodybuilder | Bench, Dumbbell | Orta | Orta |
| Regular | Herhangi | Yüksek | Yüksek |
| Elderly | Yalnızca düşük etkili | Çok Yüksek | Orta |
| Influencer | Yalnızca Tier 3 | Düşük | Çok Yüksek |

### Müşteri Memnuniyeti
- Ziyaret başına skor: bahşiş miktarını etkiler
- Memnuniyet şunlarda azalır: bozuk makine, uzun bekleme, kirli tuvalet, ihmal edilen sorun
- Memnuniyet şunlarda artar: oyuncunun hızlı tepkisi, Tier 2/3 makineler, temiz tesis

---

## 7. Ekonomi

### Gelir Kaynakları
| Kaynak | Miktar |
|---|---|
| Makine kullanım ücreti | Tier başına session başına sabit |
| Müşteri bahşişi | Memnuniyete göre değişken (ücretin %0–30'u) |
| VIP müşteri bonusu | Nadir sabit bonus |

### Giderler / Maliyetler
| Item | Maliyet Tipi |
|---|---|
| Yeni makine al | Tek seferlik |
| Makineyi bir sonraki tier'a yükselt | Tek seferlik (modeli değiştirir) |
| Tuvalet malzemelerini yenile | Tekrarlayan |
| Tamamen bozuk makineyi onar | Tek seferlik ceza maliyeti |

### İlerleme Kilometre Taşları (Taslak)

| Kilometre Taşı | Açılış |
|---|---|
| Gün 1 | 2 Treadmill (Tier 1), 1 Bench (Tier 1) |
| $500 kazanıldı | Shower Stall slot'u açılır |
| $1,200 kazanıldı | İlk Tier 2 upgrade açılır |
| $3,000 kazanıldı | İkinci salon odası / genişleme alanı |
| $7,500 kazanıldı | Tier 3 makineler kullanılabilir |
| $15,000 kazanıldı | NPC yardımcı kirala (tuvaleti otomatik temizler) |

---

## 7a. Worker'lar

Oyuncular task'ları otomatikleştirmek için NPC worker'lar kiralayabilir. Worker'lar kendi hareket ve aksiyon döngüleri olan kalıcı NPC'lerdir — oyuncu kontrollü değildirler.

### Worker Tipleri

| Worker | Otomatikleştirir | Kiralama Maliyeti | Maaş |
|---|---|---|---|
| Personal Trainer | Zorda kalan müşterilere yardım eder (oyuncunun "!" tepkisini değiştirir) | Yüksek | Orta |
| Laundry Worker | Çamaşır makinesini yükler, havlu kutusunu doldurur | Orta | Düşük |
| Cashier | Çıkışta müşteri ödemesini hızlandırır | Orta | Düşük |
| Cleaning Worker | Tuvaleti temizler, kullanım sonrası makineleri siler | Düşük | Düşük |

### Worker Davranışı
- Her worker'ın bir **task öncelik listesi** vardır — kendi task tipini tarar ve ona yürür
- Worker'ların oyuncuyla aynı `IDLE → MOVING → WORKING` state'leri vardır
- Worker'lar birbirinden ve oyuncudan bağımsızdır
- Oyuncu bir worker'ı istediği zaman kovabilir

### Açılış Koşulu
Worker'lar belirli bir kilometre taşından sonra kiralanabilir hale gelir (TBD — ilerleme ekonomisine bağlı).

---

## 8. Alanlar & Yerleşim

Her alan sabit item slot'ları olan predefined bir odadır. Alanlar para harcanarak açılır ve sahnede mevcut odaların yanında belirir.

### Alan Listesi

| Alan | Varsayılan | Anahtar Item'lar |
|---|---|---|
| Main Gym | Açık | Treadmill'ler, Bench, Bike, Dumbbell Rack, Pull-up Bar |
| Locker Room | Açık | Dolaplar, Water Dispenser, Towel Box |
| Bathroom | Açık | Duşlar, Soap Dispenser, Toilet Paper |
| Sauna | Kilitli | Sauna Chair'ler |
| Laundry | Kilitli | Washing Machine (tam havlu sistemini etkinleştirir) |
| Boxing Ring | Kilitli | Boxing Bag'ler |

### MVP Yerleşim (Main Gym — tek oda)

```
┌─────────────────────────────────┐
│           [Giriş]               │
│                                 │
│  [Treadmill]    [Treadmill]     │
│                                 │
│  [Bench]  [Bike]  [Dumbbell]   │
│                                 │
│  [Bathroom ->]  [Locker Room ->]│
└─────────────────────────────────┘
```

- Alan başına sabit slot'lar — drag-and-drop yok
- Genişleme, sahnede bitişik beliren yeni odaları açar

---

## 9. UI / HUD (PixiJS Katmanı)

| Eleman | Konum | Notlar |
|---|---|---|
| Para sayacı | Sol üst | Kazançta animasyonlu +$X |
| Gün / zaman barı | Üst orta | Gün döngüsü müşteri spawn oranını yönetir |
| Memnuniyet barı | Sağ üst | Son müşterilerin ortalaması |
| Task bildirimi | Oyuncunun üstünde | Acil task'a işaret eden ok + ikon |
| Makine tooltip'i | Hover'da | Tier, ücret, durum gösterir |
| Upgrade paneli | Alt çekmece | Idle makineye tıklayınca açılır |
| Gün sonu özeti | Tam ekran overlay | Gelir, bahşişler, olaylar, gün puanı |

---

## 10. Oyun Hissi Hedefleri

- Oyuncu her zaman **hafif meşgul** hissetmeli — asla sıkılmamalı, asla bunalmamalı
- Bozuk makine uyarısı **tepki vermeye yetecek zaman** vermeli ama gerilim yaratmalı
- Para animasyonları (+$) ve **GSAP popup'ları** tatmin edici hissettirmeli
- Müşteri "!" yardım istekleri **acil ama adil** hissettirmeli
- Gün sonu özeti bir **ödül anı** gibi hissettirmeli

---

## 11. Teknik Notlar

| Konu | Yaklaşım |
|---|---|
| 3D sahne | Three.js, orthographic kamera, toon/flat shading |
| UI overlay | Three.js canvas üzerinde PixiJS canvas |
| Animasyonlar | UI için GSAP; karakter yürüme/idle için Three.js AnimationMixer |
| Müşteri pathfinding | Basit waypoint sistemi (MVP için tam navmesh yok) |
| State machine | Her makine ve müşterinin açık state enum'u var |
| Save sistemi | localStorage JSON snapshot |

---

## 12. Kapsam Dışı (MVP)

- Drag-and-drop makine yerleştirme
- Çoklu salon katı (dikey genişleme)
- Çok oyunculu / liderlik tablosu
- Ses tasarımı (yalnızca placeholder)
- Worker'lar (post-MVP — ilerleme kilometre taşlarıyla açılır)

---

## 13. Tasarım Kararları

- [x] **Stamina barı** — Yok. Oyuncu süresiz koşar.
- [x] **Day/night döngüsü** — Döngü yok. Her zaman gündüz; salon sürekli çalışır.
- [x] **Makine yerleştirme** — Oda başına predefined sabit slot'lar. Drag-and-drop yerleştirme yok. Makineler yerinde upgrade edilebilir veya slot'u boşaltmak için satılabilir.
- [x] **Failure state** — İflas veya sert başarısızlık yok. Müşteri memnuniyeti yalnızca bahşiş ve puanı etkiler; oyuncu her zaman para kazanır ve oynamaya devam eder.
- [x] **Genişleme modeli** — Yeni bir oda açmak yönetilecek yeni bir predefined alan ekler (Monkey Mart tarzı). Yerleşim, oyuncu özelleştirmesini değil oyuncu hareketini ve aciliyeti maksimize edecek şekilde tasarlanmıştır.
- [x] **Makine arıza tetikleyicisi** — Session başına rastgele, aşınmaya göre ağırlıklı. Bozulma şansı = `min(maxBreakChance, baseBreakChance + useCount × breakChanceGrowth)`. Her session sonunda bir kez kontrol edilir. Her makine tipinin kendi üç parametresi vardır.
- [x] **Aşınma sıfırlama** — Yalnızca full repair (BROKEN durumu, para maliyetli) `useCount`'u 0'a sıfırlar. Quick fix (NEEDS_REPAIR) makineyi IDLE'a döndürür ama aşınmayı azaltmaz — kullanım sayısı birikmeye devam eder. Bu, tam bozulmadan önce sorunları erken yakalamayı teşvik eder.
- [x] **Item kategorileri** — İki kategori: **Machine** (IDLE → IN_USE → NEEDS_REPAIR → BROKEN) ve **Utility** (AVAILABLE → NEEDS_REFILL). Tüm item tipleri `itemTypes.js` içinde data-driven config objeleridir; item tipi başına yeni sınıf gerekmez.
- [x] **Havlu sistemi** — İkili slot'lu Towel Box (temiz sayı + kirli sayı). Müşteri girişte temiz havlu alır, çıkışta kirli iade eder. Washing Machine kirliyi temize çevirir. Laundry Area açılınca etkinleşir.
- [x] **Worker'lar** — Post-MVP. Dört tip: Personal Trainer, Laundry Worker, Cashier, Cleaning Worker. Her biri belirli bir oyuncu task tipini otomatikleştirir.
- [x] **Oyuncu hareketi** — İzometrik ekran-uzayı projeksiyonlu WASD serbest hareket (W/A/S/D ham dünya eksenlerine değil ekran yukarı/sol/aşağı/sağ'a eşlenir). Ok tuşları kamerayı bağımsız kaydırır. Click-to-move yok.
- [x] **Referans oyun** — Monkey Mart (Poki). Oyuncu kaosa tepki vererek sürekli hareket halindedir. Yerleşim ve aciliyet çekirdek eğlencedir — salon kurmak/tasarlamak değil.
