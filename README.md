# PRISME — Femkanals spektral datalagring

> **Gem data i farvet lys.** Fem farver, fire styrker, ti bit per glimt.  
> Den femte kanal er usynlig for øjet men fordobler fejlrettelsen.  
> Pladen er glas, bruger nul strøm i hvile og holder i årtusinder.

---

## Hvad er PRISME?

PRISME er et optisk datalagringssystem, der bruger fem bølgelængder lys med fire intensitetsniveauer hver til at gemme data i glasplader. Hvor en CD bruger én laser med to tilstande (fordybning eller ej = 1 bit), bruger PRISME fem samtidige kanaler med fire trin hver — i alt **10 bit per lysglimt**.

| Kanal | Farve      | Bølgelængde | Rolle         | Bit  |
|-------|------------|-------------|---------------|------|
| R     | Rød        | 630 nm      | Data (bit 7–6)| 2    |
| G     | Grøn       | 530 nm      | Data (bit 5–4)| 2    |
| B     | Blå        | 470 nm      | Data (bit 3–2)| 2    |
| V     | Violet     | 410 nm      | Data (bit 1–0)| 2    |
| UV    | Ultraviolet| 405 nm      | Fejlkontrol   | 2    |

Fire datakanaler × 4 niveauer = **4⁴ = 256 tilstande = 1 byte**. Hele ASCII-tegnsættet i ét glimt. UV-kanalen bærer `(R+G+B+V) mod 4` og står helt fri til fejldetektion.

---

## Forbindelse til Chromaplex OS

