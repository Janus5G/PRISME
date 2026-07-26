// ==============================================================
// REFRACT3 - PRISME GLASS-PLATE REGISTER
// Live ChromaPlex coordinates + five-channel spectral encoding
// ==============================================================

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.module.js';
import { Actor, HttpAgent } from 'https://esm.sh/@dfinity/agent@3.4.3';

const CANISTER_ID = '22w4c-cyaaa-aaaab-qacka-cai';
const IC_HOST = 'https://icp0.io';
const REGISTRY_URL = 'https://chromaplex-ecosystem-77e.caffeine.xyz/registry?q=&colors=%5B%5D';

const CHANNELS = [
    { key: 'R', name: 'RED', nm: 630, color: 0xff4a3d },
    { key: 'G', name: 'GREEN', nm: 530, color: 0x35e878 },
    { key: 'B', name: 'BLUE', nm: 470, color: 0x4695ff },
    { key: 'V', name: 'VIOLET', nm: 410, color: 0x8d63ff },
    { key: 'UV', name: 'UV', nm: 405, color: 0xd5c9ff }
];

const CRYSTALS = [
    { id: 1n, label: 'CHR-001', permanent: false, facetEnd: 4 },
    { id: 2n, label: 'CHR-002', permanent: false, facetEnd: 4 },
    { id: 3n, label: 'CHR-003', permanent: false, facetEnd: 4 },
    { id: 4n, label: 'CHR-004', permanent: false, facetEnd: 4 },
    { id: 0n, label: 'CHR-CORE', permanent: true, facetEnd: 3 }
];
const REGISTRY_COLORS = ['RED', 'GREEN', 'BLUE', 'UV', 'IR'];
const DEPTHS = [0n, 1n, 2n];

const container = document.getElementById('canvas-container');
const payloadInput = document.getElementById('payload-input');
const toggleButton = document.getElementById('toggle-animation');
const sourceState = document.getElementById('source-state');
const activeByte = document.getElementById('active-byte');
const addressDisplay = document.getElementById('registry-address');
const registryMeta = document.getElementById('registry-meta');
const logEntries = document.getElementById('log-entries');
const base4Value = document.getElementById('base4-value');

const meterElements = CHANNELS.map((channel) => document.getElementById(`meter-${channel.key.toLowerCase()}`));
const levelElements = CHANNELS.map((channel) => document.getElementById(`level-${channel.key.toLowerCase()}`));

let running = true;
let messageIndex = 0;
let lastCharacterChange = 0;
let activeLevels = [1, 1, 0, 0, 2];
let registryState = null;

window.addEventListener('error', (event) => {
    console.error('PRISME render error:', event.error || event.message);
});

function encodeByte(value) {
    const visible = [
        Math.floor(value / 64),
        Math.floor((value % 64) / 16),
        Math.floor((value % 16) / 4),
        value % 4
    ];
    return [...visible, visible.reduce((sum, level) => sum + level, 0) % 4];
}

function currentCharacter() {
    const message = payloadInput.value || ' ';
    return message[messageIndex % message.length] || ' ';
}

function formatCoordinate(facet) {
    return `${facet.crystalLabel} #${facet.facetIndex} ${facet.color} d${facet.depth}`;
}

function addLog(title, detail, color = '#52637d') {
    const entry = document.createElement('div');
    const heading = document.createElement('strong');
    const lineBreak = document.createElement('br');
    const description = document.createElement('span');
    entry.className = 'log-entry';
    entry.style.borderLeftColor = color;
    heading.textContent = title;
    description.textContent = detail;
    entry.append(heading, lineBreak, description);
    logEntries.insertBefore(entry, logEntries.firstChild);
    while (logEntries.children.length > 5) {
        logEntries.removeChild(logEntries.lastChild);
    }
}

