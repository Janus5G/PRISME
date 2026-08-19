![Tests](https://img.shields.io/badge/tests-41%20passed-brightgreen) ![License](https://img.shields.io/badge/license-All%20rights%20reserved-darkred) ![Channels](https://img.shields.io/badge/channels-R%20G%20B%20V%20UV-blueviolet) ![Bits](https://img.shields.io/badge/bits%2Fflash-10-green)

> :uk: [Read in English](README.md)

# PRISME -- Femkanals spektral datalagring

> **Gem data i farvet lys.** Fem farver, fire intensitetsniveauer, ti bit pr. lysglimt.  
> Den femte kanal er usynlig for øjet og fordobler fejlkorrektionskapaciteten.  
> Mediet er glas, bruger nul strøm i hvile og er designet til meget lang levetid.

---

## Prøv det nu

[▶ Åbn PRISME-glaspladedemoen](https://janus5g.github.io/PRISME/demo/prisme.html)

Skriv assembly-kode, se hvert tegn som et lysglimt på fem farvekanaler, og kør programmer på den virtuelle maskine. Alt kører lokalt i browseren.

![PRISME Encoder — tekst til spektrale lysglimt](assets/prisme-encoder-screenshot.png)

---

## ESP32-S3 Controller Simulator

Kør PRISME ESP32-S3 controller-simuleringen direkte i Wokwi:

[Åbn PRISME ESP32-S3 Controller Simulator](https://wokwi.com/projects/471448316897809409)

Simulatoren indeholder de fem spektrale outputs (R, G, B, Violet og UV/control), et ILI9341-statusdisplay, lokale Start/Stop/Test-kontroller, seriel JSONL-kommunikation, simuleret readback og CRC32-verifikation.

> Dette er en laboratoriesoftware-simulering. Den repræsenterer ikke valideret fysisk optisk timing, laserstyring eller ydelse ved skrivning i glas.

---

## Dokumentation

| Dokument | Målgruppe | Download |
|----------|-----------|----------|
| [Komplet guide](docs/PRISME_Komplet_Guide.docx) | Alle -- 17 sider med indkøbsliste og datacenterberegninger | `.docx` (Google Docs-kompatibel) |
| [Hardwarediagram v2](docs/PRISME_v2_Hardwareskematik.docx) | Ingeniører / forskere -- 14 sider med komponentspecifikationer | `.docx` (Google Docs-kompatibel) |
| [University Validation Proposal](docs/PRISME_University_Validation_Proposal.docx) | DTU / universitetslaboratorier -- uafhængig proof-of-concept-protokol med testbare hypoteser | `.docx` |

---

## Hvad er PRISME?

PRISME er et optisk datalagringssystem, der bruger fem bølgelængder af lys med fire intensitetsniveauer hver til at lagre data i glasplader. Hvor en CD bruger én laser med to tilstande (1 bit), bruger PRISME fem samtidige kanaler med fire niveauer -- **10 bit pr. lysglimt**.

| Kanal | Farve | Bølgelængde | Rolle | Bit |
|-------|-------|-------------|-------|-----|
| R | Rød | 630 nm | Data (bit 7-6) | 2 |
| G | Grøn | 530 nm | Data (bit 5-4) | 2 |
| B | Blå | 470 nm | Data (bit 3-2) | 2 |
| V | Violet | 410 nm | Data (bit 1-0) | 2 |
| UV | Ultraviolet | 405 nm | Fejlkontrol | 2 |

Fire datakanaler x 4 niveauer = **4^4 = 256 tilstande = 1 byte**. Hele byteområdet kan repræsenteres i ét lysglimt. UV-kanalen bærer `(R+G+B+V) mod 4` og fordobler Reed-Solomon-fejlkorrektionskapaciteten.

---

## Forbindelse til Chromaplex OS

PRISME er det fysiske lag under [Chromaplex OS](https://github.com/search?q=chromaplex-os). Chromaplex definerer den abstrakte datastruktur -- facetter, dybder og numeriske payloads. PRISME definerer *hvordan* disse data skrives og læses i glas:

```text
+--------------------------------------------------+
|  Chromaplex OS v1/v2                             |
|  Abstrakt: facetter, dybder, NPP-payloads        |
|  Format: ChromaBridge numerisk protokol           |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
|  PRISME -- spektral encoder                      |
|  Oversætter bytes til femkanals lysglimt          |
|  Tilføjer UV-checksum og RS-fejlkodning           |
|  Pakker i OPTB v1-binærformat med CRC32           |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
|  Fysisk medie                                    |
|  5 buede dikroiske glasplader                    |
|  4 x 100 um luftmellemrum                        |
|  Voxels ved 1 um afstand -- 100 MB/cm2            |
|  Strømforbrug i hvile: 0 W                       |
+--------------------------------------------------+
```

---

## Repository-indhold

```text
PRISME/
+-- README.md                            <-- engelsk version
+-- README.da.md                         <-- denne fil (dansk)
+-- LICENSE                              <-- All rights reserved
+-- start-ors.bat                        <-- starter simulatoren på Windows
+-- optical-routing-simulator.zip        <-- fysiksimulator (Python/FastAPI)
|
+-- docs/                                <-- dokumentation
|   +-- index.html                       <-- dokumentations-/projektside
|   +-- PRISME_Komplet_Guide.docx        <-- komplet guide
|   +-- PRISME_v2_Hardwareskematik.docx  <-- teknisk dokument
|
+-- demo/
|   +-- prisme.html                      <-- browser-assembler og VM
|   +-- app.js                           <-- browserdemo-logik
|
+-- tests/
    +-- test_prisme.py                   <-- 41 tests
```

<details>
<summary>Simulatorens indhold (klik for at udvide)</summary>

```text
optical-routing-simulator/
+-- pyproject.toml
+-- Dockerfile
+-- Makefile
+-- src/optical_router/
|   +-- physics.py          <-- Sellmeier-dispersion, Arrhenius-retention
|   +-- compiler.py         <-- OPTB v1-binær compiler med CRC32
|   +-- api.py              <-- FastAPI: /simulate/write, /simulate/stream, /prisme
|   +-- constants.py        <-- fysiske konstanter (Boltzmann, Sellmeier-koefficienter)
|   +-- models.py           <-- Pydantic-datamodeller
|   +-- service.py          <-- forretningslogik
|   +-- errors.py           <-- fejlhåndtering
|   +-- static/
|       +-- index.html      <-- dashboard med PRISME-encoder
|       +-- prisme.html     <-- assembler (også via /prisme)
+-- tests/                  <-- 19 tests (fysik, compiler, API)
+-- examples/               <-- eksempelrequests (JSON)
```

</details>

---

## Hurtig start

### 1. Browserdemo (ingen installation)

**Online:** [**Åbn PRISME-demoen**](https://janus5g.github.io/PRISME/demo/prisme.html) — kører direkte i browseren.

**Lokalt:** Download og åbn `demo/prisme.html` i din browser.

### 2. Kør den komplette fysiksimulator

#### Linux / macOS / WSL (anbefalet)

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

Åbn derefter i browseren:

- `http://127.0.0.1:8000` -- dashboard med PRISME-encoder og fysiksimulator
- `http://127.0.0.1:8000/prisme` -- assembler og VM

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

Eller dobbeltklik på `start-ors.bat` i simulator-mappen.

#### Kør tests

```bash
python tests/test_prisme.py           # 41 PRISME-tests
cd ors && pytest -v                   # 19 simulator-tests (fysik, compiler, API)
```

---

## Sådan virker det

### Byte til lysglimt

Enhver byte (0-255) kodes som fire kvartære cifre plus en checksum:

```text
Byte 72 ("H"):

   72 / 64 = 1 rest 8          ->  R = 1 (svag)
    8 / 16 = 0 rest 8          ->  G = 0 (slukket)
    8 /  4 = 2 rest 0          ->  B = 2 (mellem)
    0                           ->  V = 0 (slukket)
    (1+0+2+0) mod 4 = 3        ->  UV = 3 (fuld)

Base-4: 1020  |  Hex: 48  |  UV-check: 3
```

### UV-kanal og Reed-Solomon

UV-kanalen registrerer korrupte symboler og markerer dem som **erasures**. Reed-Solomon kan korrigere dobbelt så mange kendte erasures som ukendte fejl. Med RS(255,223): 16 paritetssymboler korrigerer 16 fejl *eller* **32 erasures**. Den femte kanal fordobler dermed fejlkorrektionskapaciteten.

### Pladedesign

```text
    Hvidt lys ind
         |
+----------------------------+
|  Plade 1: RØD dikroisk     |  0.5 mm glas
+----------------------------+
      ~~~ 100 um luft ~~~
+----------------------------+
|  Plade 2: GRØN dikroisk    |  0.5 mm glas
+----------------------------+
      ~~~ 100 um luft ~~~
+----------------------------+
|  Plade 3: BLÅ dikroisk     |  0.5 mm glas
+----------------------------+
      ~~~ 100 um luft ~~~
+----------------------------+
|  Plade 4: VIOLET dikroisk  |  0.5 mm glas
+----------------------------+
      ~~~ 100 um luft ~~~
+----------------------------+
|  Plade 5: UV-kontrol       |  0.5 mm glas
+----------------------------+
         |
   5 fotodioder måler
   transmitteret intensitet
```

Samlet højde: ~3 mm. Buede plader (radius ~500 mm) holder lyset stabilt i kaviteten (Fabry-Perot-princippet).

---

## Strømbesparelse: datacenterberegning

### Pr. enhed

| Tilstand | PRISME | SSD | HDD |
|----------|--------|-----|-----|
| Hvile | **0 W** | 0.5-1 W | 5-8 W |
| Levetid | 1.000+ år | 5-10 år | 3-5 år |

### 10 PB koldarkiv -- 1 år

| | HDD (500 x 20 TB) | PRISME |
|---|---|---|
| Strømforbrug i hvile | 2.500 W døgnet rundt | 0 W |
| Med køling (PUE 1.4) | 3.500 W | 0 W |
| Energi pr. år | 30.660 kWh | 0 kWh |
| **Elpris/år** | **EUR 6.200 / USD 6.700** | **0** |
| CO2 pr. år | ~4,9 ton | 0 ton |

### Over tid

| Tidsrum | HDD (strøm + hardware) | PRISME | Besparelse |
|---------|-------------------------|--------|------------|
| 1 år | EUR 6.200 | 0 | EUR 6.200 |
| 5 år | EUR 200.000 | 0 | ~EUR 200.000 |
| 10 år | EUR 400.000 | 0 | ~EUR 400.000 |

---

## Instruktionssæt

Opcode og operander kodes på tværs af fire synlige kanaler: `R = klasse, G = operation, B = destination, V = kilde`.

| R.G | Instruktion | Effekt |
|-----|-------------|--------|
| 0.0 | `NOP` | Ingen operation |
| 0.1 | `HALT` | Stop maskinen |
| 0.2 | `OUT r` | Udskriv register som tegn |
| 0.3 | `EMIT r` | Udskriv register som tal |
| 1.0 | `ADD d, s` | d = d + s |
| 1.1 | `SUB d, s` | d = d - s |
| 1.2 | `MUL d, s` | d = d * s |
| 1.3 | `XOR d, s` | d = d ^ s |
| 2.0 | `SET d, #n` | d = konstant |
| 2.1 | `MOV d, s` | d = s |
| 2.2 | `LOAD d, [s]` | d = memory[s] |
| 2.3 | `STORE [d], s` | memory[d] = s |
| 3.0 | `JMP addr` | Hop til adresse |
| 3.1 | `JZ addr` | Hop hvis zero-flag er sat |
| 3.2 | `JNZ addr` | Hop hvis zero-flag ikke er sat |
| 3.3 | `CMP d, s` | Sammenlign og sæt zero-flag |

4 registre (A, B, C, D) -- 256 bytes hukommelse -- én instruktion pr. lysglimt.

---

## Fysiksimulator

| Modul | Beregner |
|-------|----------|
| `physics.py` | Sellmeier-dispersion, sfærisk aberration, Arrhenius-retention, peak-intensitet |
| `compiler.py` | Kvantisering, OPTB v1-binærformat med CRC32, transmissionstiming |
| `api.py` | `/simulate/write` (skrivevalidering) og `/simulate/stream` (binær kompilering) |

### Verificerede kanalindekser

| Kanal | Tabelværdi | Beregnet (Sellmeier) | Afvigelse |
|-------|------------|----------------------|-----------|
| R 630 nm | 1.4580 | 1.4571 | 0.06% |
| G 530 nm | 1.4613 | 1.4608 | 0.03% |
| B 470 nm | 1.4650 | 1.4641 | 0.06% |
| V 410 nm | 1.4701 | 1.4691 | 0.07% |
| UV 405 nm | 1.4706 | 1.4696 | 0.07% |

---

## Roadmap

| Fase | Mål | Budget | Tid |
|------|-----|--------|-----|
| 1 -- Proof of concept | 100 bytes, 4 niveauer, UV-check | ~EUR 900 | 2-3 måneder |
| 2 -- Automatisering | 10.000+ voxels, piezo-stage, kamera-readout | ~EUR 3.500-5.500 | 3-6 måneder |
| 3 -- Permanent medie | Femtosekund-laserskrivning i fused silica | ~EUR 14.000-34.000 | 6-12 måneder |
| 4 -- Produktion | 20 enheder i rack, netværk, sharding | ~EUR 70.000+ | 12+ måneder |

Fase 3 kræver adgang til en femtosekundlaser -- samarbejde med DTU Photonics eller en tilsvarende institution er den mest direkte vej.

---

## Indkøbsliste (prototype)

| Komponent | Pris |
|-----------|------|
| Raspberry Pi 5 (4 GB) | EUR 80 |
| 4 laserdioder (405-635 nm) | EUR 110 |
| 5 LED'er til readout | EUR 35 |
| 5 bandpass-filtre (10 nm) | EUR 340 |
| 5 fotodioder (BPW34) | EUR 20 |
| DAC (MCP4728) + ADC (MCP3208) | EUR 15 |
| Objektglas + SU-8 photoresist | EUR 70 |
| XY-mikrometerstage | EUR 110 |
| Strømforsyning + kabler + kabinet | EUR 135 |
| **Total** | **~EUR 900** |

Alle komponenter kan købes online. Ingen specialfremstillede dele er nødvendige til denne prototype.

---

## PRISME Binary Extension

En separat additiv udvidelse dokumenterer portabel binær pakning,
softwaremæssig skalering og integration med kundekontrollerede systemer.

**Convert once. Integrate anywhere.**

[Åbn PRISME Binary Extension v0.1](https://github.com/Janus5G/PRISME-Binary-Extension)

Udvidelsen ændrer ikke det oprindelige PRISME-optiske forskningskoncept,
browserprototyperne eller universitetets valideringsmateriale.

---

## Relaterede repositories

- [chromaplex-os-compiler](https://github.com/search?q=chromaplex-os-compiler) -- Chromaplex OS compiler
- [Cplex](https://github.com/search?q=Cplex+chromaplex) -- Chromaplex core library
- [chromaplex-os-v2](https://github.com/search?q=chromaplex-os-v2) -- Chromaplex OS version 2
- [ChromaBridge](https://github.com/search?q=ChromaBridge) -- Web3 data migration pipeline med NPP

---

## Licens

Copyright © 2026 Janus R. All rights reserved.

Dette repository er publiceret udelukkende med henblik på teknisk gennemgang og dokumentation.

Der gives ingen licens til at bruge, reproducere, ændre, distribuere, sublicensere, sælge, indlejre, implementere eller kommercielt udnytte softwaren, specifikationen, binærformatet, dokumentationen eller afledte værker uden forudgående skriftlig tilladelse fra ophavsretsindehaveren.

Der gives ingen udtrykkelig eller underforstået patentlicens.

---

*PRISME -- Gem data i farvet lys -- juli 2026*
