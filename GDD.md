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

## 3a. Gün Sayacı & Ritim

Oyunun bir **soyut gün sayacı** vardır. Bu *atmosferik* bir day/night döngüsü **değildir** — ışık, gökyüzü ve sahne her zaman aynı kalır (bkz. §13). Gün yalnızca bir **muhasebe/ritim birimidir**: oyunun olaylarını düzenli aralıklarla tek bir "nefes anına" toplar.

- **Gün uzunluğu:** ≈ 90 saniye gerçek zaman (ayarlanabilir sabit; oynayarak ince ayar yapılır)
- **UI:** Üst-ortada gün sayısı + ince ilerleme çubuğu (bkz. §9)
- **Oyun durmaz:** Gün sonunda müşteriler akmaya devam eder, oyun donmaz — telaş kesilmez.

**Gün sonunda olanlar:**
- Personel maaşları kesilir (bkz. §7e)
- Rating o günkü performansa göre güncellenir (yavaş/sönümlü — bkz. §7b)
- Köşede kısa bir toast geçer: `Gün 4: +$320, ⭐4.2`
- Detaylı tam-ekran özet **opsiyoneldir** (oyuncu isterse açar; oyunu durdurmaz)

Bu yapı; maaş, rating ve ödül anını dağıtmak yerine düzenli bir kalbe bağlar, böylece oyuncuya doğal bir "dur ve planla" molası verir — ama oyunu durdurmadan.

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

### VIP / Influencer Müşteriler (yüksek risk / yüksek getiri)

VIP/Influencer, oyunun **kalite ödülüdür** — parayla "satın alınamaz", hak edilir. Gelme olasılığı **Rating'e bağlıdır** (gym level'a değil — bkz. §7b). Yüksek rating'li küçük bir salon, VIP-yoğun trafikle hızlı para basabilir; bu, salt büyümeye alternatif gerçek bir stratejidir.

- **Görsel olarak belli edilir** — oyuncu VIP'i tanır ve ona ekstra özen gösterir.
- **Çarpan üç yere etki eder:**
  1. **Bahşiş / ödeme** — çok yüksek çarpan
  2. **Rating'e katkı** — mutlu bir VIP yıldızı normalden çok artırır (pozitif geri besleme: iyi salon → VIP → daha iyi rating → daha çok VIP)
  3. **Sabır** — VIP **sabırsızdır**; mutlu etmesi zor ama ödülü büyük
- **Net sonuç:** VIP geldiğinde oyuncu için ani bir "her şeyi bırak, bunu memnun et" anı oluşur.

---

## 7. Ekonomi

