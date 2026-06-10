# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## GymRush — Claude Kuralları

1. **Varsayımda bulunma.** Bir şey açık değilse sor. Hiçbir konuda tahminde bulunma.
2. **En basit çözümü uygula.** Çalışacak şekilde minimum geliştirme yap. Talep edilmeyen hiçbir özellik ekleme.
3. **Alakasız kodlara dokunma.** Mevcut task ile ilgisi olmayan dosyaları olduğu gibi bırak.
4. **Belirsizlikleri bildir.** Kesin olmayan veya tam güvenilemeyen bir şey varsa kullanıcıya söyle.

## Proje

**GymRush** — tarayıcı tabanlı 3D idle/yönetim simülatörü (Monkey Mart tarzı). Oyuncu bir spor salonu işletir: makineleri tamir eder, müşterilere yardım eder, para kazanır, ekipman yükseltir. Tam tasarım dokümanı [GDD.md](GDD.md) içinde. Güncel build durumu [PROGRESS.md](PROGRESS.md) içinde.

## Komutlar

```bash
npm start       # localhost:3000'de HMR ile dev sunucusu
npm run build   # production build → dist/
```

Test runner yapılandırılmamış.

## Dizin yapısı

```
src/
  core/           # Engine primitifleri (Renderer, GameLoop, InputManager, CameraController)
  ui/             # PixiJS HUD katmanı (UI.js — Three.js canvas üzerinde şeffaf overlay)
  scene/          # Statik dünya geometrisi (GymRoom.js)
  items/          # Item sınıf hiyerarşisi + tip configleri + mesh builderlar
  systems/        # Cross-cutting yöneticiler (ItemManager.js)
  player/         # Player entity ve model builder
  controls/       # Input soyutlaması (DesktopControls, MobileControls stub)
```

## Mimari

İki render katmanı, iki canvas, aralarında paylaşılan state yok:

- **`#game-canvas`** — Three.js `WebGLRenderer`. 3D sahneye, kameraya, ışıklara ve tüm mesh'lere sahip.
- **`#ui-canvas`** — PixiJS `Application`, şeffaf, `pointer-events:none`, z-index 10. Tüm 2D HUD elemanlarına sahip.

`src/index.js` her şeyi birbirine bağlar. Sistem init sırası: Renderer → InputManager → UI → Scene/Room → Items → Player → CameraController → GameLoop.

### Core sistemler

| Sınıf | Dosya | Rol |
|---|---|---|
| `Renderer` | `core/Renderer.js` | `THREE.WebGLRenderer`'ı sarar; orthographic kamera resize işlemini yönetir (left/right/top/bottom) |
| `GameLoop` | `core/GameLoop.js` | `requestAnimationFrame`; önce `update(delta)` sonra `render()` çağırır; delta 50ms'de sınırlanır |
| `InputManager` | `core/InputManager.js` | `e.code` ile tuş durumu; mouse NDC koordinatları + butonlar |
| `CameraController` | `core/CameraController.js` | Ok tuşlarıyla izometrik kaydırma (9 u/s). Ok tuşları rezervedir — oyuncu hareketine **bağlı değildir** |

### Kamera

`THREE.OrthographicCamera`, `VIEW_SIZE=13`, `(18, 18, 18)` konumunda, origin'e bakar. İzometrik 45° açı. Oyun içi ekran eksenleri dünyaya şöyle eşlenir:

| Ekran | Dünya XZ |
|---|---|
| Sağ (D / →) | `(+x, -z)` |
| Sol (A / ←) | `(-x, +z)` |
| Yukarı (W / ↑) | `(-x, -z)` |
| Aşağı (S / ↓) | `(+x, +z)` |

### GymRoom

`src/scene/GymRoom.js` — `CELL=2`, `COLS=10`, `ROWS=8` → **20×16 dünya birimi**.

Zemin procedural bir `CanvasTexture` kullanır (hücre başına 128 px, çukur lastik fayans görünümü) ve `texture.repeat.set(COLS, ROWS)` ile her grid hücresine tam bir fayans gelir.

Duvarlar: yükseklik 1.5 (alçak, böylece izometrik kamera tüm odayı görür). Giriş boşluğu: ön duvarda 4 birim (z = +8).

`gridToWorld(col, row, colSpan, rowSpan)` grid koordinatlarını dünya uzayındaki merkeze çevirir. Slot'lar `gridCol`, `gridRow`, `gridColSpan`, `gridRowSpan`, `typeKey` ve `position` taşır.

### Item sistemi

Tüm item'lar data-driven'dır. Yeni bir item tipi eklemek = `itemTypes.js` içinde bir entry, yeni sınıf yok.

```
GymItem                     base: state, mesh (THREE.Group), interact(actor), update(delta)
├── OccupiableItem          usingPeople[], maxCapacity, queue[], queuePositions[], startSession/endSession
│   ├── Machine             aşınma bazlı bozulma şansı, repairTimer, NEEDS_REPAIR/BROKEN state'leri
│   └── SharedFeature       çok müşterili alanlar (boks ringi, mat alanı)
└── Utility                 stock/capacity, AVAILABLE/NEEDS_REFILL
    └── TowelBox            ikili cleanCount/dirtyCount, washComplete()
```

State renklendirmesi **yalnızca emissive** ile yapılır (material clone yok). Her builder çağrısı taze material instance'ları oluşturur, böylece yerinde emissive değişikliği güvenlidir.

`ItemManager` (`systems/ItemManager.js`) — `typeKey` ile factory, tüm item'ları tick eder, raycast'ler için `getAvailable(category)` ve `getByMeshId(itemId)` sağlar.

`meshBuilders.js` — TREADMILL, BENCH, BIKE, DUMBBELL_RACK için kompoze edilmiş `THREE.Group` modelleri. Bir grup içindeki her mesh, raycast lookup için `userData.itemId` ile etiketlenir.

### Player

`Player` (`player/Player.js`) — WASD hareketi, `SPEED=6.5` u/s, oda sınırlarına clamp'lenir. Hareket yönüne doğru yumuşak rotasyon (`ROT_SPEED=14` rad/s, kısa-yay lerp). Low-poly insansı model (amber tişört — müşterilerden ayırt edilir).

Controls soyutlaması: `getMovement() → {x, z}`. Mevcut implementasyon: `DesktopControls` (WASD). Stub: `MobileControls` (joystick `setJoystick(x,z)`, PixiJS UI tarafından çağrılır — henüz bağlı değil).

## Önemli konvansiyonlar

- **Açık string state enum'ları** — entity başına boolean flag yok (`'IDLE'`, `'IN_USE'` vb.)
- **Three.js ve PixiJS kesin olarak ayrıdır** — oyun mantığı Three.js uzayında; PixiJS yalnızca HUD render etmek için state okur
- **GSAP yalnızca UI geçişleri için** — karakter animasyonları için `AnimationMixer` (henüz implemente edilmedi)
- **Flat/toon shading** — `MeshPhongMaterial`, procedural zemin `CanvasTexture` dışında texture yok
- **Sabit makine slot'ları** — drag-and-drop yok; slot konumları `GymRoom.SLOT_DEFS` içinde tanımlı
- **Ok tuşları = kamera, WASD = oyuncu** — bu bind'ler asla çakışmaz

## Webpack asset yönetimi

`src/` içindeki asset'ler doğrudan import edilir; Webpack `dist/assets/` içine emit eder:
- Görseller/SVG → `assets/textures/`
- `.glb/.gltf/.fbx/.obj` → `assets/models/`
- Ses → `assets/audio/`
