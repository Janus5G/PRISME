# PRISME — Scaling Note

## Purpose

This demonstration visualises PRISME spectral byte encoding and an additive 64-bit software layer for binary packaging, addressing and block management.

The 64-bit display does not mean that one optical flash stores 64 bits. The current PRISME model encodes one 8-bit data byte across four visible spectral channels, with an additional control channel.

## Proposed physical volume model

A proposed physical PRISME volume may be organised as:

- 256 × 256 voxels per optical layer
- 65,536 voxels per layer
- 1 data byte per voxel
- 64 physical layers per volume

This gives:

```text
256 × 256 = 65,536 voxels per layer

64 × 65,536 = 4,194,304 voxels

4,194,304 bytes = 4 MiB raw payload per volume
```

The practical net capacity will be lower because space may be required for:

- error correction
- metadata
- calibration fields
- addressing information
- reserved areas

## Physical addressing

A voxel in the proposed 64-layer volume may be addressed using:

```text
6 bits  = layer number, 0–63
8 bits  = X position, 0–255
8 bits  = Y position, 0–255
--------------------------------
22 bits = physical voxel address
```

This provides a clean binary structure for controllers, storage maps and read/write coordination.

## 64-bit software layer

The separate 64-bit software layer is intended for:

- binary packaging
- logical addressing
- block management
- indexing
- sharding
- integrity references
- coordination across multiple physical volumes

It is separate from the physical 22-bit voxel address.

The 64-bit layer does not increase the amount of information stored in one optical flash. It provides a larger logical structure for organising and addressing encoded data.

## Larger storage structures

The proposed physical volume can be expanded by combining multiple volumes:

```text
1 volume       = 4 MiB raw payload
256 volumes    = 1 GiB raw payload
1,024 volumes  = 4 GiB raw payload
```

Larger systems may combine additional volumes, parallel readout units and distributed storage controllers.

This creates a possible hierarchy such as:

```text
PRISME storage system
├── storage volumes
│   ├── 64 optical layers
│   │   ├── 256 rows
│   │   ├── 256 columns
│   │   └── 65,536 voxels per layer
│   └── 4,194,304 voxels per volume
└── 64-bit logical addressing and block management
```

## Intended application

The proposed scaling model is relevant to possible future applications including:

- archival storage
- cold-data storage
- distributed storage
- industrial data infrastructure
- edge and server systems
- future data-centre storage systems

The model is intended to show how the existing PRISME byte-level encoding may be organised into larger physical and logical storage structures.

## What the scaling model improves

The proposed model may improve:

- addressable storage size
- file and block management
- parallelisation
- physical layering
- sharding
- controller organisation
- coordination across multiple volumes

It does not automatically improve:

- voxel size
- optical density
- signal-to-noise ratio
- separation between intensity levels
- spectral crosstalk
- physical durability
- write speed
- read speed
- manufacturing precision

## Optical considerations

Physical scaling requires experimental validation of the optical channels, materials and readout system.

Closely spaced wavelength channels may require:

- narrower optical filters
- alternative wavelength selection
- improved sensor discrimination
- calibration procedures
- a revised control-channel architecture

Parallel camera readout, precision optomechanics and reliable alignment may also be required for larger physical systems.

## Validation status

This document describes a proposed scaling model and architectural direction.

It does not constitute experimental validation of:

- physical storage density
- voxel dimensions
- write speed
- read speed
- signal-to-noise performance
- spectral separation
- service life
- manufacturing yield
- production capacity
- data-centre deployment readiness

Physical performance must be established through laboratory measurements and engineering validation.

No unverified physical density claim should be treated as established capacity.

The original PRISME spectral encoding model remains unchanged.
