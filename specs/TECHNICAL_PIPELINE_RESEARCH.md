# Technical Pipeline Research: Image to Printable Sewing Pattern Pieces

**Date:** 2026-02-28
**Focus:** Deep technical analysis of the decomposition pipeline: image -> garment understanding -> 3D shape -> 2D pattern pieces -> printable output

---

## Table of Contents

1. [Pipeline Overview](#1-pipeline-overview)
2. [Stage 1: Garment Segmentation](#2-stage-1-garment-segmentation)
3. [Stage 2: 3D Garment Reconstruction](#3-stage-2-3d-garment-reconstruction)
4. [Stage 3: 3D to 2D Flattening / Unwrapping](#4-stage-3-3d-to-2d-flattening--unwrapping)
5. [Stage 4: Parametric Pattern Generation Systems](#5-stage-4-parametric-pattern-generation-systems)
6. [Stage 5: Seam Allowance, Grain Lines, Notches](#6-stage-5-seam-allowance-grain-lines-notches)
7. [Stage 6: Printing and Tiling](#7-stage-6-printing-and-tiling)
8. [AI/ML Approaches (End-to-End and Hybrid)](#8-aiml-approaches-end-to-end-and-hybrid)
9. [Cosplay-Specific Pattern Generation](#9-cosplay-specific-pattern-generation)
10. [Recommended Technical Architecture](#10-recommended-technical-architecture)

---

## 1. Pipeline Overview

The full pipeline from a photograph of a garment to printable sewing pattern pieces involves the following stages:

```
Input Photo
    |
    v
[1] Garment Segmentation & Parsing
    - Identify garment type, boundaries, sub-components
    - Extract semantic attributes (neckline, sleeve type, etc.)
    |
    v
[2] 3D Garment Reconstruction (or direct pattern prediction)
    - Reconstruct 3D garment mesh from 2D image
    - Separate garment from body
    - Estimate garment geometry and deformation
    |
    v
[3] 3D-to-2D Flattening (UV Unwrapping / Parameterization)
    - Segment 3D mesh into developable patches
    - Flatten each patch to 2D while minimizing distortion
    - Handle darts for non-developable regions
    |
    v
[4] Pattern Formalization
    - Convert raw 2D shapes into proper pattern pieces
    - Add construction details (seam allowances, grain lines, notches)
    - Ensure manufacturability constraints (symmetry, dart placement)
    |
    v
[5] Printable Output
    - Tile pattern pieces across A4/Letter pages
    - Add registration marks, assembly guides, cut lines
    - Generate PDF
```

There are two broad approaches to this pipeline:

**Approach A: Geometry-Based** -- Reconstruct 3D geometry, then computationally flatten it. This is the traditional computer graphics approach (ClothCap -> Computational Pattern Making).

**Approach B: Direct Prediction** -- Use neural networks to predict 2D sewing patterns directly from images, bypassing explicit 3D reconstruction. This is the modern ML approach (SewFormer, DressWild, Panelformer).

**Approach C: Hybrid / VLM-Parametric** -- Use vision-language models to analyze the garment image, extract style parameters, and drive a parametric pattern generation engine. This is the emerging approach (ChatGarment, Design2GarmentCode).

---

## 2. Stage 1: Garment Segmentation

### 2.1 The Problem

Given a photo of a person wearing a garment (or a cosplay costume), identify:
- Which garments are present (shirt, pants, jacket, etc.)
- The boundary of each garment
- Sub-components within each garment (bodice, sleeves, collar, skirt panels, cuffs, pockets, etc.)
- Semantic attributes (V-neck, raglan sleeve, princess seam, etc.)

### 2.2 Key Datasets

| Dataset | Size | Labels | Notes |
|---------|------|--------|-------|
| **LIP** (Look Into Person) | 50K images | 19 semantic labels (hat, hair, face, upper-clothes, dress, coat, socks, pants, gloves, scarf, skirt, jumpsuits, left/right arm, left/right leg, left/right shoe, background) | Most widely used. Known issues with label precision -- masks sometimes spill beyond object boundaries. |
| **ATR** | 17K images | 18 categories | Same team as LIP. Shares label quality issues. |
| **DeepFashion / DeepFashion2** | 800K+ images | Garment categories, landmarks, attributes, bounding boxes, segmentation masks | Rich attribute vocabulary. DeepFashion2 adds instance segmentation. |
| **ModaNet** | 55K images | 13 apparel categories with instance segmentation | Street-fashion focused. Good for in-the-wild scenarios. |
| **Fashionpedia** | 48K images | 27 apparel categories, 294 fine-grained attributes | Knowledge graph structure linking categories, parts, and attributes. |
| **4D-DRESS** (CVPR 2024) | 3D/4D frames | Semantic clothing labels including loose garments | Real-world 3D human clothing with semantic annotations. Handles challenging loose garments like dresses. |

### 2.3 Segmentation Models

**SegFormer (segformer_b2_clothes)** -- Available on HuggingFace, fine-tuned on ATR dataset. Uses a hierarchical Transformer encoder (Mix-FFN) that avoids positional encoding, making it robust to different resolutions. Outputs per-pixel garment category labels.

**ClothSeg** -- Semantic segmentation network with a Feature Projection Fusion (FPF) module that combines local and global information. Uses Transformers as encoders to learn global context while preserving local detail.

**DSA-YOLO** (2024) -- Instance segmentation model for clothing images, combining detection and segmentation in a single pass.

**DeepLabV3+** -- Encoder-decoder architecture with atrous spatial pyramid pooling. Achieves near-perfect metrics on clothing segmentation benchmarks (IoU approaching 1.0).

### 2.4 Part-Level Parsing (Beyond Category Segmentation)

For pattern generation, we need more than just "this is a shirt" -- we need to know where the collar is, where the sleeves attach, where the side seams are, etc.

**Fashion Attribute Classification** identifies properties like:
- Neckline type (V-neck, crew, turtleneck, sweetheart, etc.)
- Sleeve type (set-in, raglan, dolman, cap, bell, etc.)
- Closure type (button-front, zipper, pullover, wrap, etc.)
- Silhouette (fitted, A-line, empire, drop-waist, etc.)
- Length (crop, waist, hip, knee, floor, etc.)

These attributes are descriptive rather than constructive -- they tell you *what* the garment looks like, not *how* to build it. However, they can be mapped to parametric pattern parameters (see Section 5).

### 2.5 Garment Landmark Detection

Fashion landmark detection identifies key construction points on the garment:
- Shoulder points
- Armhole/armscye points
- Neckline points
- Waistline
- Hemline
- Seam lines

DeepFashion provides 8 landmark categories with up to 8 keypoints each. These landmarks approximate where actual seam lines would fall and can guide pattern piece decomposition.

### 2.6 What Segmentation Cannot Do

Semantic segmentation identifies what is visible in 2D. It **cannot**:
- Infer the 3D shape of the garment (how it drapes, what's underneath)
- Determine how many pattern pieces compose the garment
- Identify hidden construction details (darts, gussets, facings, linings)
- Decompose a visible garment front into its constituent flat pattern pieces

This is why 3D reconstruction or direct pattern prediction is needed downstream.

---

## 3. Stage 2: 3D Garment Reconstruction

### 3.1 The Problem

From a 2D image of a clothed person, reconstruct the 3D geometry of the garment as a separate mesh (not fused with the body). The garment mesh should be:
- Separated from the body mesh
- Topologically clean (manifold, no self-intersections)
- Geometrically accurate (capturing drape, wrinkles, and silhouette)

### 3.2 Body Model Foundation: SMPL

Nearly all garment reconstruction methods build on top of **SMPL** (Skinned Multi-Person Linear Model):
- Represents the human body as a mesh of 6,890 vertices
- Parameterized by pose (theta: 72 joint angles) and shape (beta: 10 PCA coefficients of body shape variation)
- Shape parameters encode body dimensions (height, weight, proportions) that can be mapped to sewing measurements
- Can be estimated from a single image using methods like HMR, SPIN, PARE, PyMAF, SMPLify-X

SMPL provides the body underneath the garment, which is essential for:
- Separating garment from body
- Draping simulations
- Body measurement extraction for pattern sizing

### 3.3 Key Methods

#### BCNet (ECCV 2020)
- **Input:** Single near-front-view RGB image
- **Approach:** Proposes a layered garment representation on top of SMPL. Makes skinning weights of garment independent of body mesh. First reconstructs a coarse template from garment type classification, then refines surface details with a displacement network (MLP regressing per-vertex offsets).
- **Limitation:** MLP-based displacement network struggles with large numbers of vertex offsets for complex garments.
- **Code:** https://github.com/jby1993/BCNet

#### ClothCap (SIGGRAPH 2017)
- **Input:** 4D scans (multi-frame 3D body scans)
- **Approach:** Seamless 4D clothing capture and retargeting. Registers a body+clothing template to 4D scan sequences. Segments the scan into body and garment regions. Extracts per-frame garment geometry.
- **Limitation:** Requires expensive 4D scanning equipment, not applicable to single photos.
- **Relevance:** Foundational work establishing garment-body separation in 3D.

#### ReEF (Registration of Explicit to implicit Fields)
- **Input:** Single image
- **Approach:** Registers explicit clothing template meshes to implicit fields learned from pixel-aligned implicit functions (like PIFu). Combines the topological structure of template meshes with the detail-capturing ability of implicit representations.
- **Relevance:** Bridges template-based and implicit approaches.

#### GarVerseLOD (ACM TOG 2024)
- **Input:** Single in-the-wild image
- **Approach:** Hierarchical reconstruction using a dataset of 6,000 artist-created cloth models with levels of detail (LOD). Uses a conditional diffusion model to generate photorealistic paired training data. Recovers garment details progressively from detail-free stylized shape to pixel-aligned deformation.
- **Strengths:** Best reported quality for single-image garment reconstruction. Handles large variation in pose, illumination, occlusion.
- **Code:** https://github.com/zhongjinluo/GarVerseLOD

#### Gaussian Garments (2024)
- **Input:** Multi-view video
- **Approach:** Combines 3D mesh with Gaussian texture (3D Gaussian Splatting). Reconstructs simulation-ready garment assets with photorealistic appearance. Uses a pre-trained GNN for physics simulation. Enables retargeting and resizing.
- **Limitation:** Requires multi-view video capture, not single-image.
- **Code:** https://github.com/eth-ait/Gaussian-Garments

#### REC-MV (CVPR 2023)
- **Input:** Monocular video
- **Approach:** Reconstructs 3D dynamic cloth from monocular videos. Handles temporal consistency across frames.

### 3.4 Implicit Sewing Patterns (ISP)

ISP is a neural garment representation that bridges 2D patterns and 3D geometry:

- Each garment consists of 2D panels defined by Signed Distance Functions (SDFs)
- 3D shapes are defined by 2D-to-3D mapping functions
- Two neural networks: one parametrizes sewing patterns as 2D SDFs with edge labels, the other lifts flat panels to 3D via continuous UV deformation
- Establishes correspondences between 2D pattern coordinates and 3D surface points

This representation is particularly powerful because it maintains the pattern-to-garment correspondence throughout, making it natural to extract 2D pattern pieces from the 3D reconstruction.

### 3.5 Deep Fashion3D Dataset

The benchmark dataset for garment reconstruction:
- 2,078 3D models reconstructed from real garments via scanning
- 10 garment categories, 563 instances
- Annotations include 3D feature lines, body pose, multi-view images
- First dataset with 3D garment feature line annotations
- V2 (2023) adds dense point clouds with additional features
- Used to benchmark methods: 3DGS, GOF, GSDF, 2DGS, PGSR

---

## 4. Stage 3: 3D to 2D Flattening / Unwrapping

### 4.1 The Problem

Given a 3D garment mesh, produce flat 2D pattern pieces that can be cut from fabric and sewn together to reproduce the 3D shape. This requires:
1. **Segmenting** the 3D mesh into patches (one per pattern piece)
2. **Flattening** each patch to 2D with minimal distortion
3. **Handling non-developable regions** (where flattening is impossible without distortion) using darts or ease

### 4.2 Surface Developability and Why Garments Are Hard

A surface is **developable** if it can be unrolled flat without stretching or compressing. Cylinders and cones are developable; spheres are not.

Garments are challenging because:
- The human body has double curvature (Gaussian curvature != 0) at shoulders, bust, hips, elbows
- Woven fabric has limited stretch (typically 1-5% along grain, more on bias)
- Real garments accommodate non-developability through **darts** (wedge-shaped removals), **ease** (controlled fullness), **gathers**, and **seam shaping**

### 4.3 Computational Pattern Making (Pietroni et al., SIGGRAPH 2022)

This is the most comprehensive work on going from a 3D garment mesh to proper sewing pattern pieces. **Code: https://github.com/nicopietroni/parafashion**

#### Step 1: Cross-Field Guided Patch Segmentation
- Computes a smooth 4-rotational-symmetric (4-RoSy) tangent vector field aligned with principal curvature directions on the garment surface
- Traces field-aligned paths across the mesh, creating "border-to-border" paths and "loops" that segment the surface
- Uses a greedy strategy: iteratively inserts paths that maximize distance from existing paths
- Continues until all patches satisfy distortion and size requirements

#### Step 2: Anisotropic Fabric Flattening
Unlike general UV unwrapping, garment flattening must respect the anisotropic behavior of woven fabric:

- **Warp/weft model:** Fabric is modeled as an orthogonal grid of warp and weft yarns
- **Directional stretch:** Measures stretch separately along U (warp) and V (weft) directions: `su = ||J1||` and `sv = ||J2||` where J is the Jacobian of the parameterization
- **Shear penalty:** Uses ARAP (as-rigid-as-possible) energy to penalize angular distortion between warp and weft
- **Key insight:** "Fabric can usually stretch more along the diagonal direction, resulting in shear of the woven structure" -- isotropic parameterization methods miss this

The combined energy function integrates:
- Directional stretch penalties (separate for U and V)
- ARAP rigidity/shear terms
- Seam reflection symmetry constraints
- Dart symmetry constraints

**Optimization:** Local-global alternating optimization. Local step computes per-triangle optimal transformations; global step solves a sparse linear system for vertex positions.

#### Step 3: Dart Insertion
- Identifies regions where flattening distortion exceeds fabric stretch limits
- Sorts potential dart locations by Gaussian curvature (preferring low-curvature regions; avoiding saddle points that cause overlaps)
- Creates darts by merging adjacent patches and removing a wedge-shaped piece
- Darts introduce angle deficiency: "removing a wedge-shaped piece of fabric and sewing both sides together effectively creates a curved shape from a flat pattern"

#### Step 4: Grain Line Alignment
- Allows specifying desired 3D alignment axes (typically vertical for standard grain, 45-degree for bias cut)
- Per-triangle projections of alignment axis are transported to 2D triangles
- Computes best-fit global grain direction per patch and rotates accordingly

#### Limitations
- Seam allowances are NOT addressed (acknowledged as future work)
- Notch placement is not automated
- Requires clean 3D input mesh

### 4.4 General UV Unwrapping Techniques

#### As-Rigid-As-Possible (ARAP) Parameterization
- Minimizes a deformation energy that penalizes deviation from rigid (rotation-only) transformations
- Local-global optimization: alternates between computing optimal per-triangle rotations and solving for vertex positions
- Standard method for low-distortion parameterization, but does not model fabric anisotropy

#### Least Squares Conformal Maps (LSCM)
- Minimizes angle distortion (conformal = angle-preserving)
- Fast (single linear solve) but allows area distortion
- Good for initial parameterization, often used as initialization for iterative methods

#### ABF++ (Angle-Based Flattening)
- Optimizes triangle angles directly to match planarity constraints
- Better quality than LSCM but slower

#### xatlas Library
- Open-source mesh parameterization / UV unwrapping library (https://github.com/jpcy/xatlas)
- Segments meshes into charts, parameterizes each chart, packs charts into an atlas
- General-purpose; does not account for fabric-specific constraints

#### PartUV (2025)
- Part-based UV unwrapping that generates fewer, part-aligned charts
- Built on learning-based part decomposition (PartField)
- Could be adapted for garment-aware patch segmentation

### 4.5 Developable Surface Approximation

Several works treat the garment mesh as a collection of developable surfaces:
- Cut the garment surface into 3D patches
- Each patch is approximately developable (near-zero Gaussian curvature)
- Flatten each patch with minimal distortion
- Non-developable regions are handled by introducing darts or splitting into additional patches

---

## 5. Stage 4: Parametric Pattern Generation Systems

### 5.1 The Parametric Approach

Instead of reconstructing patterns from 3D geometry, parametric systems define patterns mathematically as functions of:
- **Body measurements** (bust, waist, hip, shoulder width, arm length, etc.)
- **Design parameters** (ease amount, dart depth, sleeve type, neckline shape, etc.)

A parametric pattern is essentially a computer program:
```
pattern = f(measurements, design_parameters)
```

### 5.2 FreeSewing

- **URL:** https://freesewing.org/ | https://freesewing.dev/
- **Language:** JavaScript
- **License:** MIT
- **Approach:** Code-as-pattern. Each design is implemented as a JavaScript module that takes measurements and options as input and produces SVG pattern output.

**Architecture:**
- **Core library:** Provides Point, Path, Snippet, Part abstractions
- **Designs:** Each garment design is a plugin that uses the core API
- **Measurements:** Standard set of body measurements (38+) that drive all pattern calculations
- **Options:** Design-specific parameters (e.g., `sleeveLengthBonus`, `chestEase`, `necklineDepth`)

**Key primitives:**
- Points are defined by coordinates, often computed from measurements
- Paths connect points with line segments, curves (cubic Bezier), and arcs
- Parts group related paths and represent individual pattern pieces
- Snippets add annotations (grain lines, notches, buttons, etc.)

**Pattern generation process:**
1. Read body measurements
2. Calculate key reference points from measurements (e.g., shoulder point = shoulder width / 2 from center)
3. Draw pattern outlines using Bezier curves through reference points
4. Add seam allowance by offsetting the outline
5. Add annotations (grain line, notch marks, labels)
6. Output SVG

**Strengths for our pipeline:** If we can extract (a) body measurements from a photo and (b) garment style parameters from the image, FreeSewing can generate sized, printable patterns with all construction details.

### 5.3 GarmentCode

- **URL:** https://github.com/maria-korosteleva/GarmentCode
- **Language:** Python
- **License:** MIT

**Architecture:**
- **PyGarment core library:** Fundamental types -- Edge, Panel, Component, Interface
- **Edge factories:** Generate pattern edges programmatically (straight, Bezier, arc)
- **Components:** Modular, reusable garment parts (bodice, sleeve, collar, skirt)
- **Interfaces:** Define how components connect (seam edges that stitch together)
- **Design parameters:** YAML configuration files specifying both topological choices (which components exist) and geometrical values (their dimensions)

**Pattern representation:** `S = <F, D, B>` where:
- F = set of symbolic programs (component definitions)
- D = design configurations (topological and geometrical parameters)
- B = body measurements

**Key advantage:** GarmentCode is used as the backend by ChatGarment (CVPR 2025) and Design2GarmentCode (CVPR 2025), making it the de facto standard parametric backend for AI-driven pattern generation.

### 5.4 Seamly2D / Valentina

- **URL:** https://seamly.io/ | https://valentina-project.org/
- **Language:** C++/Qt
- **License:** GPLv3+

**Approach:** Point-to-point construction method mimicking traditional pattern drafting:
1. Start from a datum point (e.g., center back neck)
2. Sequentially define key points using distance + angle from previous points
3. Distances computed from body measurements using drafting formulas
4. Connect points with lines, curves, arcs to form pattern outlines

**Parametric capability:**
- Patterns read multi-size measurement files for standardized sizes
- Read individual measurement files for custom-fit
- When measurements change, pattern automatically recalculates

**File format:** XML-based (.val for patterns, .vit for measurements)

### 5.5 Patro (Python Library)

- **URL:** https://github.com/FabriceSalvaire/Patro
- **Language:** Python
- **License:** GPLv3

**Geometric primitives:**
- Bezier curves (linear, quadratic, cubic)
- Conic sections (circles, ellipses)
- B-splines
- Polygons, polylines, segments
- Paths with bulge properties

**Mathematical capabilities:**
- Curve length calculations
- Flatness determination
- Intersection computations (Bezier with lines)
- Closest point calculations
- Polygon area and barycenter
- Moments of inertia

**Note:** Patro was formerly called PyValentina and implements similar drafting logic to Valentina in Python.

### 5.6 JBlockCreator

- **Language:** Java
- **Approach:** Implements standard block drafting methods (Aldrich, Gill, Beazley & Bond)
- **Garment types:** Trousers, skirts, bodices, sleeves (basic blocks)
- **Output:** ASTM/AAMA-DXF format
- **Key feature:** Designed for automation -- can connect to body scanners and plotters

---

## 6. Stage 5: Seam Allowance, Grain Lines, Notches

### 6.1 Seam Allowance Generation

Seam allowance is the extra fabric between the stitching line and the raw edge. Standard values:
- General seams: 3/8" (1 cm) or 5/8" (1.5 cm)
- Shoulders, side seams: 5/8" (1.5 cm)
- Hems: 1" - 2" (2.5 - 5 cm)
- Necklines, armholes: 1/4" - 3/8" (0.6 - 1 cm)

#### Computational Approach: Polygon/Curve Offsetting

Seam allowance generation is mathematically equivalent to **parallel curve generation** or **polygon offsetting**:

**For straight edges:** Simply translate the edge outward by the seam allowance distance, perpendicular to the edge.

**For curved edges (the hard part):** The offset of a Bezier curve is NOT another Bezier curve. Solutions:

1. **Discrete approximation:** Sample points along the curve at regular intervals, offset each point along the local normal by the seam allowance distance, fit a new curve through the offset points. For tight curves, sampling must be dense (every 1-1.5 cm) for accuracy.

2. **Minkowski sum with disk:** Mathematically, an offset is the boundary of the Minkowski sum of the shape with a disk of radius r (the seam allowance). For convex shapes this is straightforward; for concave shapes, the result may not be simple (can have self-intersections that must be resolved).

3. **Clipper2 library** (https://github.com/AngusJohnson/Clipper2): Production-quality polygon offsetting library. Performs intersection, union, difference and XOR boolean operations, plus polygon offsetting with different join types (round, square, miter) and end types. Handles both open and closed paths.

4. **CGAL library:** Provides exact and approximate offset polygon computation via Minkowski sums. Uses exact rational arithmetic for robustness. Handles non-convex polygons and produces polygons with holes whose edges are line segments or circular arcs.

5. **CavalierContours** (https://github.com/jbuckmccready/CavalierContours): 2D polyline library specifically for offsetting and combining. Handles open and closed polylines with line and arc segments.

#### Corner Handling

At corners where two seam edges meet, the seam allowance must handle the transition:
- **Outward corners:** Extend both offset edges and find intersection point, or add a rounded join
- **Inward corners (notch points):** The offset edges may cross; clip to intersection
- **Dart points:** The seam allowance must taper to the dart point

### 6.2 Grain Line Generation

The grain line indicates how the pattern piece should be aligned with the fabric's warp (lengthwise) threads.

**Standard rules:**
- **Lengthwise grain:** Default for most pieces. The grain line runs parallel to the selvage (fabric edge). Typically drawn as a vertical arrow on the pattern piece.
- **Cross-grain:** Perpendicular to selvage. Used for specific design effects.
- **Bias:** 45-degree angle to selvage. Used for pieces that need stretch (bias-cut skirts, binding strips).

**Computational generation:**
1. Determine the intended grain direction for each pattern piece (usually vertical = lengthwise grain)
2. In 3D: the grain direction corresponds to the garment's vertical axis (gravity direction)
3. When flattening 3D to 2D, the grain alignment axis is transported from 3D to 2D (see Computational Pattern Making, Section 4.3)
4. On the 2D pattern piece, draw a double-headed arrow along the computed grain direction
5. The arrow should be positioned in the interior of the piece, typically centered

**In parametric systems (FreeSewing):** Grain lines are added as a Snippet annotation on each Part, aligned with the pattern's Y-axis (which conventionally represents the grain direction).

### 6.3 Notch Generation

Notches are alignment marks on pattern edges that tell the sewist how to match pieces during assembly.

**Types of notches:**
- **Single notch:** Small triangular cut or outward mark on a seam edge
- **Double notch:** Two adjacent marks (used to distinguish front from back on similar-looking edges)
- **Dot/drill hole:** Internal marks for dart tips, pocket placement, etc.

**Placement rules:**
- Matching seam edges get corresponding notches at the same distance along the seam
- Key construction points get notches: center front/back, shoulder seam intersection with armhole, side seam intersection with waistline, sleeve cap ease distribution points
- On curved seams (like armholes), notches help distribute ease correctly

**Computational generation:**
1. For each pair of stitched edges (e.g., sleeve cap to armhole), identify corresponding points
2. Place notches at key positions: seam endpoints, midpoints, quarter points, ease distribution points
3. Single notch on front, double notch on back (convention)
4. Generate the notch geometry: small perpendicular marks or triangular cutouts extending from the seam line

**In ISP representation:** Stitch information is encoded as edge-level labels pairing edges from different panels. Notch positions can be derived from the stitch correspondence: any point on one stitched edge maps to a corresponding point on the matching edge.

### 6.4 Other Construction Markings

- **Dart lines:** V-shaped lines indicating where fabric should be folded and stitched. Include the dart point (tip) and dart legs (sides). Dart width at the seam line and dart length define the shape.
- **Buttonhole placement:** Marks for button/buttonhole positions, typically spaced at regular intervals
- **Pleat lines:** Fold lines and placement lines for pleats
- **Gathering lines:** Indicate sections to be gathered (eased) during construction
- **Cut-on-fold marks:** Arrow/bracket indicating the pattern piece should be placed on a fabric fold (to create a symmetric piece from a half-pattern)

---

## 7. Stage 6: Printing and Tiling

### 7.1 The Tiling Problem

Sewing pattern pieces are typically larger than a home printer's page size (A4 = 210x297mm, US Letter = 216x279mm). A bodice front piece might be 50cm tall by 40cm wide, requiring ~6 pages.

The solution is to **tile** the pattern across multiple pages that are printed individually and then taped together.

### 7.2 Tiling Algorithm

1. **Determine bounding box** of each pattern piece (or all pieces if laying out on one sheet)
2. **Add margins** for overlap, trim marks, and page numbering
3. **Divide into grid** of page-sized tiles with overlap:
   - Compute number of rows: `ceil(height / (page_height - overlap))`
   - Compute number of columns: `ceil(width / (page_width - overlap))`
4. **For each tile:**
   - Set viewport to the tile's portion of the full pattern
   - Clip pattern geometry to tile boundaries
   - Add registration/alignment marks
   - Add row/column labels
   - Add trim guides

### 7.3 Alignment and Registration Systems

Different pattern companies use different alignment systems:

**Triangle matching:** Small triangles on tile edges marked with letters (columns) and numbers (rows). Match corresponding letters/numbers during assembly.

**Diamond alignment:** Diamond shapes split across adjacent tile edges. When tiles are aligned correctly, the diamonds complete.

**Frame overlap:** Each page has a frame with a specific trim line. Overlap adjacent pages so frames align exactly. Tape and trim.

**Cross registration marks:** + shaped marks at tile corners for alignment and trim guides.

### 7.4 Assembly Process

1. Print all pages at 100% scale (no scaling/fit-to-page)
2. Verify scale using a test square (typically 1" or 1cm square printed on first page)
3. Trim pages along indicated cut/trim lines
4. Arrange pages in row/column order
5. Overlap adjacent pages, aligning registration marks
6. Tape together

### 7.5 PDF Generation Approaches

**A0/large format:** Generate a single large PDF page (A0 = 841x1189mm) that can be printed at a copy shop. No tiling needed.

**A4/Letter tiled:** Generate multi-page PDF where each page is one tile of the full pattern.

**Dual format:** Many pattern companies provide both A0 and tiled versions.

**Software implementations:**

- **PDFStitcher** (https://github.com/cfcurtis/pdfstitcher): Open-source Python tool that converts between tiled and large-format PDFs. Originally designed for projector sewing (untiling patterns for projection). Can also tile large patterns into pages. Handles page trimming, overlap, and row/column specification.

- **FreeSewing:** Generates SVG output that can be converted to PDF. Handles tiling through its print layout engine.

- **ReportLab (Python):** General-purpose PDF generation library. Provides Canvas API for drawing lines, curves, text. Supports arbitrary page sizes (A4, Letter, custom). Can be used to implement custom tiling with registration marks.

### 7.6 Key Technical Details for Implementation

```
Page dimensions (points, 1pt = 1/72"):
  A4:     595.28 x 841.89 pt  (210 x 297 mm)
  Letter: 612 x 792 pt        (215.9 x 279.4 mm)

Typical overlap: 0.5" (12.7mm) or 1cm on each edge
Printable area: ~5mm inside each page edge (varies by printer)
Scale verification: 1" square or 2cm square on first page

Registration mark specifications:
  - Cross marks at tile corners: 5mm arm length, 0.3pt line weight
  - Row/column labels: 8pt font, positioned in margins
  - Trim lines: dashed, 0.3pt weight, in non-printable margin area
```

---

## 8. AI/ML Approaches (End-to-End and Hybrid)

### 8.1 Direct Image-to-Pattern Prediction

#### SewFormer (ACM TOG 2023)
- **Paper:** https://arxiv.org/abs/2311.04218
- **Architecture:** Visual encoder + two-level Transformer decoder + stitch prediction module
  - Visual encoder: Learns sequential visual representations from input RGB image
  - Panel-level decoder: Predicts the set of panels (how many, rough shape)
  - Edge-level decoder: Refines each panel's boundary (Bezier curve control points)
  - Stitch predictor: Determines which edges connect to which
- **Training data:** SewFactory dataset (~1M synthetic images with ground-truth patterns)
- **Pattern representation:** Each panel is defined by ordered edge vertices and Bezier control points. Edges have curvature parameters. Panels have 3D placement transforms (rotation + translation).
- **Limitation:** Trained on synthetic data; limited generalization to real photos.

#### Panelformer (WACV 2024)
- **Paper:** https://openaccess.thecvf.com/content/WACV2024/papers/Chen_Panelformer_Sewing_Pattern_Reconstruction_From_2D_Garment_Images_WACV_2024_paper.pdf
- **Code:** https://github.com/ericsujw/Panelformer
- **Architecture:** Panel transformer + stitch predictor
- **Key innovation:** Handles occlusion by leveraging symmetric and correlated nature of garment panels
- **Performance:** Outperforms baselines; comparable to NeuralTailor (which requires 3D input)

#### DressWild (arXiv, February 2026)
- **Paper:** https://arxiv.org/abs/2602.16502
- **Full pipeline:**
  1. **Pose canonicalization:** VLM (Nanobanana Pro/Gemini) synthesizes a normalized T-pose front-facing image from arbitrary input photo
  2. **Segmentation:** HybridGL performs referring segmentation on both original and canonical images
  3. **Multi-stream feature extraction:**
     - 3D features: Hunyuan3D-2.0 extracts latent representations capturing 3D-aware geometry
     - Pose features: SAM3D-Body encoder extracts pose embeddings
     - Image features: Additional appearance cues
  4. **Feature fusion:** Linear projection to shared embedding space, concatenation, transformer encoder with self-attention for cross-modal interaction
  5. **Parameter decoding:** Decoder-based transformer autoregressively predicts sewing pattern parameters
  6. **Post-processing:** Physics-based simulation (Position-Based Dynamics + CIPC) drapes pattern onto body
- **Pattern representation:** 2D panels as closed planar polygons with Bezier curve edges, 3D placement transforms, stitch topology as edge-level labels
- **Performance:** 94.35% panel accuracy, 85.41% edge accuracy

### 8.2 Diffusion-Based Pattern Generation

#### GarmentDiffusion (IJCAI 2025)
- **Paper:** https://arxiv.org/abs/2504.21476
- **Code:** https://github.com/Shenfu-Research/GarmentDiffusion
- **Architecture:** Diffusion transformer (DiT) that denoises sewing pattern parameters
- **Pattern representation:** Edge-centric encoding:
  - Start/control points for Bezier curves (3D coordinates)
  - Arc parameters (radius, orientation)
  - Stitch tags and flags
  - Panel and edge-order indices
  - Sequence length 10x shorter than autoregressive SewingGPT
- **Multi-modal conditioning:** Text (CLIP text encoder), images (CLIP image encoder), incomplete patterns (noise replacement). Decoupled cross-attention layers for separate modalities.
- **Speed:** <1 second generation on A10 GPU

#### SewingLDM (2024)
- **Paper:** https://arxiv.org/html/2412.14453v1
- **Architecture:** Latent Diffusion Model based on DiT
- **Pattern representation:** 29-dimensional edge vectors including:
  - Edge geometry (directional vectors, quadratic/cubic Bezier control points, circular arc parameters)
  - Edge type flags (4 binary: straight, quadratic, cubic, arc)
  - Attachment constraints (3 binary: collar, waistband, other)
  - Stitch information (masks and reversal flags)
  - 3D placement (rotation, translation per panel)
- **Two-stage training:**
  1. Train diffusion conditioned on text only (T5 tokenizer)
  2. Inject body shape and sketch conditions via feature fusion + selective attention fine-tuning
- **Compression:** Auto-encoder compresses patterns to bounded latent space [-1, 1]

### 8.3 VLM-Driven Parametric Generation

#### ChatGarment (CVPR 2025)
- **Paper:** https://chatgarment.github.io/
- **Approach:** Fine-tunes a VLM to output JSON garment parameters from images/text/sketches, then feeds parameters to GarmentCode to generate actual patterns
- **Key insight:** VLMs already understand garments from pre-training; they just need to be taught the GarmentCode parameter space

#### Design2GarmentCode (CVPR 2025)
- **Paper:** https://arxiv.org/abs/2412.08603
- **Architecture:**
  - **Multi-Modal Understanding Agent (MMUA):** GPT-4V interprets design inputs (images, text, sketches)
  - **DSL Generation Agent (DSL-GA):** Llama-3.2-3B finetuned on GarmentCode syntax (LoRA)
  - **GarmentCode Engine:** Executes synthesized programs to produce patterns
- **Pattern representation:** 122 parametric tokens (10x more compact than DressCode). Parameters quantized by type: booleans -> 0/1, integers -> unchanged, floats -> normalized and scaled (lambda=100 for cm precision), categoricals -> indexed.
- **Workflow:**
  1. DSL-GA generates targeted questions for MMUA
  2. MMUA extracts design features from multi-modal inputs
  3. Lightweight transformer projector converts descriptions to numerical parameters
  4. System generates executable GarmentCode programs
  5. Validation stage compares generated garment with original design for iterative refinement

#### AIpparel (CVPR 2025)
- **Paper:** https://arxiv.org/abs/2412.03937
- **Approach:** Large multimodal model fine-tuned on 120K+ garments with multi-modal annotations
- **Tokenization:** Novel sewing pattern tokenizer encodes each panel as special tokens. Panel vertex positions and 3D transformations as positional embeddings.
- **Capabilities:** Text-to-garment, image-to-garment, language-instructed pattern editing

#### GarmentGPT (OpenReview 2025)
- **Approach:** RVQ-VAE (Residual Vector Quantizer Variational AutoEncoder) tokenizes continuous pattern boundary curves into discrete tokens
- **Generation:** Fine-tuned VLM autoregressively predicts token sequences
- **Key idea:** Discrete latent tokenization enables compositional reasoning aligned with LLM capabilities

### 8.4 Differentiable Physics Refinement

#### Inverse Garment and Pattern Modeling (CGF 2024)
- **Paper:** https://arxiv.org/abs/2403.06841
- **Approach:** Uses differentiable ARCSim cloth simulator for pattern recovery from 3D shape
- **Optimization loop:**
  1. **Phase 1 -- Linear Grading:** Adjusts pattern control points to match target measurements using Mean Value Coordinates deformation
  2. **Phase 2 -- Iterative Refinement:**
     - Simulate garment draping with current pattern (forward pass)
     - Compute loss: curvature-weighted Chamfer distance between simulated and target geometry
     - Backpropagate gradients through differentiable simulator
     - Update pattern control points and material parameters (stretching stiffness, bending stiffness) via Adam optimizer
     - Repeat until convergence
- **Manufacturing constraints:**
  - **Inter-panel symmetry:** Detects matching panels via rigid alignment scoring
  - **Intra-panel symmetry:** Finds mirror-symmetric control point pairs within panels
  - **Seam-consistency loss:** Ensures matching curve lengths across stitched panel edges
- **Technical innovations:**
  - SDF-based collision handling (replacing expensive differentiable contact)
  - Static mapping matrices for 15x speedup in matrix assembly
  - Joint optimization of pattern geometry AND physical material parameters

#### DiffAvatar (CVPR 2024)
- **Paper:** https://arxiv.org/abs/2311.12194
- **Approach:** Body and garment co-optimization using differentiable simulation
- **Application:** Recovers body shape, garment geometry, and material parameters simultaneously

#### Dress-1-to-3 (ACM TOG 2025)
- **Paper:** https://arxiv.org/abs/2502.03449
- **Full pipeline:**
  1. Pre-trained image-to-sewing-pattern model generates coarse patterns
  2. Multi-view diffusion model produces multi-view images
  3. Differentiable garment simulator refines pattern shape and physical parameters
  4. Texture generation + human motion generation for demonstrations

### 8.5 DMap: Diffusion Mapping via Pattern Coordinates (SIGGRAPH 2025)

- **Paper:** https://arxiv.org/abs/2504.08353
- **Code:** https://github.com/liren2515/DMap
- **Key innovation:** Combines ISP (Implicit Sewing Patterns) with a generative diffusion model to learn garment shape priors in 2D UV space
- **Mapping:** Establishes pixel-to-UV-to-3D correspondences, enabling joint optimization of 3D mesh and 2D patterns
- **Generalization:** Trained on synthetic data but generalizes to real-world images

### 8.6 Sewing Pattern Representation Comparison

| Representation | Used By | Pros | Cons |
|---|---|---|---|
| **Explicit vertices + Bezier edges** | SewFormer, DressWild, GarmentDiffusion | Direct, precise, traditional | Variable-length sequences; hard for ML |
| **Edge-centric 29D vectors** | SewingLDM | Fixed-dimension per edge; handles curves/arcs | Fixed feature size limits expressiveness |
| **Parametric programs (GarmentCode)** | ChatGarment, Design2GarmentCode | Compact (122 tokens); interpretable; editable | Limited to GarmentCode's design space |
| **Discrete latent tokens (RVQ-VAE)** | GarmentGPT | Compositional; LLM-compatible | Lossy compression |
| **Special LMM tokens** | AIpparel | Integrates with language model | Requires large-scale training |
| **Raster/image encoding** | GarmentImage | CNN-friendly; smooth interpolation | Resolution-limited; lossy |
| **Implicit SDF + UV map** | ISP, DMap | Continuous; smooth; topology-agnostic | Not directly printable |
| **Garmage (geometry images)** | GarmageNet | Panel-wise; bridges 2D-3D | Fixed resolution per panel |

---

## 9. Cosplay-Specific Pattern Generation

### 9.1 Current Cosplay Pattern Workflow

The typical cosplay pattern-making workflow from a reference image:

1. **Reference collection:** Compile character reference images from multiple angles (game screenshots, official art, fan art)
2. **Measurement scaling:** Use tools like ImageJ to measure proportions in reference images relative to character height, then scale to maker's actual height/body
3. **3D modeling (for armor):** Model pieces in Blender, ZBrush, or Fusion 360, export STL/OBJ
4. **Unfolding (for armor/foam):** Use Pepakura Designer to unfold 3D model into flat pieces
5. **Draping (for fabric):** For fabric pieces, use duct tape/plastic wrap body double technique to create pattern directly on the body
6. **Flat pattern drafting:** Modify commercial sewing patterns (Simplicity, McCall's, Butterick cosplay lines) to match character design
7. **Test fitting:** Muslin/toile mock-up, adjust pattern

### 9.2 Pepakura and 3D-to-Pattern for Cosplay

**Pepakura Designer** is widely used in cosplay for armor and props:
- Input: 3D model (OBJ, STL)
- Process: Unfolds 3D mesh faces into flat, connected groups
- Output: 2D pattern pieces with fold lines, tab marks, and page numbers
- Primarily for paper/foam crafting, NOT fabric (does not account for fabric properties)

**Key difference from fabric patterns:** Pepakura unfolds rigid/semi-rigid materials where each triangle face maps 1:1 to flat space. Fabric patterns must account for stretch, drape, and gather -- a fundamentally different problem.

### 9.3 Community Resources

- **DRCOS** (https://dr-cos.info/): 3,600+ free cosplay sewing patterns as PDF downloads
- **NDL Workshop** (https://ndlwrkshop.com/): Cosplay-specific PDF sewing patterns
- **CosPayton** (https://cospayton.com/): Cosplay patterns and blueprints
- **Kamui Cosplay** (https://www.kamuicosplay.com/): Books, patterns, tutorials for foam and fabric cosplay
- **405th Regiment** (https://www.405th.com/): Halo-focused community with extensive Pepakura file library
- **The RPF** (https://www.therpf.com/): Replica Prop Forum with build logs and patterns
- **Reddit communities:** r/cosplay, r/cosplayprops, r/CosplayProps

### 9.4 Gap: Photo-to-Cosplay-Pattern

No existing tool takes a character reference image and produces a sewing pattern. The current workflow is entirely manual, involving significant pattern drafting expertise.

The unique challenges of cosplay patterns vs. regular garment patterns:
- **Non-standard garments:** Cosplay involves armor, capes, tabards, robes, and other garments not found in standard pattern libraries
- **Complex construction:** Many cosplay garments combine fabric, foam, thermoplastics, and other materials
- **Accuracy to reference:** Must match specific character design details (color blocking, trim placement, emblem positioning)
- **Fantasy proportions:** Character designs may not follow realistic body proportions, requiring adaptation
- **Multi-material:** A single costume often needs both sewing patterns (fabric) and Pepakura-style patterns (foam/armor)

---

## 10. Recommended Technical Architecture

Based on all the research above, here is the most viable technical architecture for an image-to-printable-pattern system:

### 10.1 Pipeline Design

```
INPUT: Photo of garment/costume + User body measurements
                    |
                    v
    +-----------------------------------+
    | STAGE 1: Garment Analysis (VLM)   |
    | - Segment garment from background |
    | - Classify garment type/category  |
    | - Extract style attributes:       |
    |   neckline, sleeve, silhouette,   |
    |   closure, length, details        |
    | - Identify construction details:  |
    |   seam placement, darts, gathers  |
    +-----------------------------------+
                    |
                    v
    +-----------------------------------+
    | STAGE 2: Pattern Generation       |
    | Option A (Parametric):            |
    |   Map attributes -> GarmentCode   |
    |   or FreeSewing parameters        |
    |   Generate sized pattern from     |
    |   measurements + parameters       |
    |                                   |
    | Option B (Neural prediction):     |
    |   SewFormer/DressWild style       |
    |   Direct image-to-pattern         |
    |   Then resize to measurements     |
    |                                   |
    | Option C (Hybrid):                |
    |   Parametric base + neural        |
    |   refinement for specific details |
    +-----------------------------------+
                    |
                    v
    +-----------------------------------+
    | STAGE 3: Pattern Refinement       |
    | - Verify physical plausibility    |
    |   (optional: differentiable sim)  |
    | - Ensure pattern symmetry         |
    | - Validate seam length matching   |
    +-----------------------------------+
                    |
                    v
    +-----------------------------------+
    | STAGE 4: Construction Details     |
    | - Add seam allowances             |
    |   (polygon offsetting)            |
    | - Add grain lines                 |
    | - Add notch marks                 |
    | - Add labels, markings            |
    | - Cut-on-fold indicators          |
    +-----------------------------------+
                    |
                    v
    +-----------------------------------+
    | STAGE 5: Layout & Tiling          |
    | - Arrange pieces for efficient    |
    |   fabric usage (nesting)          |
    | - Generate tiled PDF (A4/Letter)  |
    | - Add registration marks          |
    | - Add assembly guides             |
    | - Include test square for scale   |
    +-----------------------------------+
                    |
                    v
OUTPUT: Tiled PDF with all pattern pieces,
        construction details, and assembly guide
```

### 10.2 Technology Stack Recommendations

| Component | Recommended Technology | Rationale |
|---|---|---|
| Garment segmentation | SegFormer (segformer_b2_clothes) or Mask R-CNN | Mature, pre-trained, fast |
| Style attribute extraction | GPT-4V / Claude Vision / fine-tuned VLM | Can extract detailed attributes from complex images |
| Body measurements | SMPL estimation (PyMAF-X) or user input | SMPL is well-established; user input is more reliable |
| Parametric pattern generation | GarmentCode (Python) or FreeSewing (JS) | GarmentCode has better AI integration; FreeSewing has more designs |
| Neural pattern prediction | SewFormer / Panelformer | Open-source, established baselines |
| Physics refinement | Differentiable simulation (optional) | Expensive but ensures physical plausibility |
| Seam allowance | Clipper2 or CavalierContours | Production-quality polygon offsetting |
| Grain lines / notches | Custom implementation | Straightforward geometry from pattern structure |
| PDF generation | ReportLab (Python) or Cairo | ReportLab is well-documented; Cairo is faster |
| PDF tiling | Custom or adapt PDFStitcher logic | PDFStitcher is open-source reference |

### 10.3 Key Datasets for Training/Evaluation

| Dataset | Size | Contents | Use |
|---|---|---|---|
| **SewFactory** | 1M images | Image + sewing pattern pairs, diverse poses/bodies | Training image-to-pattern models |
| **GarmentCodeData** | 115K garments | Parametric patterns + 3D drapes + measurements | Training parametric prediction; evaluation |
| **DeepFashion3D v2** | 2,078 models | 3D garment scans with feature lines | 3D reconstruction benchmarking |
| **GarVerseLOD** | 6,000 models | Artist-created LOD garment models | High-quality 3D reconstruction training |
| **LIP / ATR** | 50K / 17K images | Human parsing labels | Segmentation training |
| **Fashionpedia** | 48K images | Fine-grained attributes + segmentation | Attribute classification |

### 10.4 Critical Implementation Challenges

1. **The representation gap:** Academic pattern representations (Bezier control points, edge sequences) do not directly translate to printable patterns with all construction details. Significant post-processing is needed.

2. **Measurement-to-pattern sizing:** Most ML approaches predict pattern *shapes* but not *sizes*. Integrating body measurements to produce correctly-sized patterns remains an unsolved integration problem.

3. **Construction detail generation:** No existing ML model outputs seam allowances, notches, or grain lines. These must be added algorithmically as a post-processing step.

4. **Fabric considerations:** Pattern sizing depends on fabric stretch, weight, and drape. No current system accounts for this.

5. **Validation:** How do you verify a generated pattern would actually produce the intended garment? Differentiable simulation is one approach but is computationally expensive.

6. **Complex garments:** Garments with linings, facings, interfacing, or multiple layers are not well-handled by any existing approach.

7. **Cosplay specificity:** Fantasy garments, armor integration, and non-standard construction techniques are not covered by existing training data.

---

## Sources

### Garment Segmentation
- [4D-DRESS Dataset (CVPR 2024)](https://openaccess.thecvf.com/content/CVPR2024/papers/Wang_4D-DRESS_A_4D_Dataset_of_Real-World_Human_Clothing_With_Semantic_CVPR_2024_paper.pdf)
- [ClothSeg: Feature Projection Fusion](https://www.sciencedirect.com/science/article/abs/pii/S1047320323002304)
- [Clothing Segmentation with DeepLabV3+](https://github.com/mberkay0/clothing-segmentation)
- [SegFormer B2 Clothes (HuggingFace)](https://huggingface.co/mattmdjaga/segformer_b2_clothes)
- [Fashion Segmentation Datasets (FASHN)](https://fashn.ai/blog/fashion-segmentation-datasets-and-their-common-problems)
- [DSA-YOLO for Clothing Segmentation](https://dl.acm.org/doi/pdf/10.1145/3722405.3722419)

### 3D Garment Reconstruction
- [DeepFashion3D (ECCV 2020)](https://arxiv.org/abs/2003.12753)
- [BCNet: Body and Cloth Shape (ECCV 2020)](https://link.springer.com/chapter/10.1007/978-3-030-58565-5_2)
- [ClothCap (SIGGRAPH 2017)](https://virtualhumans.mpi-inf.mpg.de/papers/ponsmollSIGGRAPH17clothcap/ponsmollSIGGRAPH17clothcap.pdf)
- [GarVerseLOD (ACM TOG 2024)](https://arxiv.org/abs/2411.03047)
- [Gaussian Garments (2024)](https://arxiv.org/abs/2409.08189)
- [REC-MV (CVPR 2023)](https://arxiv.org/abs/2305.14236)
- [ISP: Implicit Sewing Patterns](https://arxiv.org/abs/2305.14100)

### 3D to 2D Flattening
- [Computational Pattern Making from 3D Garment Models (SIGGRAPH 2022)](https://dl.acm.org/doi/10.1145/3528223.3530145)
- [parafashion code (GitHub)](https://github.com/nicopietroni/parafashion)
- [As-Rigid-As-Possible Surface Modeling](https://igl.ethz.ch/projects/ARAP/arap_web.pdf)
- [ARAP Shape Manipulation & Surface Flattening](https://www-ui.is.s.u-tokyo.ac.jp/~takeo/papers/takeo_jgt09_arapFlattening.pdf)
- [PerfectTailor: Scale-Preserving 2D Pattern Adjustment](https://arxiv.org/html/2312.08386v2)
- [PartUV: Part-Based UV Unwrapping](https://arxiv.org/html/2511.16659)
- [xatlas UV unwrapping library](https://github.com/jpcy/xatlas)

### Parametric Pattern Systems
- [FreeSewing (Developer Docs)](https://freesewing.dev/)
- [FreeSewing (GitHub)](https://github.com/freesewing)
- [GarmentCode (GitHub)](https://github.com/maria-korosteleva/GarmentCode)
- [GarmentCodeData (ECCV 2024)](https://arxiv.org/abs/2405.17609)
- [Seamly2D (GitHub)](https://github.com/FashionFreedom/Seamly2D)
- [Valentina](https://valentina-project.org/)
- [Patro Python Library](https://github.com/FabriceSalvaire/Patro)

### Seam Allowance & Construction Details
- [Clipper2 Polygon Offsetting Library](https://github.com/AngusJohnson/Clipper2)
- [CavalierContours Polyline Library](https://github.com/jbuckmccready/CavalierContours)
- [CGAL 2D Minkowski Sums](https://doc.cgal.org/latest/Minkowski_sum_2/index.html)
- [Dart Insertion for Curved Surface Fitting](https://www.academia.edu/19868351/Fitting_a_woven_cloth_model_to_a_curved_surface_dart_insertion)
- [Expert-based Dart Design](https://www.researchgate.net/publication/235290125_Expert-based_customized_pattern-making_automation_Part_II_Dart_design)

### PDF Tiling & Printing
- [PDFStitcher (GitHub)](https://github.com/cfcurtis/pdfstitcher)
- [PDFStitcher (PyPI)](https://pypi.org/project/pdfstitcher/)
- [ReportLab PDF Library](https://docs.reportlab.com/reportlab/userguide/ch2_graphics/)

### AI/ML Approaches
- [SewFormer (ACM TOG 2023)](https://arxiv.org/abs/2311.04218)
- [Panelformer (WACV 2024)](https://github.com/ericsujw/Panelformer)
- [DressWild (arXiv 2026)](https://arxiv.org/abs/2602.16502)
- [GarmentDiffusion (IJCAI 2025)](https://arxiv.org/abs/2504.21476)
- [SewingLDM (2024)](https://arxiv.org/html/2412.14453v1)
- [ChatGarment (CVPR 2025)](https://chatgarment.github.io/)
- [Design2GarmentCode (CVPR 2025)](https://arxiv.org/abs/2412.08603)
- [AIpparel (CVPR 2025)](https://arxiv.org/abs/2412.03937)
- [GarmentGPT (OpenReview 2025)](https://openreview.net/forum?id=XzXKnazRBF)
- [GarmageNet (SIGGRAPH Asia 2025)](https://arxiv.org/abs/2504.01483)
- [Inverse Garment Modeling (CGF 2024)](https://arxiv.org/abs/2403.06841)
- [DiffAvatar (CVPR 2024)](https://arxiv.org/abs/2311.12194)
- [Dress-1-to-3 (ACM TOG 2025)](https://arxiv.org/abs/2502.03449)
- [DMap (SIGGRAPH 2025)](https://arxiv.org/abs/2504.08353)
- [DressCode/SewingGPT (SIGGRAPH 2024)](https://arxiv.org/abs/2401.16465)
- [GarmentImage (SIGGRAPH 2025)](https://arxiv.org/abs/2505.02592)
- [NeuralTailor (ACM TOG 2022)](https://arxiv.org/abs/2201.13063)

### Cosplay Resources
- [DRCOS Cosplay Patterns](https://dr-cos.info/)
- [NDL Workshop](https://ndlwrkshop.com/)
- [Kamui Cosplay](https://www.kamuicosplay.com/)
- [405th Regiment](https://www.405th.com/)
- [The RPF (Replica Prop Forum)](https://www.therpf.com/)
- [Pepakura Designer](http://www.tamasoft.co.jp/pepakura-en/)
- [BRONAVARO Pepakura Templates](https://bronavaro.com/)

### General Reviews
- [Deep Learning for 3D Garment Generation: A Review (2025)](https://journals.sagepub.com/doi/abs/10.1177/00405175251335188)
- [Awesome 3D Garments (curated list)](https://github.com/Shanthika/Awesome-3D-Garments)
- [Cool GenAI Fashion Papers](https://github.com/wendashi/Cool-GenAI-Fashion-Papers)
- [Top AI Pattern Making Tools 2025](https://www.style3d.ai/blog/what-are-the-top-ai-pattern-making-tools-for-designers-in-2025/)