// --------------------------------------------------------------
// Live registry reader. The public registry page uses this same
// canister and lens_capture query to sweep its coordinate grid.
// --------------------------------------------------------------
const idlFactory = ({ IDL: Candid }) => {
    const LensCaptureArgs = Candid.Record({
        crystalId: Candid.Nat,
        facet: Candid.Text
    });
    const CrystalCapture = Candid.Record({
        crystalId: Candid.Nat,
        capturedAt: Candid.Nat,
        facet: Candid.Text
    });
    return Candid.Service({
        lens_capture: Candid.Func([LensCaptureArgs], [CrystalCapture], []),
        get_system_state: Candid.Func([], [Candid.Nat, Candid.Nat], ['query']),
        get_total_capacity: Candid.Func([], [Candid.Nat], ['query'])
    });
};

const agent = HttpAgent.createSync({ host: IC_HOST });
const registryActor = Actor.createActor(idlFactory, { agent, canisterId: CANISTER_ID });

function registryCoordinates() {
    const coordinates = [];
    for (const crystal of CRYSTALS) {
        for (let facetIndex = 0; facetIndex < crystal.facetEnd; facetIndex += 1) {
            for (const color of REGISTRY_COLORS) {
                for (const depth of DEPTHS) {
                    coordinates.push({
                        crystalId: crystal.id,
                        crystalLabel: crystal.label,
                        permanent: crystal.permanent,
                        facetIndex,
                        color,
                        depth,
                        facet: `f${facetIndex}-${color}-d${depth}`
                    });
                }
            }
        }
    }
    return coordinates;
}

async function findNextAvailable() {
    sourceState.textContent = 'Synkroniserer\u2026';
    sourceState.className = '';

    try {
        const [systemState, capacity, coordinates] = await Promise.all([
            registryActor.get_system_state(),
            registryActor.get_total_capacity(),
            Promise.resolve(registryCoordinates())
        ]);

        let next = null;
        let writtenInSweep = 0;

        // Use small batches so the public canister is not hit by hundreds of
        // simultaneous calls. Stop at the first unwritten coordinate.
        for (let start = 0; start < coordinates.length && !next; start += 12) {
            const batch = coordinates.slice(start, start + 12);
            const captures = await Promise.all(batch.map(async (coordinate) => {
                try {
                    await registryActor.lens_capture({
                        crystalId: coordinate.crystalId,
                        facet: coordinate.facet
                    });
                    return { coordinate, written: true };
                } catch {
                    return { coordinate, written: false };
                }
            }));

            for (const result of captures) {
                if (result.written) {
                    writtenInSweep += 1;
                } else {
                    next = result.coordinate;
                    break;
                }
            }
        }

        registryState = {
            next,
            totalWritten: systemState[0],
            activeCrystals: systemState[1],
            capacity,
            writtenInSweep
        };

        sourceState.textContent = '\u25cf live canister';
        sourceState.className = 'live';

        if (next) {
            addressDisplay.textContent = formatCoordinate(next);
            registryMeta.textContent = `${systemState[0].toLocaleString('da-DK')} skrevet \u00b7 ${systemState[1]} aktive krystaller \u00b7 kapacitet ${capacity.toLocaleString('da-DK')}`;
            addLog('[Registry synced]', `${formatCoordinate(next)} \u00b7 n\u00e6ste ledige`, '#55dda0');
        } else {
            addressDisplay.textContent = 'Ingen ledig koordinat i aktivt registervindue';
            registryMeta.textContent = `${systemState[0].toLocaleString('da-DK')} adresser skrevet`;
            addLog('[Registry full]', 'Ingen ledig koordinat fundet i det offentlige registervindue', '#f4a179');
        }
    } catch (error) {
        console.warn('Live registry unavailable:', error);
        sourceState.textContent = '\u25cb registry utilg\u00e6ngeligt';
        sourceState.className = 'offline';
        addressDisplay.textContent = 'Live register kunne ikke l\u00e6ses';
        registryMeta.innerHTML = `<a href="${REGISTRY_URL}" target="_blank" rel="noopener noreferrer" style="color:#8eb8f6">\u00c5bn ChromaPlex registry \u2197</a>`;
        addLog('[Offline]', 'Bevarer PRISME-visualiseringen og fors\u00f8ger igen om 15 sek.', '#f4a179');
    }
}