### Gelir Kaynakları
| Kaynak | Miktar |
|---|---|
| Makine kullanım ücreti | Tier başına session başına sabit |
| Müşteri bahşişi | Memnuniyete göre değişken (ücretin %0–30'u) |
| VIP/Influencer çarpanı | Bahşiş/ödemede yüksek çarpan (bkz. §6) |
| Rating bonusu | Yüksek rating tüm ödemelere bonus uygular (bkz. §7b) |

### Giderler / Maliyetler
| Item | Maliyet Tipi |
|---|---|
| Yeni makine al (boş slot'a) | Tek seferlik |
| Makineyi bir sonraki tier'a yükselt | Tek seferlik (modeli değiştirir) |
| Soyunma odası yükselt | Tek seferlik |
| Yeni alan inşa et (level açtıysa) | Tek seferlik |
| Personel kirala (hire cost) | Tek seferlik |
| Personel maaşı (salary) | Periyodik (her gün sonu — bkz. §7e) |
| Tuvalet malzemelerini yenile | Tekrarlayan |
| Tamamen bozuk makineyi onar | Tek seferlik ceza maliyeti |
| Gym Level yükseltme (renovasyon) | Tek seferlik, büyük (bkz. §7c) |

### İki Katmanlı İlerleme

Para iki ayrı eksende harcanır:

- **Katman A — Gym Level (renovasyon):** Büyük, pahalı, nadir dönüm noktası. Zemini büyütür ve yeni slot'ları/alanları **satın alınabilir** yapar. Detay: §7c.
- **Katman B — Level-içi satın almalar:** Sık, serbest, planlama burada yaşar — makine al/yükselt, soyunma odası yükselt, personel al, alan inşa et. Para her şeye yetmez → **önceliklendirme oyunun kalbidir**.

Gym level yükseltme **sadece para** ile tetiklenir (yüksek bir eşik). Açık bir koşul yoktur; oyun, doğal akışta kazanç hızını artırarak oyuncuyu kendiliğinden yükseltmeye yönlendirir.

---

## 7b. Rating (1–5 Yıldız)

Rating, oyunun **kalite eksenidir** ve **gym level'dan bağımsızdır**. Bir salonun ne kadar büyük değil, ne kadar **iyi işletildiğini** ölçer.

### Davranış
- **Yavaş / sönümlü:** Son ~50 müşterinin performansının kayan ortalaması gibi davranır. Birkaç kötü an yıldızı düşürmez — uzun vadeli itibar gibi hisseder. Gün sonunda güncellenir (bkz. §3a).

### Girdiler (çoğunlukla davranışsal)
- Müşteri memnuniyeti (ana girdi)
- Makine çeşitliliği ve tier'ları
- Tesis temizliği (bozuk makine / kirli tuvalet rating'i düşürür)
- VIP memnuniyeti (orantısız pozitif katkı — bkz. §6)
- **Gym level yalnızca tavanı yükseltir:** 5. yıldıza ancak yüksek gym level'da ulaşılabilir; ama "iyi işletmek" her zaman ana belirleyicidir.

### Etkiler
1. **Müşteri gelme hızı** — yüksek rating = daha çok müşteri
2. **Gelen müşterinin VIP/Influencer olma olasılığı** — yüksek rating = her gelen müşterinin VIP olma şansı artar
3. **Ödeme bonusu** — yüksek rating tüm ödemelere bonus çarpanı uygular

Sonuç: rating, salt para-kovalamacasına gerçek bir alternatif strateji sunar. Kaliteli küçük bir salon, az ama VIP-yoğun trafikle "dev ama vasat" bir salondan daha kârlı olabilir.

---

## 7c. Gym Level (1–5) — Renovasyon

Oyuncu Level 1'de başlar. Her gym level **büyük bir renovasyondur**: zemini büyütür, slot kapasitesini artırır ve yeni alan türlerini **satın alınabilir** yapar. Yalnızca para ile tetiklenir (yüksek eşik).

### İki kapılı açılım
Bir alan/slot kullanılabilir hale gelmek için iki kapıdan geçer:
1. **Gym Level** onu **satın alınabilir** yapar (availability)
2. Oyuncu **ayrıca para verip** onu inşa eder / makineyi alır (build)

Yeni slot'lar her zaman **boş** gelir (otomatik dolmaz) — planlama korunur.

### Beş Level (taslak içerik)

| Level | Tema | Yeni Açılanlar |
|---|---|---|
| 1 | Garaj / bodrum salonu | Küçük zemin, ~7 makine slot'u (örn. 2 treadmill, 1 bike, 1 bench, 1 dumbbell + 2), Soyunma Odası L1 (su sebili), Kasa. Müşteri: yalnızca Casual. Her şeyi oyuncu yapar → telaş + tutorial. |
| 2 | Mahalle salonu | Zemin genişler (~14 slot), daha çok çeşit, Soyunma Odası L2 (havlu sistemi), **personel alma açılır** (Cashier + Cleaning Worker) → idle başlar, ilk Tier-2 makine yükseltmeleri. Müşteri: Regular. |
| 3 | Fitness merkezi | **Yeni alan türleri açılabilir:** Plates/serbest ağırlık alanı + Boks alanı (çok kişilik shared feature), Soyunma Odası L3 (duşlar → banyo), Personal Trainer personeli. Müşteri: Bodybuilder. |
| 4 | Premium kulüp | Sauna, grup ders stüdyosu (zamanlı toplu seans), smoothie/supplement standı (yeni gelir), Tier-3 makineler, Çamaşırhane (tam havlu döngüsü). Müşteri: Influencer/VIP yoğunlaşır. |
| 5 | Mega kompleks | Havuz/spa, büyük genişleme, tam otomasyon mümkün (tüm personel) → ağırlıklı idle, prestij müşteriler ve çok büyük ödemeler. |

### Slot kapasitesi örneği
Aynı makine tipinin slot tavanı level ile artar — örn. Treadmill: L1'de 2 → L2'de 4 → … Yeni slot'lar boş gelir, oyuncu doldurmaya karar verir.

---

## 7d. Kasa = Yönetim Terminali

Kasa **çift işlevlidir:**
1. **Ödeme noktası** — müşteriler çıkarken burada öder (mevcut sistem).
2. **Yönetim terminali** — oyuncu kasaya gidince bir bilgisayar ekranı açılır; tüm satın almalar (makine, yükseltme, personel, alan, gym level) buradan yapılır.

**Tasarım gerilimi:** Oyuncu kasada planlama yaparken kasa meşguldür → o sırada müşteri ödeme alınamaz. Planlamanın gerçek bir **fırsat maliyeti** vardır; bu, erken oyunu "meşgul" tutar.

**Kasiyer personeli alındıktan sonra**, yönetim menüsü her yerden açılabilir hale gelir (kasaya bağımlılık kalkar) — bu, bir personel ödülüdür.

---

## 7e. Worker'lar

Oyuncular task'ları otomatikleştirmek için NPC worker'lar kiralayabilir. Worker'lar kendi hareket ve aksiyon döngüleri olan kalıcı NPC'lerdir — oyuncu kontrollü değildirler. **Personel, idle'a geçiş anahtarıdır:** telaşı azaltır ama **bitirmez** — sadece telaş/planlama arası denge kayar (bkz. §7d, kasiyer alınınca menü her yerden açılır).

### Worker Tipleri

| Worker | Otomatikleştirir | Kiralama Maliyeti | Maaş | Açılış |
|---|---|---|---|---|
| Cashier | Çıkışta müşteri ödemesini hızlandırır; yönetim menüsünü her yerden açar | Orta | Düşük | Level 2 |
| Cleaning Worker | Tuvaleti temizler, kullanım sonrası makineleri siler | Düşük | Düşük | Level 2 |
| Personal Trainer | Zorda kalan müşterilere yardım eder (oyuncunun "!" tepkisini değiştirir) | Yüksek | Orta | Level 3 |
| Laundry Worker | Çamaşır makinesini yükler, havlu kutusunu doldurur | Orta | Düşük | Level 4 (Çamaşırhane ile) |

### Worker Davranışı
- Her worker'ın bir **task öncelik listesi** vardır — kendi task tipini tarar ve ona yürür
- Worker'ların oyuncuyla aynı `IDLE → MOVING → WORKING` state'leri vardır
- Worker'lar birbirinden ve oyuncudan bağımsızdır
- Oyuncu bir worker'ı istediği zaman kovabilir

### Maaş Mekaniği
- **Hire cost** (tek seferlik) + **salary** (periyodik). Maaş her **gün sonunda** otomatik kesilir (bkz. §3a).
- **Para maaşa yetmezse:** Personel **küser / işi yavaşlatır** (geçici "grev" gibi). Para gelince kendiliğinden düzelir.
- **Game-over yoktur** (§13: failure state yok). Maaş yetersizliği sert bir ceza değil, yumuşak bir baskıdır — telaşı canlı tutar.

---

## 8. Alanlar & Yerleşim

Her alan sabit item slot'ları olan predefined bir odadır. Alanlar **iki kapıdan** açılır: önce gym level onları satın alınabilir yapar, sonra oyuncu para verip inşa eder (bkz. §7c). Açılan alanlar sahnede mevcut odaların yanında belirir.

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
| Para sayacı | Sol üst | Kazançta animasyonlu +$X (uygulandı) |
| Gün sayacı + ilerleme çubuğu | Üst orta | Soyut gün birimi (≈90 sn); ışık değişmez (bkz. §3a) |
| Rating (yıldız) göstergesi | Sol üst / para altı | 1–5 yıldız, yavaş/sönümlü (bkz. §7b) |
| Memnuniyet barı | Sağ üst | Aktif müşterilerin ortalaması (uygulandı) |
| Gün sonu toast'ı | Köşe | `Gün N: +$X, ⭐Y.Z` — oyunu durdurmaz (bkz. §3a) |
| Task bildirimi | Oyuncunun üstünde | Acil task'a işaret eden ok + ikon |
| VIP göstergesi | Müşteri üstünde | VIP/Influencer müşteriyi görsel olarak belli eder (bkz. §6) |
| Makine tooltip'i | Hover'da | Tier, ücret, durum gösterir |
| Yönetim terminali | Kasa ekranı / tam panel | Tüm satın almalar (makine, yükseltme, personel, alan, gym level) buradan (bkz. §7d) |
| Gün sonu özeti | Tam ekran overlay (opsiyonel) | Gelir, bahşişler, olaylar, gün puanı |

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
- **Offline / AFK kazanç** — yok; oyun aktif yönetim üzerine kurulu
- **Prestige / franchise reset** — şimdilik düşünülmüyor
- **Kilitli slot'ların hayalet/önizleme görünümü** — ilk aşamada yok (görsel test sonrası tekrar değerlendirilecek)
- Worker'lar (Level 2+ açılır — bkz. §7e; ilk MVP'de oyuncu tüm task'ları kendi yapar)

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
- [x] **İki katmanlı ilerleme** — Katman A: **Gym Level** (1–5, büyük renovasyon, sadece para, nadir). Katman B: level-içi satın almalar (makine/yükseltme/personel/alan — sık, planlama burada). Detay: §7c.
- [x] **Gym Level tetikleyicisi** — Yalnızca para (yüksek eşik). Açık koşul yok; oyun kazanç hızını artırarak oyuncuyu doğal olarak yükseltmeye yönlendirir.
- [x] **İki kapılı açılım** — Bir alan/slot önce gym level ile **satın alınabilir** olur, sonra ayrıca para verilip **inşa** edilir. Yeni slot'lar her zaman **boş** gelir (otomatik dolmaz).
- [x] **Rating (1–5 yıldız)** — Kalite ekseni, **gym level'dan bağımsız**. Yavaş/sönümlü (son ~50 müşteri). Girdiler çoğunlukla davranışsal (memnuniyet, çeşitlilik, temizlik, VIP memnuniyeti); gym level yalnızca tavanı yükseltir. Etkiler: müşteri gelme hızı + VIP olasılığı + ödeme bonusu. Detay: §7b.
- [x] **VIP / Influencer** — Gelme olasılığı **rating'e bağlı** (level'a değil). Görsel olarak belli edilir. Çarpan üç yere: bahşiş/ödeme (yüksek) + rating'e katkı (orantısız) + düşük sabır (zor ama ödüllü). Detay: §6.
- [x] **Soyut gün sayacı** — ≈90 sn'lik "gün" birimi; görsel/ışık değişmez (atmosferik döngü değil, muhasebe birimi). Gün sonunda: maaş kesilir + rating güncellenir + köşede toast. **Oyun durmaz**, müşteriler akmaya devam eder. Tam-ekran özet opsiyonel. Detay: §3a.
- [x] **Personel maaşı** — Hire cost (tek seferlik) + salary (her gün sonu periyodik). Para yetmezse personel **küser/yavaşlar** (geçici grev, para gelince düzelir) — game-over yok. Detay: §7e.
- [x] **Kasa = yönetim terminali** — Çift işlevli: müşteri ödeme noktası + planlama ekranı. Oyuncu planlama yaparken kasa meşgul (fırsat maliyeti). Kasiyer personeli alınınca menü her yerden açılır. Detay: §7d.
- [x] **Kapsam dışı (şimdilik)** — Offline/AFK kazanç YOK (aktif yönetim). Prestige/franchise reset YOK. Kilitli slot'ların hayalet/önizleme görünümü ilk aşamada YOK (görsel test sonrası tekrar değerlendirilecek).

---

## 14. Denge Tablosu (Başlangıç Değerleri)

> **ÖNEMLİ:** Bu sayılar **test başlangıç noktasıdır**, nihai değildir. Tümü tek bir config dosyasında (`src/config/balance.js`) toplanacak ve oyun içinde oynayarak ayarlanacaktır. Görsel öğeler (zemin boyutu, slot yerleşimi) bu sayılardan türetilir — bu yüzden **tek doğruluk kaynağı config dosyasıdır**; bu tablo onun insan-okunur kopyasıdır. Sayı değişince ikisi de güncellenmelidir.

### 14.1 Zaman & ritim
| Parametre | Değer |
|---|---|
| `time.dayDuration` | 90 sn |
| `time.startMoney` | 500 |

### 14.2 Slot kapasiteleri (level başına makine tavanı)

Yeni slot'lar **boş** gelir. Bu tablo aynı zamanda alanların hangi level'da açıldığını kodlar (Boxing/Plates L3'te belirir). Zemin boyutu ve yerleşim bu tablodan türetilir.

| Makine | L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|
| Treadmill | 2 | 4 | 5 | 6 | 8 |
| Bike | 2 | 3 | 4 | 5 | 6 |
| Bench | 1 | 3 | 4 | 5 | 6 |
| Dumbbell Rack | 1 | 2 | 3 | 3 | 4 |
| Pull-up Bar | 1 | 2 | 2 | 3 | 4 |
| Boxing (shared) | 0 | 0 | 1 | 1 | 2 |
| Plates/Mat (shared) | 0 | 0 | 1 | 2 | 2 |
| **Toplam** | **7** | **14** | **20** | **25** | **32** |

### 14.3 Gym Level maliyetleri (renovasyon kapıları)
| Geçiş | Maliyet |
|---|---|
| L1 → L2 | $2,000 |
| L2 → L3 | $8,000 |
| L3 → L4 | $25,000 |
| L4 → L5 | $75,000 |

**Tempo referansı:** L1'de ~3★, 7 makine → ~$35/müşteri, steady-state ~5.7 sn/müşteri → ~$370/gün brüt. L1→L2 ≈ **6 gün** (~9 dk gerçek zaman). Onaylanan tempo.

### 14.4 Makine ekonomisi (Tier 1 taban)
| Makine | Alış (T1) | Fee T1 | Süre |
|---|---|---|---|
| Treadmill | $300 | $10 | 18 sn |
| Bike | $200 | $8 | 14 sn |
| Bench | $250 | $12 | 22 sn |
| Dumbbell Rack | $150 | $6 | 14 sn |
| Pull-up Bar | $100 | $5 | 12 sn |

**Tier çarpanları (tüm makineler ortak):**
| Tier | Fee çarpanı | Yükseltme maliyeti |
|---|---|---|
| T1 | ×1 | — (başlangıç) |
| T2 | ×2.2 | alış × 4 |
| T3 | ×4 | alış × 10 |

### 14.5 Soyunma Odası (Locker Room) yükseltmeleri
| Geçiş | Maliyet | Açtığı |
|---|---|---|
| L1 → L2 | $800 | Havlu sistemi, daha çok su kapasitesi |
| L2 → L3 | $3,000 | Duşlar / banyo alanı |

### 14.6 Personel (hire + günlük maaş)
| Personel | Hire | Maaş/gün | Açılış Level |
|---|---|---|---|
| Cashier | $1,500 | $80 | L2 |
| Cleaner | $1,200 | $60 | L2 |
| Personal Trainer | $4,000 | $150 | L3 |
| Laundry Worker | $2,500 | $100 | L4 |

### 14.7 Rating formülü
| Parametre | Değer / Formül |
|---|---|
| Pencere | Son 50 müşterinin final memnuniyeti (0–100), kayan ortalama |
| VIP ağırlığı | ×3 (bir VIP, 3 normal müşteri kadar etkiler) |
| Yıldız haritası | `stars = 1 + 4 × (avgSat / 100)`, sonra level tavanına clamp |
| Level tavanı (maxStars) | L1–L2 → 4.0 · L3–L4 → 4.5 · L5 → 5.0 |

### 14.8 VIP / Influencer
| Parametre | Değer / Formül |
|---|---|
| `vip.baseChance` | `clamp(0, 0.05 + (rating − 3) × 0.10)` → 3★:%5, 5★:%25, düşük rating:~0 |
| Fee / bahşiş çarpanı | ×3 |
| Sabır çarpanı | ×0.5 (normalin yarısı) |

### 14.9 Müşteri akışı
| Parametre | Değer / Formül |
|---|---|
| Spawn çarpanı | `spawnRateMult = 0.5 + rating × 0.3` |
| Spawn aralığı | `8 sn / spawnRateMult` → 1★:10sn · 3★:~5.7sn · 5★:4sn |
| Max eşzamanlı müşteri | L1:8 · L2:14 · L3:20 · L4:28 · L5:36 |

### 14.10 Hedeflenen config yapısı
```
src/config/balance.js
├── time      { dayDuration, startMoney }
├── slots     { [level]: { treadmill, bike, bench, dumbbell, pullup, boxing, plates } }
├── gymLevel  { upgradeCosts: [2000, 8000, 25000, 75000], maxStars: [4, 4, 4.5, 4.5, 5] }
├── machines  { treadmill: { buy, feeT1, duration }, ... }
├── tiers     { feeMult: [1, 2.2, 4], upgradeMult: [null, 4, 10] }
├── lockerRoom{ upgradeCosts: [800, 3000] }
├── staff     { cashier: { hire, salary, unlockLevel }, ... }
├── rating    { windowSize: 50, vipWeight: 3, maxStars: [...] }
├── vip       { baseChance, ratingScale, feeMult, patienceMult }
└── customers { baseSpawn: 8, spawnRatingScale: 0.3, maxConcurrent: [8, 14, 20, 28, 36] }
```
