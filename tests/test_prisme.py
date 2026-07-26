"""
PRISME — test-suite for det femkanals spektrale kodningssystem.

Koer med:  python test_prisme.py
Eller:     pytest test_prisme.py -v
"""

import unittest
import math


# ══════════════════════════════════════════════════════════
# PRISME encoder/decoder (identisk logik som prisme.html)
# ══════════════════════════════════════════════════════════

def encode(byte):
    """Kod en byte (0-255) til fem kanalniveauer [R, G, B, V, UV]."""
    b = byte & 0xFF
    R = (b >> 6) & 3
    G = (b >> 4) & 3
    B = (b >> 2) & 3
    V = b & 3
    UV = (R + G + B + V) % 4
    return [R, G, B, V, UV]


def decode(channels):
    """Afkod fem kanalniveauer til en byte. Returnerer (byte, valid)."""
    R, G, B, V, UV = channels
    byte = (R << 6) | (G << 4) | (B << 2) | V
    valid = ((R + G + B + V) % 4) == UV
    return byte, valid


def base4(byte):
    """Konverter en byte til base-4 streng."""
    s = encode(byte)
    return f"{s[0]}{s[1]}{s[2]}{s[3]}"


def text_to_flashes(text):
    """Konverter tekst til en liste af lysglimt."""
    return [encode(ord(c) & 0xFF) for c in text]


# ══════════════════════════════════════════════════════════
# Reed-Solomon UV-udslettelseslogik
# ══════════════════════════════════════════════════════════

def detect_erasures(symbols):
    """
    Marker symboler med forkert UV-kontrolsum som udslettelser.
    Returnerer liste af indices med fejl.
    """
    erasures = []
    for i, channels in enumerate(symbols):
        _, valid = decode(channels)
        if not valid:
            erasures.append(i)
    return erasures


# ══════════════════════════════════════════════════════════
# Sellmeier-ligning (forenklet, matches physics.py)
# ══════════════════════════════════════════════════════════

SELLMEIER_B = [0.6961663, 0.4079426, 0.8974794]
SELLMEIER_C = [0.0684043**2, 0.1162414**2, 9.896161**2]


def sellmeier(wavelength_um):
    """Beregn brydningsindeks for fused silica ved given boelgelaengde."""
    wl2 = wavelength_um ** 2
    n2 = 1.0
    for b, c in zip(SELLMEIER_B, SELLMEIER_C):
        n2 += (b * wl2) / (wl2 - c)
    return math.sqrt(n2)


# ══════════════════════════════════════════════════════════
# TESTS
# ══════════════════════════════════════════════════════════

class TestPrismeEncoder(unittest.TestCase):
    """Test den grundlaeggende encoder/decoder."""

    def test_encode_zero(self):
        self.assertEqual(encode(0), [0, 0, 0, 0, 0])

    def test_encode_max(self):
        self.assertEqual(encode(255), [3, 3, 3, 3, 0])
        # UV = (3+3+3+3) % 4 = 12 % 4 = 0

    def test_encode_H(self):
        # H = 72 = 1*64 + 0*16 + 2*4 + 0
        self.assertEqual(encode(72), [1, 0, 2, 0, 3])

    def test_encode_A(self):
        # A = 65 = 1*64 + 0*16 + 0*4 + 1
        self.assertEqual(encode(65), [1, 0, 0, 1, 2])

    def test_encode_ae(self):
        # ae = 230
        s = encode(230)
        self.assertEqual(s[0:4], [3, 2, 1, 2])
        self.assertEqual(s[4], (3+2+1+2) % 4)

    def test_encode_oe(self):
        # oe = 248
        s = encode(248)
        self.assertEqual(s[0:4], [3, 3, 2, 0])

    def test_encode_aa(self):
        # aa = 229
        s = encode(229)
        self.assertEqual(s[0:4], [3, 2, 1, 1])

    def test_roundtrip_all_256(self):
        """Alle 256 vaerdier skal kode og afkode korrekt."""
        for i in range(256):
            channels = encode(i)
            byte, valid = decode(channels)
            self.assertEqual(byte, i, f"Roundtrip fejlede for {i}")
            self.assertTrue(valid, f"UV-check fejlede for {i}")

    def test_all_levels_used(self):
        """Alle fire niveauer (0-3) skal forekomme i hver kanal."""
        for ch in range(4):  # R, G, B, V
            levels_seen = set()
            for i in range(256):
                levels_seen.add(encode(i)[ch])
            self.assertEqual(levels_seen, {0, 1, 2, 3},
                             f"Kanal {ch} bruger ikke alle niveauer")

    def test_uv_distribution(self):
        """UV-vaerdierne skal vaere jaevnt fordelt (64 af hver)."""
        counts = [0, 0, 0, 0]
        for i in range(256):
            uv = encode(i)[4]
            counts[uv] += 1
        for level, count in enumerate(counts):
            self.assertEqual(count, 64,
                             f"UV niveau {level}: {count} (forventet 64)")


