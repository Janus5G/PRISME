# PRISME â€” Femkanals spektral datalagring

> **Gem data i farvet lys.** Fem farver, fire styrker, ti bit per glimt.  
> Den femte kanal er usynlig for Ã¸jet men fordobler fejlrettelsen.  
> Pladen er glas, bruger nul strÃ¸m i hvile og holder i Ã¥rtusinder.

---

## â–¶ PrÃ¸v det nu

**[Ã…bn PRISME-demo i din browser](https://Janus5G.github.io/PRISME/)** â€” ingen installation, kÃ¸rer direkte.

Du kan skrive assembly-kode, se hvert tegn som et lysglimt med fem farvekanaler, og kÃ¸re programmer pÃ¥ den virtuelle maskine. Alt foregÃ¥r lokalt i browseren.

> âš ï¸ Opdater linket ovenfor med dit eget GitHub-brugernavn hvis det er et andet repo.  
> AktivÃ©r GitHub Pages: **Settings â†’ Pages â†’ Source: Deploy from a branch â†’ Branch: main, /docs â†’ Save**

---

## Dokumentation

| Dokument | MÃ¥lgruppe | Download |
|----------|-----------|----------|
| [Komplet Guide](docs/PRISME_Komplet_Guide.docx) | Alle â€” 17 sider med indkÃ¸bsliste og datacenter-regnestykke | `.docx` (Google Docs-kompatibel) |
| [Hardwareskematik v2](docs/PRISME_v2_Hardwareskematik.docx) | IngeniÃ¸rer / forskere â€” 14 sider med komponentspecifikationer | `.docx` (Google Docs-kompatibel) |

---

## Hvad er PRISME?

PRISME er et optisk datalagringssystem, der bruger fem bÃ¸lgelÃ¦ngder lys med fire intensitetsniveauer til at gemme data i glasplader. Hvor en CD bruger Ã©n laser med to tilstande (1 bit), bruger PRISME fem samtidige kanaler med fire trin â€” **10 bit per lysglimt**.

| Kanal | Farve | BÃ¸lgelÃ¦ngde | Rolle | Bit |
|-------|-------|-------------|-------|-----|
| R | RÃ¸d | 630 nm | Data (bit 7â€“6) | 2 |
| G | GrÃ¸n | 530 nm | Data (bit 5â€“4) | 2 |
| B | BlÃ¥ | 470 nm | Data (bit 3â€“2) | 2 |
| V | Violet | 410 nm | Data (bit 1â€“0) | 2 |
| UV | Ultraviolet | 405 nm | Fejlkontrol | 2 |

Fire datakanaler Ã— 4 niveauer = **4â´ = 256 tilstande = 1 byte**. Hele tegnsÃ¦ttet i Ã©t glimt. UV-kanalen bÃ¦rer `(R+G+B+V) mod 4` og fordobler Reed-Solomon-fejlrettelsen.

---

## Forbindelse til Chromaplex OS

PRISME er det fysiske lag under [Chromaplex OS](https://github.com/search?q=chromaplex-os). Chromaplex definerer den abstrakte datastruktur â€” facetter, dybder, numeriske payloads. PRISME definerer, *hvordan* de data skrives og lÃ¦ses i glas:

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

