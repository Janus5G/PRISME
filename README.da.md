![Tests](https://img.shields.io/badge/tests-41%20passed-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Channels](https://img.shields.io/badge/channels-R%20G%20B%20V%20UV-blueviolet) ![Bits](https://img.shields.io/badge/bits%2Fflash-10-green)

> :gb: [Read in English](README.md)


# PRISME — Femkanals spektral datalagring

> **Gem data i farvet lys.** Fem farver, fire styrker, ti bit per glimt.  
> Den femte kanal er usynlig for øjet men fordobler fejlrettelsen.  
> Pladen er glas, bruger nul strøm i hvile og holder i årtusinder.

---

## ▶ Prøv det nu

**[Åbn PRISME-demo i din browser](https://Janus5G.github.io/PRISME/)** — ingen installation, kører direkte.

Du kan skrive assembly-kode, se hvert tegn som et lysglimt med fem farvekanaler, og køre programmer på den virtuelle maskine. Alt foregår lokalt i browseren.

> ⚠️ Opdater linket ovenfor med dit eget GitHub-brugernavn hvis det er et andet repo.  
> Aktivér GitHub Pages: **Settings → Pages → Source: Deploy from a branch → Branch: main, /docs → Save**

---

## Dokumentation

| Dokument | Målgruppe | Download |
|----------|-----------|----------|
| [Komplet Guide](docs/PRISME_Komplet_Guide.docx) | Alle — 17 sider med indkøbsliste og datacenter-regnestykke | `.docx` (Google Docs-kompatibel) |
| [Hardwareskematik v2](docs/PRISME_v2_Hardwareskematik.docx) | Ingeniører / forskere — 14 sider med komponentspecifikationer | `.docx` (Google Docs-kompatibel) |

---

## Hvad er PRISME?

PRISME er et optisk datalagringssystem, der bruger fem bølgelængder lys med fire intensitetsniveauer til at gemme data i glasplader. Hvor en CD bruger én laser med to tilstande (1 bit), bruger PRISME fem samtidige kanaler med fire trin — **10 bit per lysglimt**.

| Kanal | Farve | Bølgelængde | Rolle | Bit |
|-------|-------|-------------|-------|-----|
| R | Rød | 630 nm | Data (bit 7–6) | 2 |
| G | Grøn | 530 nm | Data (bit 5–4) | 2 |
| B | Blå | 470 nm | Data (bit 3–2) | 2 |
| V | Violet | 410 nm | Data (bit 1–0) | 2 |
| UV | Ultraviolet | 405 nm | Fejlkontrol | 2 |

Fire datakanaler × 4 niveauer = **4⁴ = 256 tilstande = 1 byte**. Hele tegnsættet i ét glimt. UV-kanalen bærer `(R+G+B+V) mod 4` og fordobler Reed-Solomon-fejlrettelsen.

---

## Forbindelse til Chromaplex OS

PRISME er det fysiske lag under [Chromaplex OS](https://github.com/search?q=chromaplex-os). Chromaplex definerer den abstrakte datastruktur — facetter, dybder, numeriske payloads. PRISME definerer, *hvordan* de data skrives og læses i glas:

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
│  Voxels med 1 µm afstand — 100 MB/cm²            │
│  Strøm i hvile: 0 W                             │
└─────────────────────────────────────────────────┘
```

---

## Repository-indhold

```
PRISME/
├── README.md                            ← denne fil
├── start-ors.bat                        ← starter simulatoren på Windows
├── optical-routing-simulator.zip        ← fysik-simulator (Python/FastAPI)
│
├── docs/                                ← GitHub Pages + dokumentation
│   ├── index.html                       ← PRISME-demo (GitHub Pages)
│   ├── PRISME_Komplet_Guide.docx        ← guide til alle
│   └── PRISME_v2_Hardwareskematik.docx  ← teknisk dokument
│
└── demo/
    └── prisme.html                      ← assembler og VM (åbn lokalt)
```

<details>
<summary>Hvad simulatoren indeholder (klik for at folde ud)</summary>

```
optical-routing-simulator/
├── pyproject.toml
├── Dockerfile
├── Makefile
├── src/optical_router/
│   ├── physics.py          ← Sellmeier-dispersion, Arrhenius-holdbarhed
│   ├── compiler.py         ← OPTB v1 binær-compiler med CRC32
│   ├── api.py              ← FastAPI: /simulate/write, /simulate/stream, /prisme
│   ├── constants.py        ← fysiske konstanter (Boltzmann, Sellmeier-koeff.)
│   ├── models.py           ← Pydantic-datamodeller
│   ├── service.py          ← forretningslogik
│   ├── errors.py           ← fejlhåndtering
│   └── static/
│       ├── index.html      ← dashboard med PRISME-encoder
│       └── prisme.html     ← assembler (også via /prisme)
├── tests/                  ← 19 tests (physics, compiler, API)
│   ├── test_physics.py
│   ├── test_compiler.py
│   └── test_api.py
└── examples/               ← eksempel-requests (JSON)
    ├── write-request.json
    └── stream-request.json
```

</details>

---

## Hurtig start

### 1. Demo i browseren (ingen installation)

**Online:** [**▶ Åbn PRISME-demo**](https://Janus5G.github.io/PRISME/) — kører direkte i browseren.

**Lokalt:** Download og åbn `demo/prisme.html` i din browser.

### 2. Kør den fulde fysik-simulator

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

Åbn i browseren:
- `http://127.0.0.1:8000` — dashboard med PRISME-encoder og fysik-simulator
- `http://127.0.0.1:8000/prisme` — assembler og VM

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

#### Kør tests

```bash
pytest -v    # 19 tests: physics, compiler, API
```

---

## Sådan virker det

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

### UV-kanalen og Reed-Solomon

UV-kanalen opdager korrupte symboler og markerer dem som **udslettelser**. Reed-Solomon kan rette dobbelt så mange udslettelser som ukendte fejl. Med RS(255,223): 16 paritetssymboler retter 16 fejl *eller* **32 udslettelser**. Den "spildte" femte kanal fordobler fejlrettelseskapaciteten.

### Pladedesign

```
    Hvidt lys ind
         ↓
┌──────────────────────────┐
│  Plade 1: RØD dichroisk  │  0,5 mm glas
└──────────────────────────┘
      ~~~ 100 µm luft ~~~
┌──────────────────────────┐
│  Plade 2: GRØN dichroisk │  0,5 mm glas
└──────────────────────────┘
      ~~~ 100 µm luft ~~~
┌──────────────────────────┐
│  Plade 3: BLÅ dichroisk  │  0,5 mm glas
└──────────────────────────┘
      ~~~ 100 µm luft ~~~
┌──────────────────────────┐
│  Plade 4: VIOLET dichroisk│ 0,5 mm glas
└──────────────────────────┘
      ~~~ 100 µm luft ~~~
┌──────────────────────────┐
│  Plade 5: UV kontrol     │  0,5 mm glas
└──────────────────────────┘
         ↓
   5 fotodioder måler lyset
```

Total højde: ~3 mm. Buede plader (radius ~500 mm) holder lyset stabilt (Fabry-Pérot).

---

## Strømbesparelse: datacenter-regnestykke

### Per enhed

| Tilstand | PRISME | SSD | HDD |
|----------|--------|-----|-----|
| Hvile | **0 W** | 0,5–1 W | 5–8 W |
| Holdbarhed | 1.000+ år | 5–10 år | 3–5 år |

### 10 PB koldt arkiv — 1 år

| | HDD (500 × 20 TB) | PRISME |
|---|---|---|
| Strøm i hvile | 2.500 W døgnet rundt | 0 W |
| Med køling (PUE 1,4) | 3.500 W | 0 W |
| Energi per år | 30.660 kWh | 0 kWh |
| **Eludgift per år** | **45.990 kr.** | **0 kr.** |
| CO₂ per år | ~4,9 ton | 0 ton |

### Over tid

| Tidsramme | HDD (strøm + hardware) | PRISME | Besparelse |
|-----------|------------------------|--------|------------|
| 1 år | 45.990 kr. | 0 kr. | 45.990 kr. |
| 5 år | 1.480.000 kr. | 0 kr. | ~1,5 mio. kr. |
| 10 år | 2.960.000 kr. | 0 kr. | ~3 mio. kr. |

---

## Instruktionssæt

Opkode og operander kodet i fire synlige kanaler: `R = klasse, G = operation, B = destination, V = kilde`.

| R·G | Instruktion | Virkning |
|-----|-------------|----------|
| 0·0 | `NOP` | Gør intet |
| 0·1 | `HALT` | Standser maskinen |
| 0·2 | `OUT r` | Udskriver register som tegn |
| 0·3 | `EMIT r` | Udskriver register som tal |
| 1·0 | `ADD d, s` | d = d + s |
| 1·1 | `SUB d, s` | d = d − s |
| 1·2 | `MUL d, s` | d = d × s |
| 1·3 | `XOR d, s` | d = d ⊻ s |
| 2·0 | `SET d, #n` | d = konstant |
| 2·1 | `MOV d, s` | d = s |
| 2·2 | `LOAD d, [s]` | d = hukommelse[s] |
| 2·3 | `STORE [d], s` | hukommelse[d] = s |
| 3·0 | `JMP adr` | Spring til adresse |
| 3·1 | `JZ adr` | Spring hvis nulflag |
| 3·2 | `JNZ adr` | Spring hvis ikke nulflag |
| 3·3 | `CMP d, s` | Sammenlign, sæt nulflag |

4 registre (A, B, C, D) · 256 bytes hukommelse · én instruktion per lysglimt.

---

## Fysik-simulator

| Modul | Beregner |
|-------|----------|
| `physics.py` | Sellmeier-dispersion, sfærisk aberration, Arrhenius-holdbarhed, peak-intensitet |
| `compiler.py` | Kvantisering, OPTB v1 binær med CRC32, transmissions-timing |
| `api.py` | `/simulate/write` (skrive-validering) og `/simulate/stream` (binær-kompilering) |

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

| Fase | Mål | Budget | Tid |
|------|-----|--------|-----|
| 1 — Bevis | 100 bytes, 4 niveauer, UV-check | ~7.000 kr. | 2–3 mdr. |
| 2 — Automatisering | 10.000+ voxels, piezo, kamera | ~25.000–40.000 kr. | 3–6 mdr. |
| 3 — Permanent | Femtosekundlaser i fused silica | ~100.000–250.000 kr. | 6–12 mdr. |
| 4 — Produktion | 20 enheder, netværk, sharding | ~500.000+ kr. | 12+ mdr. |

Fase 3 kræver adgang til femtosekundlaser — samarbejde med DTU Fotonik eller tilsvarende.

---

## Indkøbsliste (prototype)

| Komponent | Pris |
|-----------|------|
| Raspberry Pi 5 (4 GB) | 600 kr. |
| 4 laserdioder (405–635 nm) | 800 kr. |
| 5 LED'er til aflæsning | 250 kr. |
| 5 båndpasfiltre (10 nm) | 2.500 kr. |
| 5 fotodioder (BPW34) | 150 kr. |
| DAC (MCP4728) + ADC (MCP3208) | 110 kr. |
| Objektglas + SU-8 fotoresist | 500 kr. |
| XY-mikrometerslæde | 800 kr. |
| Strømforsyning + kabler + diverse | 1.000 kr. |
| **Total** | **~6.700 kr.** |

Alt kan købes online. Ingen specialkomponenter.

---

## Relaterede repositories

- [chromaplex-os-compiler](https://github.com/search?q=chromaplex-os-compiler) — Chromaplex OS compiler
- [Cplex](https://github.com/search?q=Cplex+chromaplex) — Chromaplex kernebibliotek
- [chromaplex-os-v2](https://github.com/search?q=chromaplex-os-v2) — Chromaplex OS version 2
- [ChromaBridge](https://github.com/search?q=ChromaBridge) — Web3 datamigrations-pipeline med NPP

---

## Licens

Dette projekt er licenseret under [MIT-licensen](LICENSE).

---

*PRISME — Gem data i farvet lys — Juli 2026*