// --------------------------------------------------------------
// Three.js studio scene
// --------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03060a);
scene.fog = new THREE.FogExp2(0x03060a, 0.018);

const camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(8.6, 4.8, 11.8);
camera.lookAt(0, 0.15, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
container.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xbcd5ff, 0x05070a, 0.58));

const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
keyLight.position.set(5, 9, 8);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x779dff, 1.5);
fillLight.position.set(-7, 3, 4);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0x8f7cff, 32, 22, 2);
rimLight.position.set(-3, 4, -5);
scene.add(rimLight);

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(32, 26),
    new THREE.MeshPhysicalMaterial({
        color: 0x080c13,
        roughness: 0.2,
        metalness: 0.55,
        clearcoat: 1,
        clearcoatRoughness: 0.1
    })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -3.45;
scene.add(floor);

const grid = new THREE.GridHelper(28, 28, 0x1a2940, 0x101827);
grid.position.y = -3.43;
scene.add(grid);

const plateGroup = new THREE.Group();
plateGroup.rotation.y = -0.14;
scene.add(plateGroup);

const plates = [];
const plateGeometry = new THREE.BoxGeometry(5.8, 0.12, 3.05, 2, 1, 2);

CHANNELS.forEach((channel, index) => {
    const material = new THREE.MeshPhysicalMaterial({
        color: 0xd9e8f5,
        emissive: channel.color,
        emissiveIntensity: 0.08,
        roughness: 0.035,
        metalness: 0,
        transmission: 0.94,
        thickness: 0.48,
        ior: 1.46 + index * 0.004,
        attenuationColor: channel.color,
        attenuationDistance: 3.5,
        transparent: true,
        opacity: 0.82,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        side: THREE.DoubleSide
    });

    const plate = new THREE.Mesh(plateGeometry, material);
    plate.position.y = 2.25 - index * 1.26;
    plate.rotation.z = -0.018 * (index - 2);
    plate.userData = { channel, baseY: plate.position.y };
    plateGroup.add(plate);

    const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(plateGeometry),
        new THREE.LineBasicMaterial({ color: channel.color, transparent: true, opacity: 0.42 })
    );
    plate.add(edges);

    const voxelGeometry = new THREE.SphereGeometry(0.035, 8, 8);
    const voxelMaterial = new THREE.MeshBasicMaterial({
        color: channel.color,
        transparent: true,
        opacity: 0.16,
        toneMapped: false
    });
    const voxels = new THREE.InstancedMesh(voxelGeometry, voxelMaterial, 40);
    const matrix = new THREE.Matrix4();
    let voxelIndex = 0;
    for (let row = 0; row < 5; row += 1) {
        for (let column = 0; column < 8; column += 1) {
            matrix.makeTranslation(-2.45 + column * 0.7, 0.09, -1.18 + row * 0.59);
            voxels.setMatrixAt(voxelIndex, matrix);
            voxelIndex += 1;
        }
    }
    plate.add(voxels);

    const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.46, 20, 20),
        new THREE.MeshBasicMaterial({
            color: channel.color,
            transparent: true,
            opacity: 0.04,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false
        })
    );
    glow.position.set(0.2, 0.24, 0);
    plate.add(glow);

    plates.push({ plate, material, edgeMaterial: edges.material, voxelMaterial, glow });
});

const beamMaterial = new THREE.MeshBasicMaterial({
    color: 0xdaf7ff,
    transparent: true,
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
});
const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.055, 8.3, 12), beamMaterial);
beam.position.set(0.25, -0.2, 0);
plateGroup.add(beam);