class TestPrismeDecoder(unittest.TestCase):
    """Test afkodning og fejldetektion."""

    def test_decode_valid(self):
        byte, valid = decode([1, 0, 2, 0, 3])
        self.assertEqual(byte, 72)
        self.assertTrue(valid)

    def test_decode_corrupted_R(self):
        """Forstyrret R-kanal opdages af UV."""
        original = encode(72)  # [1, 0, 2, 0, 3]
        corrupted = [2, 0, 2, 0, 3]  # R aendret fra 1 til 2
        byte, valid = decode(corrupted)
        self.assertFalse(valid)
        self.assertNotEqual(byte, 72)

    def test_decode_corrupted_G(self):
        original = encode(72)
        corrupted = [1, 1, 2, 0, 3]  # G aendret fra 0 til 1
        _, valid = decode(corrupted)
        self.assertFalse(valid)

    def test_decode_corrupted_B(self):
        original = encode(72)
        corrupted = [1, 0, 3, 0, 3]  # B aendret fra 2 til 3
        _, valid = decode(corrupted)
        self.assertFalse(valid)

    def test_decode_corrupted_V(self):
        original = encode(72)
        corrupted = [1, 0, 2, 1, 3]  # V aendret fra 0 til 1
        _, valid = decode(corrupted)
        self.assertFalse(valid)

    def test_all_single_channel_errors_detected(self):
        """Enhver aendring af en enkelt datakanal opdages."""
        for byte_val in [0, 42, 72, 127, 200, 255]:
            original = encode(byte_val)
            for ch in range(4):  # R, G, B, V
                for delta in [1, 2, 3]:
                    corrupted = original.copy()
                    corrupted[ch] = (corrupted[ch] + delta) % 4
                    if corrupted[ch] != original[ch]:
                        _, valid = decode(corrupted)
                        self.assertFalse(valid,
                            f"Byte {byte_val}, kanal {ch}, delta {delta} ikke opdaget")


class TestUVErasures(unittest.TestCase):
    """Test UV-baseret udslettelsesmarkering."""

    def test_no_errors(self):
        text = "Hej"
        flashes = text_to_flashes(text)
        self.assertEqual(detect_erasures(flashes), [])

    def test_one_error(self):
        flashes = text_to_flashes("Hej")
        flashes[1] = [0, 0, 0, 0, 1]  # Forkert UV
        erasures = detect_erasures(flashes)
        self.assertEqual(erasures, [1])

    def test_multiple_errors(self):
        flashes = text_to_flashes("PRISME")
        flashes[0][0] = (flashes[0][0] + 1) % 4  # Forstyr P
        flashes[3][2] = (flashes[3][2] + 1) % 4  # Forstyr S
        flashes[5][1] = (flashes[5][1] + 1) % 4  # Forstyr E
        erasures = detect_erasures(flashes)
        self.assertEqual(erasures, [0, 3, 5])

    def test_erasure_doubles_correction(self):
        """
        RS(255,223) har 32 paritetssymboler.
        Ukendte fejl: kan rette 16.
        Udslettelser (UV-markeret): kan rette 32.
        """
        parity_symbols = 32
        max_errors = parity_symbols // 2  # 16
        max_erasures = parity_symbols     # 32
        self.assertEqual(max_errors, 16)
        self.assertEqual(max_erasures, 32)
        self.assertEqual(max_erasures, max_errors * 2)


class TestBase4(unittest.TestCase):
    """Test base-4 repraesentation."""

    def test_zero(self):
        self.assertEqual(base4(0), "0000")

    def test_max(self):
        self.assertEqual(base4(255), "3333")

    def test_H(self):
        self.assertEqual(base4(72), "1020")

    def test_unique(self):
        """Alle 256 vaerdier giver unikke base-4 strenge."""
        all_b4 = [base4(i) for i in range(256)]
        self.assertEqual(len(set(all_b4)), 256)


class TestSellmeier(unittest.TestCase):
    """Test Sellmeier-brydningsindeks mod tabulerede vaerdier."""

    CHANNELS = {
        "R":  (0.630, 1.4580),
        "G":  (0.530, 1.4613),
        "B":  (0.470, 1.4650),
        "V":  (0.410, 1.4701),
        "UV": (0.405, 1.4706),
    }

    def test_all_channels_within_tolerance(self):
        for name, (wl, expected) in self.CHANNELS.items():
            n = sellmeier(wl)
            self.assertAlmostEqual(n, expected, delta=0.002,
                msg=f"Kanal {name} ({wl*1000:.0f} nm): "
                    f"beregnet {n:.4f}, forventet {expected:.4f}")

    def test_dispersion_order(self):
        """Kortere boelgelaengder skal give hoejere brydningsindeks."""
        wavelengths = [0.630, 0.530, 0.470, 0.410, 0.405]
        indices = [sellmeier(wl) for wl in wavelengths]
        for i in range(len(indices) - 1):
            self.assertLess(indices[i], indices[i+1],
                f"n({wavelengths[i]}) >= n({wavelengths[i+1]})")

    def test_model_range(self):
        """Modellen skal virke fra 0.21 til 6.7 um."""
        n_low = sellmeier(0.21)
        n_high = sellmeier(6.7)
        self.assertGreater(n_low, 1.0)
        self.assertGreater(n_high, 1.0)