PRISME er det fysiske lag under [Chromaplex OS](https://github.com/search?q=chromaplex-os). Chromaplex OS definerer den abstrakte datastruktur — facetter, dybder, numeriske payloads. PRISME definerer, *hvordan* de data faktisk skrives og læses i et fysisk medium:

```
┌─────────────────────────────────────────────────┐
│  Chromaplex OS v1/v2                            │
│  Abstrakt: facetter, dybder, NPP-payloads       │
│  Format: ChromaBridge numerisk protokol          │
└────────────────────────┬────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│  PRISME — spektral encoder                      │
│  Oversætter bytes til fem-kanals lysglimt        │
│  Tilføjer UV-kontrolsum og RS-fejlkodning        │
│  Pakker i OPTB v1 binærformat med CRC32          │
└────────────────────────┬────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│  Fysisk medium                                  │
│  5 buede dichroiske glasplader                   │
│  4 × 100 µm luftspalter                         │
│  Voxels med 1 µm afstand                        │
│  Læsning: hvidt lys + 5 fotodioder              │
│  Strøm i hvile: 0 W                             │
└─────────────────────────────────────────────────┘
```

Chromaplex OS håndterer *hvad* der gemmes. PRISME håndterer *hvordan* det gemmes. Sammen udgør de en komplet pipeline fra brugerdata til fysisk arkiv.

---

## Repository-indhold

```
PRISME/
├── README.md                          ← denne fil
├── prisme.html                        ← assembler, encoder og VM (åbn i browser)
├── PRISME_v2_Hardwareskematik.docx    ← teknisk dokument til forskere/ingeniører
├── PRISME_Komplet_Guide.docx          ← komplet guide til alle (inkl. indkøbsliste)
├── start-ors.bat                      ← starter simulatoren på Windows
└── optical-routing-simulator/         ← fysik- og compiler-simulator (Python/FastAPI)
    ├── pyproject.toml
    ├── src/optical_router/
    │   ├── physics.py                 ← Sellmeier-dispersion, Arrhenius-holdbarhed
    │   ├── compiler.py                ← OPTB v1 binær-compiler med CRC32
    │   ├── api.py                     ← FastAPI med /simulate/write og /stream
    │   ├── constants.py               ← fysiske konstanter
    │   ├── models.py                  ← datamodeller
    │   ├── service.py                 ← forretningslogik
    │   └── static/
    │       ├── index.html             ← dashboard med PRISME-encoder
    │       └── prisme.html            ← assembler (også tilgængelig via /prisme)
    └── tests/                         ← 19 tests (physics, compiler, API)
```

---

## Hurtig start

### 1. Prøv PRISME-encoderen nu (ingen installation)

Åbn `prisme.html` direkte i din browser. Den kører lokalt — ingen server, ingen afhængigheder. Du kan:

- Skrive assembly-kode og se den som lysglimt
- Klikke på hvert glimt for at se dets fem kanaler
- Skrive et tegn og se dets farvekodning
- Køre programmer på den virtuelle maskine

### 2. Kør den fulde simulator (kræver Python)

**Windows (dobbeltklik):**
Læg `start-ors.bat` i mappen `optical-routing-simulator/` og dobbeltklik.

**Linux / macOS / WSL:**
```bash
cd optical-routing-simulator
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
python3 -m optical_router --reload
```

Åbn `http://127.0.0.1:8000` — dashboard med PRISME-encoder, skrivevalidering og binær-compiler.
Åbn `http://127.0.0.1:8000/prisme` — assembler og VM.

### 3. Læs dokumentationen

| Dokument | Målgruppe | Indhold |
|----------|-----------|---------|
| `PRISME_Komplet_Guide.docx` | Alle | 17 sider. Hvad, hvorfor, hvordan. Indkøbsliste. Datacenter-regnestykke. |
| `PRISME_v2_Hardwareskematik.docx` | Ingeniører / forskere | 14 sider. Komponentspecifikationer, Pi 5-tilslutninger, faseplan. |

Begge kan importeres i Google Docs og eksporteres til PDF.

---

## Kodningssystemet

### Byte til lysglimt

Enhver byte (0–255) kodes som fire kvaternære cifre plus en kontrolsum:

```
Byte 72 ("H"):

  72 ÷ 64 = 1 rest 8    →  R = 1 (svag)
   8 ÷ 16 = 0 rest 8    →  G = 0 (slukket)
   8 ÷  4 = 2 rest 0    →  B = 2 (medium)
   0                     →  V = 0 (slukket)
   (1+0+2+0) mod 4 = 3  →  UV = 3 (fuld)

Base-4: 1020  |  Hex: 48  |  UV-check: 3
```

### Kapacitet

| Niveauer/kanal | Tilstande | Bit/glimt | Nyttelast       | SNR-krav |
|---------------|-----------|-----------|-----------------|----------|
| 2 (som CD)    | 32        | 5         | 4 bit + kontrol | ~6 dB    |
| **4 (PRISME)**| **1.024** | **10**    | **8 bit + 2**   | **~12 dB** |
| 8             | 32.768    | 15        | 12 bit + 3      | ~18 dB   |
| 16            | 1.048.576 | 20        | 16 bit + 4      | ~24 dB   |

Fire niveauer er det optimale punkt — gevinsten er størst, fejlraten stadig lav.

### UV-kanalen og Reed-Solomon

UV-kanalen opdager korrupte symboler og markerer dem som **udslettelser**. Reed-Solomon kan rette dobbelt så mange udslettelser som ukendte fejl med den samme mængde paritet. Den "spildte" femte kanal **fordobler fejlrettelseskapaciteten**.

Med RS(255,223) per blok: 16 paritetssymboler retter 16 fejl *eller* 32 udslettelser. UV-markering konverterer ukendte fejl til kendte udslettelser, så den effektive rettelseskapacitet er op til 32 symboler per blok.

---

## Fysisk design

### Pladestabel

```
    Hvidt lys ind
         ↓
┌──────────────────────────┐
│  Plade 1: RØD dichroisk  │  0,5 mm borosilicat
└──────────────────────────┘
      ~~~ 100 µm luft ~~~
┌──────────────────────────┐
│  Plade 2: GRØN dichroisk │  0,5 mm borosilicat
└──────────────────────────┘
      ~~~ 100 µm luft ~~~
┌──────────────────────────┐
│  Plade 3: BLÅ dichroisk  │  0,5 mm borosilicat
└──────────────────────────┘
      ~~~ 100 µm luft ~~~
┌──────────────────────────┐
│  Plade 4: VIOLET dichroisk│ 0,5 mm borosilicat
└──────────────────────────┘
      ~~~ 100 µm luft ~~~
┌──────────────────────────┐
│  Plade 5: UV-absorbent   │  0,5 mm borosilicat
└──────────────────────────┘
         ↓
   5 fotodioder med
   båndpasfiltre måler
   intensiteten per kanal
```

Total højde: ~3 mm. Pladerne er let buede (radius ~500 mm) for at holde lyset stabilt i kaviteten (Fabry-Pérot-princippet).

### Skrivning

Laser ændrer pladens lokale transmittans. Fire effektniveauer via DAC giver fire transmittanstrin:

| Niveau | Transmittans | Beskrivelse |
|--------|-------------|-------------|
| 0 | ~100% | Helt gennemsigtigt (ubelyst) |
| 1 | ~66% | Svag dæmpning |
| 2 | ~33% | Medium dæmpning |
| 3 | ~5% | Næsten opak |

**Prototype:** UV-belysning af SU-8 fotoresist (dosisafhængig). **Permanent:** Femtosekundlaser i fused silica (Type II nanogitre, holdbarhed >10²⁰ år).

### Læsning

Hvidt lys (eller 5 LED'er) ind fra toppen. 5 fotodioder med 10 nm båndpasfiltre i bunden. Én eksponering, alle kanaler simultant. Ingen bevægelige dele.

### Tæthed

| Parameter | Værdi |
|-----------|-------|
| Voxelafstand | 1 µm |
| Voxels per cm² | 10⁸ |
| Bit per voxel | 8 (4 kanaler × 2 bit) |
| **Kapacitet per cm²** | **100 MB** |
| Plade 10×10 mm | 100 MB |
| Plade 12 cm Ø (CD-størrelse) | ~10 GB |

---

## Strømforbrug og datacenter-besparelse

### Per enhed

| Tilstand | PRISME | SSD | HDD |
|----------|--------|-----|-----|
| Hvile | **0 W** | 0,5–1 W | 5–8 W |
| Læsning | <1 W | 2–5 W | 6–8 W |
| Skrivning | ~3 W | 2–5 W | 6–8 W |
| Holdbarhed | 1.000+ år | 5–10 år | 3–5 år |

### 10 PB koldt arkiv — årligt regnestykke

| Post | HDD (500 diske × 20 TB) | PRISME |
|------|-------------------------|--------|
| IT-strøm (hvile) | 500 × 5 W = 2.500 W | 0 W |
| Inkl. køling (PUE 1,4) | 3.500 W | 0 W |
| Energi per år | 30.660 kWh | 0 kWh |
| **Eludgift per år** | **45.990 kr.** | **0 kr.** |
| CO₂ per år | ~4,9 ton | 0 ton |
| Hardware-udskiftning (per 5 år) | 1.250.000 kr. | 0 kr. |
| **10-års totalomkostning** | **~2.960.000 kr.** | **Engangskost ved skrivning** |

---

## Instruktionssæt (PRISME-assembler)

Assembleren i `prisme.html` implementerer et komplet instruktionssæt, hvor opkode og operander er kodet i de fire synlige kanaler:

```
Byte = Klasse(R) | Operation(G) | Destination(B) | Kilde(V)
       bit 7–6      bit 5–4        bit 3–2          bit 1–0
```

| R·G | Instruktion | Virkning |
|-----|-------------|----------|
| 0·0 | NOP | Gør intet |
| 0·1 | HALT | Standser maskinen |
| 0·2 | OUT r | Udskriver register som tegn |
| 0·3 | EMIT r | Udskriver register som tal |
| 1·0 | ADD d, s | d = d + s |
| 1·1 | SUB d, s | d = d − s |
| 1·2 | MUL d, s | d = d × s |
| 1·3 | XOR d, s | d = d ⊻ s |
| 2·0 | SET d, #n | d = konstant (næste glimt) |
| 2·1 | MOV d, s | d = s |
| 2·2 | LOAD d, [s] | d = hukommelse[s] |
| 2·3 | STORE [d], s | hukommelse[d] = s |
| 3·0 | JMP adr | Spring til adresse |
| 3·1 | JZ adr | Spring hvis nulflag |
| 3·2 | JNZ adr | Spring hvis ikke nulflag |
| 3·3 | CMP d, s | Sammenlign, sæt nulflag |

4 registre (A, B, C, D), 256 bytes hukommelse. En hel instruktion ankommer som ét lysglimt.

---

## Fysik-simulator (optical-routing-simulator)

Simulatoren validerer den fysiske virkelighed bag PRISME:

| Modul | Hvad det beregner |
|-------|-------------------|
| `physics.py` | Sellmeier-dispersion (brydningsindeks per bølgelængde), sfærisk aberration ved dybdeskrivning, Arrhenius-holdbarhed for Type II nanogitre, Gauss peak-intensitet |
| `compiler.py` | Kvantisering af optiske tilstande, pakning i OPTB v1 binærformat med CRC32, timing for transmissionslinje (propagation, dispersion, sensor-bottleneck) |
| `api.py` | FastAPI: `/simulate/write` (skrive-validering), `/simulate/stream` (binær-kompilering) |

### Verificerede PRISME-kanalindeks (Sellmeier)

| Kanal | Tabuleret | Beregnet | Afvigelse |
|-------|----------|----------|-----------|
| R 630 nm | 1,4580 | 1,4571 | 0,06% |
| G 530 nm | 1,4613 | 1,4608 | 0,03% |
| B 470 nm | 1,4650 | 1,4641 | 0,06% |
| V 410 nm | 1,4701 | 1,4691 | 0,07% |
| UV 405 nm | 1,4706 | 1,4696 | 0,07% |

### Type II skrivning ved 405 nm

Simuleret med 0.55 NA, 500 nJ pulser, 300 fs:

- Effektiv intensitet: 25,49 TW/cm² (over 10 TW/cm² tærskel → Type II)
- Holdbarhed: 10²¹·⁵ år (nedre grænse 10²⁰·³ år)
- Voxelform: 0,45 µm lateralt × 81,2 µm aksialt

---

## Faseplan

| Fase | Mål | Budget | Tidsramme |
|------|-----|--------|-----------|
| 1 — Bevis | 100 bytes, 4 niveauer, UV-check, manuel positionering | ~7.000 kr. | 2–3 måneder |
| 2 — Automatisering | 10.000+ voxels, piezostage, kamera-læsning | ~25.000–40.000 kr. | 3–6 måneder |
| 3 — Permanent medium | Femtosekundskrivning i fused silica | ~100.000–250.000 kr. | 6–12 måneder |
| 4 — Rack-produktion | 20 enheder, netværk, sharding | ~500.000+ kr. | 12+ måneder |

Fase 3 kræver adgang til femtosekundlaser — et samarbejde med DTU Fotonik eller tilsvarende institution er den oplagte vej.

---

## Kendte begrænsninger og åbne spørgsmål

**Niveaudrift.** Fire niveauer i fotoresist driver over tid. Kalibreringsstribe på pladen + adaptiv kvantisering i software løser det. I fused silica (fase 3) er problemet elimineret — nanogitre er strukturelle, ikke kemiske.

**Krydsoverhøring.** Dichroiske filtre har endelig skarphed. Rød kan lække ind i grøn. Løsning: kanalmatrice i software (samme teknik som mobilkameraer bruger).

**Hastighed.** Prototype: sekunder per voxel. Galvospejle: ~100.000 voxels/s. Femtosekundlaser: ~1.000.000 voxels/s. For koldt arkiv er hastighed sekundært.

**Skalering.** Prototypen beviser fysikken. Skalering til gigabytes kræver præcisions-optomekanik, parallel læsning med kamera, og 1–2 års dedikeret ingeniørindsats.

---

## Relaterede repositories

- [chromaplex-os-compiler](https://github.com/search?q=chromaplex-os-compiler) — Chromaplex OS compiler
- [Cplex](https://github.com/search?q=Cplex+chromaplex) — Chromaplex kernebibliotek
- [chromaplex-os-v2](https://github.com/search?q=chromaplex-os-v2) — Chromaplex OS version 2
- [ChromaBridge](https://github.com/search?q=ChromaBridge) — Web3 datamigrations-pipeline med NPP (Numeric Payload Protocol)

---

## Licens

Se de individuelle filer for licensbetingelser.

---

*PRISME — Gem data i farvet lys — Juli 2026*

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Chromaplex OS v1/v2                            â”‚
â”‚  Abstrakt: facetter, dybder, NPP-payloads       â”‚
â”‚  Format: ChromaBridge numerisk protokol          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                         â”‚
                         â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  PRISME â€” spektral encoder                      â”‚
â”‚  OversÃ¦tter bytes til fem-kanals lysglimt        â”‚
â”‚  TilfÃ¸jer UV-kontrolsum og RS-fejlkodning        â”‚
â”‚  Pakker i OPTB v1 binÃ¦rformat med CRC32          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                         â”‚
                         â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Fysisk medium                                  â”‚
â”‚  5 buede dichroiske glasplader                   â”‚
â”‚  4 Ã— 100 Âµm luftspalter                         â”‚
â”‚  Voxels med 1 Âµm afstand â€” 100 MB/cmÂ²            â”‚
â”‚  StrÃ¸m i hvile: 0 W                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Repository-indhold

```
PRISME/
â”œâ”€â”€ README.md                            â† denne fil
â”œâ”€â”€ start-ors.bat                        â† starter simulatoren pÃ¥ Windows
â”œâ”€â”€ optical-routing-simulator.zip        â† fysik-simulator (Python/FastAPI)
â”‚
â”œâ”€â”€ docs/                                â† GitHub Pages + dokumentation
â”‚   â”œâ”€â”€ index.html                       â† PRISME-demo (GitHub Pages)
â”‚   â”œâ”€â”€ PRISME_Komplet_Guide.docx        â† guide til alle
â”‚   â””â”€â”€ PRISME_v2_Hardwareskematik.docx  â† teknisk dokument
â”‚
â””â”€â”€ demo/
    â””â”€â”€ prisme.html                      â† assembler og VM (Ã¥bn lokalt)
```

<details>
<summary>Hvad simulatoren indeholder (klik for at folde ud)</summary>

```
optical-routing-simulator/
â”œâ”€â”€ pyproject.toml
â”œâ”€â”€ Dockerfile
â”œâ”€â”€ Makefile
â”œâ”€â”€ src/optical_router/
â”‚   â”œâ”€â”€ physics.py          â† Sellmeier-dispersion, Arrhenius-holdbarhed
â”‚   â”œâ”€â”€ compiler.py         â† OPTB v1 binÃ¦r-compiler med CRC32
â”‚   â”œâ”€â”€ api.py              â† FastAPI: /simulate/write, /simulate/stream, /prisme
â”‚   â”œâ”€â”€ constants.py        â† fysiske konstanter (Boltzmann, Sellmeier-koeff.)
â”‚   â”œâ”€â”€ models.py           â† Pydantic-datamodeller
â”‚   â”œâ”€â”€ service.py          â† forretningslogik
â”‚   â”œâ”€â”€ errors.py           â† fejlhÃ¥ndtering
â”‚   â””â”€â”€ static/
â”‚       â”œâ”€â”€ index.html      â† dashboard med PRISME-encoder
â”‚       â””â”€â”€ prisme.html     â† assembler (ogsÃ¥ via /prisme)
â”œâ”€â”€ tests/                  â† 19 tests (physics, compiler, API)
â”‚   â”œâ”€â”€ test_physics.py
â”‚   â”œâ”€â”€ test_compiler.py
â”‚   â””â”€â”€ test_api.py
â””â”€â”€ examples/               â† eksempel-requests (JSON)
    â”œâ”€â”€ write-request.json
    â””â”€â”€ stream-request.json
```

</details>

---

## Hurtig start

### 1. Demo i browseren (ingen installation)

**Online:** [**â–¶ Ã…bn PRISME-demo**](https://Janus5G.github.io/PRISME/) â€” kÃ¸rer direkte i browseren.

**Lokalt:** Download og Ã¥bn `demo/prisme.html` i din browser.

### 2. KÃ¸r den fulde fysik-simulator

#### Linux / macOS / WSL (anbefalet)

Hent repo'et, udpak simulatoren, og start:

```bash
git clone https://github.com/Janus5G/PRISME.git
cd PRISME
unzip optical-routing-simulator.zip -d ors
cd ors
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
python3 -m optical_router --reload
```

Ã…bn i browseren:
- `http://127.0.0.1:8000` â€” dashboard med PRISME-encoder og fysik-simulator
- `http://127.0.0.1:8000/prisme` â€” assembler og VM

Stop med `Ctrl+C`.

#### Uden git (direkte download)

```bash
wget https://github.com/Janus5G/PRISME/archive/refs/heads/main.zip -O prisme.zip
unzip prisme.zip
cd PRISME-main
unzip optical-routing-simulator.zip -d ors
cd ors
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
python3 -m optical_router --reload
```

#### Windows (PowerShell)

```powershell
git clone https://github.com/Janus5G/PRISME.git
cd PRISME
Expand-Archive -Path optical-routing-simulator.zip -DestinationPath ors -Force
cd ors
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m optical_router --reload
```

Eller dobbeltklik `start-ors.bat` i simulator-mappen.

#### KÃ¸r tests

```bash
pytest -v    # 19 tests: physics, compiler, API
```

---

## SÃ¥dan virker det

### Byte til lysglimt

Enhver byte (0â€“255) kodes som fire kvaternÃ¦re cifre plus en kontrolsum:

```
Byte 72 ("H"):

  72 Ã· 64 = 1 rest 8    â†’  R = 1 (svag)
   8 Ã· 16 = 0 rest 8    â†’  G = 0 (slukket)
   8 Ã·  4 = 2 rest 0    â†’  B = 2 (medium)
   0                     â†’  V = 0 (slukket)
   (1+0+2+0) mod 4 = 3  â†’  UV = 3 (fuld)

Base-4: 1020  |  Hex: 48  |  UV-check: 3
```

### UV-kanalen og Reed-Solomon

UV-kanalen opdager korrupte symboler og markerer dem som **udslettelser**. Reed-Solomon kan rette dobbelt sÃ¥ mange udslettelser som ukendte fejl. Med RS(255,223): 16 paritetssymboler retter 16 fejl *eller* **32 udslettelser**. Den "spildte" femte kanal fordobler fejlrettelseskapaciteten.

### Pladedesign

```
    Hvidt lys ind
         â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Plade 1: RÃ˜D dichroisk  â”‚  0,5 mm glas
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
      ~~~ 100 Âµm luft ~~~
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Plade 2: GRÃ˜N dichroisk â”‚  0,5 mm glas
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
      ~~~ 100 Âµm luft ~~~
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Plade 3: BLÃ… dichroisk  â”‚  0,5 mm glas
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
      ~~~ 100 Âµm luft ~~~
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Plade 4: VIOLET dichroiskâ”‚ 0,5 mm glas
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
      ~~~ 100 Âµm luft ~~~
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Plade 5: UV kontrol     â”‚  0,5 mm glas
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
         â†“
   5 fotodioder mÃ¥ler lyset
```

Total hÃ¸jde: ~3 mm. Buede plader (radius ~500 mm) holder lyset stabilt (Fabry-PÃ©rot).

---

## StrÃ¸mbesparelse: datacenter-regnestykke

### Per enhed

| Tilstand | PRISME | SSD | HDD |
|----------|--------|-----|-----|
| Hvile | **0 W** | 0,5â€“1 W | 5â€“8 W |
| Holdbarhed | 1.000+ Ã¥r | 5â€“10 Ã¥r | 3â€“5 Ã¥r |

### 10 PB koldt arkiv â€” 1 Ã¥r

| | HDD (500 Ã— 20 TB) | PRISME |
|---|---|---|
| StrÃ¸m i hvile | 2.500 W dÃ¸gnet rundt | 0 W |
| Med kÃ¸ling (PUE 1,4) | 3.500 W | 0 W |
| Energi per Ã¥r | 30.660 kWh | 0 kWh |
| **Eludgift per Ã¥r** | **45.990 kr.** | **0 kr.** |
| COâ‚‚ per Ã¥r | ~4,9 ton | 0 ton |

### Over tid

| Tidsramme | HDD (strÃ¸m + hardware) | PRISME | Besparelse |
|-----------|------------------------|--------|------------|
| 1 Ã¥r | 45.990 kr. | 0 kr. | 45.990 kr. |
| 5 Ã¥r | 1.480.000 kr. | 0 kr. | ~1,5 mio. kr. |
| 10 Ã¥r | 2.960.000 kr. | 0 kr. | ~3 mio. kr. |

---

## InstruktionssÃ¦t

Opkode og operander kodet i fire synlige kanaler: `R = klasse, G = operation, B = destination, V = kilde`.

| RÂ·G | Instruktion | Virkning |
|-----|-------------|----------|
| 0Â·0 | `NOP` | GÃ¸r intet |
| 0Â·1 | `HALT` | Standser maskinen |
| 0Â·2 | `OUT r` | Udskriver register som tegn |
| 0Â·3 | `EMIT r` | Udskriver register som tal |
| 1Â·0 | `ADD d, s` | d = d + s |
| 1Â·1 | `SUB d, s` | d = d âˆ’ s |
| 1Â·2 | `MUL d, s` | d = d Ã— s |
| 1Â·3 | `XOR d, s` | d = d âŠ» s |
| 2Â·0 | `SET d, #n` | d = konstant |
| 2Â·1 | `MOV d, s` | d = s |
| 2Â·2 | `LOAD d, [s]` | d = hukommelse[s] |
| 2Â·3 | `STORE [d], s` | hukommelse[d] = s |
| 3Â·0 | `JMP adr` | Spring til adresse |
| 3Â·1 | `JZ adr` | Spring hvis nulflag |
| 3Â·2 | `JNZ adr` | Spring hvis ikke nulflag |
| 3Â·3 | `CMP d, s` | Sammenlign, sÃ¦t nulflag |

4 registre (A, B, C, D) Â· 256 bytes hukommelse Â· Ã©n instruktion per lysglimt.

---

## Fysik-simulator

| Modul | Beregner |
|-------|----------|
| `physics.py` | Sellmeier-dispersion, sfÃ¦risk aberration, Arrhenius-holdbarhed, peak-intensitet |
| `compiler.py` | Kvantisering, OPTB v1 binÃ¦r med CRC32, transmissions-timing |
| `api.py` | `/simulate/write` (skrive-validering) og `/simulate/stream` (binÃ¦r-kompilering) |

### Verificerede kanalindeks

| Kanal | Tabuleret | Beregnet (Sellmeier) | Afvigelse |
|-------|----------|----------|-----------|
| R 630 nm | 1,4580 | 1,4571 | 0,06% |
| G 530 nm | 1,4613 | 1,4608 | 0,03% |
| B 470 nm | 1,4650 | 1,4641 | 0,06% |
| V 410 nm | 1,4701 | 1,4691 | 0,07% |
| UV 405 nm | 1,4706 | 1,4696 | 0,07% |

---

## Faseplan

| Fase | MÃ¥l | Budget | Tid |
|------|-----|--------|-----|
| 1 â€” Bevis | 100 bytes, 4 niveauer, UV-check | ~7.000 kr. | 2â€“3 mdr. |
| 2 â€” Automatisering | 10.000+ voxels, piezo, kamera | ~25.000â€“40.000 kr. | 3â€“6 mdr. |
| 3 â€” Permanent | Femtosekundlaser i fused silica | ~100.000â€“250.000 kr. | 6â€“12 mdr. |
| 4 â€” Produktion | 20 enheder, netvÃ¦rk, sharding | ~500.000+ kr. | 12+ mdr. |

Fase 3 krÃ¦ver adgang til femtosekundlaser â€” samarbejde med DTU Fotonik eller tilsvarende.

---

## IndkÃ¸bsliste (prototype)

| Komponent | Pris |
|-----------|------|
| Raspberry Pi 5 (4 GB) | 600 kr. |
| 4 laserdioder (405â€“635 nm) | 800 kr. |
| 5 LED'er til aflÃ¦sning | 250 kr. |
| 5 bÃ¥ndpasfiltre (10 nm) | 2.500 kr. |
| 5 fotodioder (BPW34) | 150 kr. |
| DAC (MCP4728) + ADC (MCP3208) | 110 kr. |
| Objektglas + SU-8 fotoresist | 500 kr. |
| XY-mikrometerslÃ¦de | 800 kr. |
| StrÃ¸mforsyning + kabler + diverse | 1.000 kr. |
| **Total** | **~6.700 kr.** |

Alt kan kÃ¸bes online. Ingen specialkomponenter.

---

## Relaterede repositories

- [chromaplex-os-compiler](https://github.com/search?q=chromaplex-os-compiler) â€” Chromaplex OS compiler
- [Cplex](https://github.com/search?q=Cplex+chromaplex) â€” Chromaplex kernebibliotek
- [chromaplex-os-v2](https://github.com/search?q=chromaplex-os-v2) â€” Chromaplex OS version 2
- [ChromaBridge](https://github.com/search?q=ChromaBridge) â€” Web3 datamigrations-pipeline med NPP

---

## Licens

Se de individuelle filer for licensbetingelser.

---

*PRISME â€” Gem data i farvet lys â€” Juli 2026*