const beamHalo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.2, 8.1, 12, 1, true),
    new THREE.MeshBasicMaterial({
        color: 0x78bbff,
        transparent: true,
        opacity: 0.045,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
    })
);
beamHalo.position.copy(beam.position);
plateGroup.add(beamHalo);

function updateEncoding(logChange = false) {
    const char = currentCharacter();
    const byte = char.charCodeAt(0) & 255;
    activeLevels = encodeByte(byte);

    activeByte.textContent = `0x${byte.toString(16).padStart(2, '0').toUpperCase()} \u00b7 ${byte}`;
    base4Value.textContent = activeLevels.slice(0, 4).join('');

    activeLevels.forEach((level, index) => {
        const percent = (level / 3) * 100;
        meterElements[index].style.width = `${percent}%`;
        levelElements[index].textContent = level;

        const plate = plates[index];
        plate.material.emissiveIntensity = 0.08 + level * 0.32;
        plate.material.opacity = 0.54 + level * 0.12;
        plate.edgeMaterial.opacity = 0.2 + level * 0.2;
        plate.voxelMaterial.opacity = 0.07 + level * 0.2;
        plate.glow.material.opacity = 0.025 + level * 0.105;
        plate.glow.scale.setScalar(0.8 + level * 0.26);
    });

    if (logChange) {
        const address = registryState?.next ? formatCoordinate(registryState.next) : 'registeradresse afventer';
        addLog(
            `[PRISME] \u201c${char === ' ' ? '\u2420' : char}\u201d \u2192 ${activeLevels.join('\u00b7')}`,
            `${address} \u00b7 UV-check ${activeLevels[4]}`,
            '#8d63ff'
        );
    }
}

payloadInput.addEventListener('input', () => {
    messageIndex = 0;
    updateEncoding(true);
});

toggleButton.addEventListener('click', () => {
    running = !running;
    toggleButton.textContent = running ? 'Pause' : 'Afspil';
});

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    if (running && elapsed - lastCharacterChange > 1.15) {
        const message = payloadInput.value || ' ';
        messageIndex = (messageIndex + 1) % message.length;
        lastCharacterChange = elapsed;
        updateEncoding(true);
    }

    plateGroup.rotation.y = -0.14 + Math.sin(elapsed * 0.18) * 0.035;
    plateGroup.rotation.x = Math.sin(elapsed * 0.12) * 0.012;

    plates.forEach((item, index) => {
        const level = activeLevels[index];
        const pulse = Math.max(0, Math.sin(elapsed * 5.4 - index * 0.65));
        item.plate.position.y = item.plate.userData.baseY + pulse * 0.018 * level;
        item.glow.material.opacity = (0.025 + level * 0.105) * (0.72 + pulse * 0.5);
    });

    beamMaterial.opacity = 0.22 + Math.max(0, Math.sin(elapsed * 5.4)) * 0.42;
    beamHalo.material.opacity = beamMaterial.opacity * 0.13;
    beamHalo.scale.setScalar(0.92 + Math.sin(elapsed * 3.2) * 0.08);

    renderer.render(scene, camera);
}

function updateResponsiveFraming() {
    const narrow = window.innerWidth < 850;
    const pixelRatio = Math.min(window.devicePixelRatio, 2);

    plateGroup.scale.setScalar(narrow ? 0.7 : 1);
    plateGroup.position.set(narrow ? 0 : 0.25, narrow ? -0.3 : 0, 0);

    camera.position.set(narrow ? 8.4 : 8.6, narrow ? 4.2 : 4.8, narrow ? 14.5 : 11.8);
    camera.lookAt(0, narrow ? -0.25 : 0.15, 0);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', updateResponsiveFraming);

updateResponsiveFraming();
updateEncoding(false);
addLog('[PRISME ready]', 'Fem glasplader online \u00b7 spektral encoder aktiv', '#67d8e7');
void findNextAvailable();
window.setInterval(() => { void findNextAvailable(); }, 15000);
animate();