class TestCapacity(unittest.TestCase):
    """Test kapacitetsberegninger."""

    def test_bits_per_flash(self):
        """5 kanaler * 4 niveauer = 10 bit per glimt."""
        channels = 5
        levels = 4
        total_states = levels ** channels  # 1024
        bits = math.log2(total_states)     # 10
        self.assertEqual(bits, 10)

    def test_data_bits(self):
        """4 datakanaler * 2 bit = 8 bit nyttelast = 1 byte."""
        data_channels = 4
        bits_per_channel = math.log2(4)  # 2
        payload = data_channels * bits_per_channel
        self.assertEqual(payload, 8)

    def test_256_values(self):
        """4 datakanaler med 4 niveauer = 256 vaerdier."""
        self.assertEqual(4 ** 4, 256)

    def test_density_per_cm2(self):
        """Med 1 um voxelafstand: 10^8 voxels per cm2 = 100 MB."""
        voxels_per_axis = 10_000  # 1 cm / 1 um
        voxels_per_cm2 = voxels_per_axis ** 2
        bytes_per_cm2 = voxels_per_cm2 * 1  # 1 byte per voxel
        mb_per_cm2 = bytes_per_cm2 / 1_000_000
        self.assertEqual(mb_per_cm2, 100)

    def test_plate_capacity(self):
        """10x10 mm plade = 1 cm2 = 100 MB."""
        area_cm2 = 1.0  # 10mm x 10mm
        capacity_mb = area_cm2 * 100
        self.assertEqual(capacity_mb, 100)


class TestPowerSavings(unittest.TestCase):
    """Test datacenter-stroemberegning fra dokumentet."""

    def test_hdd_annual_kwh(self):
        """500 diske * 5W * 1.4 PUE * 8760 timer = 30.660 kWh."""
        disks = 500
        watts_per_disk = 5
        pue = 1.4
        hours_per_year = 365 * 24
        kwh = disks * watts_per_disk * pue * hours_per_year / 1000
        self.assertEqual(kwh, 30_660)

    def test_hdd_annual_cost_dkk(self):
        """30.660 kWh * 1.50 kr = 45.990 kr."""
        kwh = 30_660
        price_per_kwh = 1.50
        cost = kwh * price_per_kwh
        self.assertEqual(cost, 45_990)

    def test_prisme_annual_kwh(self):
        """PRISME i hvile: 0 W = 0 kWh."""
        watts = 0
        hours = 365 * 24
        kwh = watts * hours / 1000
        self.assertEqual(kwh, 0)

    def test_ten_year_savings(self):
        """10 aars besparelse inkl. hardware."""
        hdd_power_10yr = 45_990 * 10           # 459.900
        hdd_hw_replacements = 2 * 500 * 2500   # 2.500.000
        hdd_total = hdd_power_10yr + hdd_hw_replacements
        prisme_total = 0
        savings = hdd_total - prisme_total
        self.assertEqual(savings, 2_959_900)

    def test_co2_per_year(self):
        """30.660 kWh * 0.16 kg/kWh = ~4.9 ton CO2."""
        kwh = 30_660
        co2_kg_per_kwh = 0.16  # Dansk elnet ca. 2026
        co2_ton = kwh * co2_kg_per_kwh / 1000
        self.assertAlmostEqual(co2_ton, 4.9, delta=0.1)


class TestTextEncoding(unittest.TestCase):
    """Test tekst-til-lysglimt konvertering."""

    def test_ascii_range(self):
        """Alle printbare ASCII-tegn (32-126) skal kode korrekt."""
        for i in range(32, 127):
            ch = chr(i)
            flashes = text_to_flashes(ch)
            self.assertEqual(len(flashes), 1)
            byte, valid = decode(flashes[0])
            self.assertEqual(byte, i)
            self.assertTrue(valid)

    def test_danish_chars(self):
        """Danske specialtegn ae oe aa skal virke."""
        for ch, expected in [("æ", 230), ("ø", 248), ("å", 229)]:
            flashes = text_to_flashes(ch)
            byte, valid = decode(flashes[0])
            self.assertEqual(byte, expected, f"{ch} gave {byte}")
            self.assertTrue(valid)

    def test_full_string(self):
        text = "Hej!"
        flashes = text_to_flashes(text)
        self.assertEqual(len(flashes), 4)
        decoded = "".join(chr(decode(f)[0]) for f in flashes)
        self.assertEqual(decoded, text)

    def test_empty_string(self):
        self.assertEqual(text_to_flashes(""), [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
