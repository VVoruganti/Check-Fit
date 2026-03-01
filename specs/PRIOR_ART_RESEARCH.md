# Prior Art Research: Photo-to-Sewing-Pattern Generation

**Date:** 2026-02-28
**Scope:** Commercial products, academic research, body measurement tools, garment segmentation, open source projects, and AI/ML approaches related to generating sewing patterns from photographs.

---

## Table of Contents

1. [Commercial Products](#1-commercial-products)
2. [Academic Research](#2-academic-research)
3. [Body Measurement from Photos](#3-body-measurement-from-photos)
4. [Garment Segmentation](#4-garment-segmentation)
5. [Open Source Projects](#5-open-source-projects)
6. [AI/ML Approaches](#6-aiml-approaches)
7. [Gap Analysis & Synthesis](#7-gap-analysis--synthesis)

---

## 1. Commercial Products

### 1.1 Tailornova (Bootstrap Fashion)
- **URL:** https://tailornova.com/
- **What it does:** Online 3D fashion design software that generates made-to-measure sewing patterns. Users create a customizable 3D FitModel with their measurements, height, and body shape, then design garments on it. Patterns are automatically adjusted to the wearer's dimensions.
- **Strengths:** Real-time 3D visualization, parametric made-to-measure patterns, supports multiple fit models, generates actual printable pattern pieces.
- **Gaps:** No photo-based input -- users must manually enter measurements and design garments through a style-mixing interface. No automatic garment recognition from photos.
- **Relevance:** Demonstrates the measurement-to-pattern pipeline well. The missing link is automated measurement extraction and garment silhouette recognition from photos.

### 1.2 CLO3D
- **URL:** https://www.clo3d.com/
- **What it does:** Industry-leading 3D garment simulation software. Designers create 2D patterns and simulate them on 3D avatars with realistic fabric physics. Offers a "photo upload" option for digitizing paper patterns by tracing.
- **Strengths:** Best-in-class fabric simulation, realistic drape/texture rendering, widely used by fashion brands. Pattern output is production-ready.
- **Gaps:** Fundamentally a manual design tool -- does not generate patterns from photos. The photo upload feature is for tracing existing paper patterns, not generating new ones. Expensive ($50/month+).
- **Relevance:** Represents the gold standard for 3D garment visualization and simulation. Could serve as a downstream rendering/validation engine.

### 1.3 Browzwear
- **URL:** https://browzwear.com/
- **What it does:** Enterprise 3D fashion design platform targeting technical designers and brands. Creates digital twins of physical garments, generates production-ready patterns and tech packs.
- **Strengths:** Production accuracy, robust PLM/Adobe integration, collaborative cloud environment.
- **Gaps:** Enterprise-focused, no consumer photo-to-pattern workflow. Requires skilled pattern makers.
- **Relevance:** Validates market need for accurate digital pattern generation; potential integration target.

### 1.4 fashionINSTA
- **URL:** https://fashioninsta.ai/
- **What it does:** AI-powered sketch-to-pattern platform. Learns from a brand's existing pattern library to transform fashion sketches into .dxf digital patterns in ~10 minutes.
- **Strengths:** Extracts 750+ features from each pattern, 95% production accuracy, preserves brand DNA. Generates actual manufacturer-ready patterns.
- **Gaps:** Input is sketches, not photos. Requires an existing pattern library to train against. Not consumer-facing.
- **Relevance:** Closest commercial product to automated pattern generation, but from sketch input rather than photo input. Demonstrates that AI can produce production-quality patterns.

### 1.5 Sewist CAD
- **URL:** https://www.sewist.com/
- **What it does:** Free online pattern designer with mix-and-match system. Users select style options (collar type, sleeve style, etc.) and enter measurements; software generates made-to-measure PDF patterns.
- **Strengths:** Free, web-based, generates printable PDF patterns, extensive style library (~trillion+ combinations claimed). No design expertise needed.
- **Gaps:** Fully manual style selection -- no photo input, no AI recognition. Limited customization beyond predefined options.
- **Relevance:** Demonstrates the mix-and-match parametric approach to pattern generation. Could serve as a model for how to decompose garments into parametric style choices.

### 1.6 DartSide
- **URL:** https://apps.apple.com/us/app/dartside-pattern-drafting/id6468904118
- **What it does:** Mobile sewing pattern editor. Allows scanning of paper patterns with iPhone/iPad for digitization, editing, and export.
- **Strengths:** Mobile-first, uses device camera for pattern digitization.
- **Gaps:** Digitizes existing patterns only -- does not generate new patterns from garment photos.
- **Relevance:** Demonstrates mobile pattern capture workflow.

---

## 2. Academic Research

### 2.1 SewFormer (ACM TOG, 2023)
- **Paper:** "Towards Garment Sewing Pattern Reconstruction from a Single Image"
- **URL:** https://arxiv.org/abs/2311.04218 | https://sewformer.github.io/
- **What it does:** Two-level Transformer network that predicts garment sewing patterns from a single casually-taken photo of a clothed person. Introduces the SewFactory dataset (~1M synthetic images with ground-truth patterns).
- **Strengths:** End-to-end image-to-pattern prediction. Handles diverse poses and body shapes. Includes stitch prediction (how panels connect).
- **Gaps:** Trained on synthetic data -- generalization to real-world photos is limited. Output patterns are simplified (limited panel complexity). Does not account for body measurements.
- **Relevance:** **Most directly relevant prior work.** Demonstrates feasibility of photo-to-pattern. Key gap: does not produce body-measurement-aware, printable patterns.

### 2.2 Panelformer (WACV 2024)
- **Paper:** "Panelformer: Sewing Pattern Reconstruction from 2D Garment Images"
- **URL:** https://github.com/ericsujw/Panelformer
- **What it does:** Transformer-based network that reconstructs sewing patterns from 2D garment images. Uses a panel transformer + stitch predictor architecture.
- **Strengths:** Works from 2D images (more accessible than 3D point clouds). Handles occlusion using garment symmetry priors. Achieves comparable performance to NeuralTailor (which requires 3D input).
- **Gaps:** Limited garment type diversity. Pattern output is parametric (not ready-to-print). Evaluated primarily on synthetic data.
- **Relevance:** Validates 2D-image-to-pattern approach. Demonstrates that occluded panels can be inferred.

### 2.3 GarmentDiffusion (IJCAI 2025)
- **Paper:** "3D Garment Sewing Pattern Generation with Multimodal Diffusion Transformers"
- **URL:** https://arxiv.org/abs/2504.21476 | https://github.com/Shenfu-Research/GarmentDiffusion
- **What it does:** Diffusion transformer model that generates centimeter-precise, vectorized 3D sewing patterns from multimodal inputs (text, images, incomplete patterns).
- **Strengths:** Ultra-fast generation (<1 second on A10 GPU). Supports multiple input modalities. Outperforms SewingGPT significantly.
- **Gaps:** Focus is on generation (creating new designs) rather than reconstruction (matching existing garments). No body measurement integration.
- **Relevance:** State-of-the-art in generative pattern creation. Could be adapted for conditioned generation from photo + measurements.

### 2.4 DressCode / SewingGPT (SIGGRAPH 2024)
- **Paper:** "DressCode: Autoregressively Sewing and Generating Garments from Text Guidance"
- **URL:** https://arxiv.org/abs/2401.16465 | https://github.com/IHe-KaiI/DressCode
- **What it does:** GPT-based autoregressive model (SewingGPT) that generates sewing patterns from text descriptions. Full pipeline includes texture generation via Stable Diffusion.
- **Strengths:** Natural language interface for pattern generation. Produces both shape and texture. First to apply LLM-style architecture to sewing patterns.
- **Gaps:** Text-only input -- no photo or measurement conditioning. Generation quality limited by tokenization granularity.
- **Relevance:** Demonstrates that language models can learn sewing pattern structure. Text interface could complement photo-based input.

### 2.5 ChatGarment (CVPR 2025)
- **Paper:** "ChatGarment: Garment Estimation, Generation and Editing via Large Language Models"
- **URL:** https://chatgarment.github.io/ | https://github.com/biansy000/ChatGarment
- **What it does:** Fine-tunes a vision-language model (VLM) to generate JSON files describing garment parameters, which are then converted to sewing patterns via GarmentCode. Supports estimation from in-the-wild images/sketches, generation from text, and interactive editing.
- **Strengths:** **Multimodal input** (images, text, sketches). Interactive dialogue-based editing. Bridges VLMs with parametric pattern models.
- **Gaps:** Output is constrained by GarmentCode's parametric space. Not yet body-measurement-aware. Requires curated training data pipeline.
- **Relevance:** **Highly relevant.** Demonstrates using VLMs as the bridge between photos and parametric pattern systems. Interactive editing is a key UX differentiator.

### 2.6 DressWild (arXiv, February 2026)
- **Paper:** "DressWild: Feed-Forward Pose-Agnostic Garment Sewing Pattern Generation from In-the-Wild Images"
- **URL:** https://arxiv.org/abs/2602.16502
- **What it does:** Feed-forward pipeline that reconstructs physics-consistent 2D sewing patterns and corresponding 3D garments from a single in-the-wild image. Uses VLMs to normalize pose variations.
- **Strengths:** **Pose-agnostic** -- works on casual photos without requiring specific poses. Feed-forward (no iterative optimization). Supports wide garment variety (T-shirts, jackets, pants, skirts, jumpsuits, dresses).
- **Gaps:** Very recent (Feb 2026) -- no code/models released yet. No body measurement integration.
- **Relevance:** **Most recent and directly relevant work.** Addresses the key challenge of working with casual "in-the-wild" photos.

### 2.7 Dress-1-to-3 (ACM TOG 2025)
- **Paper:** "Single Image to Simulation-Ready 3D Outfit with Diffusion Prior and Differentiable Physics"
- **URL:** https://arxiv.org/abs/2502.03449 | https://dress-1-to-3.github.io/
- **What it does:** Pipeline that reconstructs separated, simulation-ready garments with sewing patterns from a single in-the-wild image. Combines sewing pattern estimation with multi-view diffusion and differentiable physics simulation.
- **Strengths:** Produces physically plausible, simulation-ready garments. Separates garments from body. Uses differentiable simulation for pattern refinement.
- **Gaps:** Computationally expensive (multi-view diffusion + iterative optimization). Not real-time. No measurement-based sizing.
- **Relevance:** Demonstrates the full pipeline from photo to simulation-ready patterns with physics refinement.

### 2.8 GarmentImage (SIGGRAPH 2025)
- **Paper:** "Raster Encoding of Garment Sewing Patterns with Diverse Topologies"
- **URL:** https://arxiv.org/abs/2505.02592
- **What it does:** Novel raster-based sewing pattern representation that encodes geometry, topology, and placement into multi-channel regular grids. Solves the problem of vector-based representations being ML-unfriendly.
- **Strengths:** Seamless interpolation between patterns with different topologies. Better ML generalization. Simple CNN architectures work well.
- **Gaps:** Representation innovation -- not a full system. Needs integration with upstream recognition and downstream printing.
- **Relevance:** Important infrastructure innovation. Could simplify the ML pipeline for pattern generation.

### 2.9 GarmageNet (SIGGRAPH Asia 2025)
- **Paper:** "A Multimodal Generative Framework for Sewing Pattern Design and Generic Garment Modeling"
- **URL:** https://arxiv.org/abs/2504.01483 | https://github.com/Style3D/garmagenet-impl
- **What it does:** Unified framework automating 2D sewing pattern creation, sewing relationship construction, and 3D garment initialization. Uses a novel "Garmage" representation and latent diffusion transformer.
- **Strengths:** Multi-modal input (text, sketches, photos). Handles sewing connections automatically. Large-scale dataset (14,801 professional garments). Pattern editing capabilities.
- **Gaps:** Professional garment dataset may not cover all home-sewing patterns. No direct body measurement integration.
- **Relevance:** State-of-the-art in multi-modal pattern generation. The Garmage representation is promising for bridging 2D patterns and 3D garments.

### 2.10 Inverse Garment Modeling with Differentiable Simulation (CGF 2024)
- **Paper:** "Inverse Garment and Pattern Modeling with a Differentiable Simulator"
- **URL:** https://arxiv.org/abs/2403.06841
- **What it does:** Given a 3D garment shape, recovers the 2D sewing pattern by iteratively optimizing pattern shape and physical parameters using a differentiable simulator.
- **Strengths:** Physics-based approach ensures patterns are physically realizable. High fidelity to target shape. Adaptable to different body shapes/poses.
- **Gaps:** Requires 3D input (not 2D photos). Iterative optimization is slow. Needs an accurate 3D reconstruction first.
- **Relevance:** Provides the physics-based refinement step that could follow an initial ML-based pattern estimate.

### 2.11 DMap: Diffusion Mapping via Pattern Coordinates (SIGGRAPH 2025)
- **Paper:** "Single View Garment Reconstruction Using Diffusion Mapping Via Pattern Coordinates"
- **URL:** https://arxiv.org/abs/2504.08353 | https://github.com/liren2515/DMap
- **What it does:** Uses diffusion models to map 2D image pixels to UV pattern coordinates and 3D geometry. Bridges ISP (Implicit Sewing Patterns) with generative diffusion for single-view garment reconstruction.
- **Strengths:** Handles both tight and loose garments. Generalizes from synthetic to real images. Enables garment retargeting and texture manipulation.
- **Gaps:** Trained on simulated data. Does not output traditional sewing pattern pieces directly.
- **Relevance:** Demonstrates implicit sewing patterns as a powerful intermediate representation.

### 2.12 NeuralTailor (ACM TOG 2022)
- **Paper:** "Reconstructing Sewing Pattern Structures from 3D Point Clouds of Garments"
- **URL:** https://arxiv.org/abs/2201.13063 | https://github.com/maria-korosteleva/Garment-Pattern-Estimation
- **What it does:** Reconstructs 2D garment sewing patterns from 3D point clouds using point-level attention. Foundational work in neural sewing pattern estimation.
- **Strengths:** Generalizes to novel garment topologies unseen during training. Open-source implementation.
- **Gaps:** Requires 3D point cloud input (not photos). Limited panel complexity.
- **Relevance:** Foundational architecture that later works (Panelformer, SewFormer) build upon.

---

## 3. Body Measurement from Photos

### 3.1 3DLOOK
- **URL:** https://3dlook.ai/
- **What it does:** AI-powered mobile body scanning from two smartphone photos (front + side view). Produces 80+ body measurements in <45 seconds with 96-97% accuracy.
- **Strengths:** Only two photos needed. Works with any smartphone. User stays clothed. Real-time pose validation (2024 update). 3.5% average weight prediction error.
- **Gaps:** Proprietary API -- not available for open integration. Focused on retail sizing, not sewing pattern generation.
- **Relevance:** **Critical enabling technology.** Solves the body measurement extraction problem. Would need API access or equivalent technology to bridge photos to pattern sizing.

### 3.2 TrueToForm
- **URL:** https://www.truetoform.fit/
- **What it does:** Smartphone-based 3D body scanning app that creates accurate 3D avatars with precise measurements. Validated in IRB-approved study with 300+ participants.
- **Strengths:** Specifically adopted by sewing communities for made-to-measure garments. Privacy-focused (no photos uploaded). Generates exportable measurements.
- **Gaps:** Requires app installation. Measurement accuracy depends on user compliance with scanning instructions.
- **Relevance:** **Directly relevant.** Already used by sewists for measurement extraction. Could serve as measurement input to a pattern generation pipeline.

### 3.3 Nettelo
- **URL:** https://nettelo.com/
- **What it does:** 3D body scan and analysis from a single full-body image. Creates 3D body model, extracts measurements, provides size recommendations.
- **Strengths:** Single image (quick mode). Offers body tracking over time. On-device processing for privacy.
- **Gaps:** Less accurate than two-photo methods. Limited sewing-specific measurement set.
- **Relevance:** Demonstrates single-image body measurement is viable, though with accuracy tradeoffs.

### 3.4 Amazon "Made for You" (Body Labs acquisition)
- **What it does:** Amazon's custom T-shirt service using smartphone-based 3D body scanning. Users enter height, weight, body style, and upload two photos. Creates a virtual body double for visualization.
- **Strengths:** Backed by Body Labs acquisition (3D body modeling expertise). Virtual try-on visualization. Mass-market consumer experience.
- **Gaps:** Limited to T-shirts. Proprietary, not available as an API. Service scope is narrow.
- **Relevance:** Validates that major tech companies see value in photo-to-body-measurement-to-custom-garment pipelines.

### 3.5 SMPL Body Model Ecosystem
- **URL:** https://smpl.is.tue.mpg.de/
- **What it does:** Skinned Multi-Person Linear model -- the dominant parametric body model in research. Represents body shape and pose in a compact parameter space. Extensive ecosystem of estimation methods (HMR, SPIN, PARE, SMPLify-X, etc.).
- **Strengths:** Standard representation across hundreds of papers. Can be estimated from single images. Parameters directly encode body shape (measurements can be extracted). Active development (SMPL-X with hands/face, SMPLest-X for scaling).
- **Gaps:** Academic tool -- extracting traditional tailoring measurements from SMPL parameters requires additional mapping. Accuracy varies by estimation method and image quality.
- **Relevance:** **Foundational technology.** SMPL estimation from photos is the most mature approach to body measurement. The shape parameters (beta) encode body dimensions that can be mapped to sewing measurements.

---

## 4. Garment Segmentation

### 4.1 Clothing Semantic Segmentation
- **Key models:** SegFormer (segformer_b2_clothes on HuggingFace), Mask R-CNN variants, U-Net architectures, ClothSeg
- **What they do:** Segment clothed human images into garment categories (shirt, pants, skirt, etc.) and sub-regions (collar, sleeve, pocket, etc.).
- **Strengths:** Mature technology. Pre-trained models readily available. Can identify garment type, boundaries, and sub-components.
- **Gaps:** Semantic segmentation identifies *what* is present, not the 3D structure or pattern piece layout. Cannot decompose a visible garment into its constituent flat pattern pieces.
- **Relevance:** Essential first step in any photo-to-pattern pipeline. Identifies which garments are present and their boundaries. But does not solve the inverse problem of going from 2D appearance to flat pattern pieces.

### 4.2 Fashion Parsing / Landmark Detection
- **Key datasets:** DeepFashion, DeepFashion2, ModaNet, Fashionpedia
- **What they do:** Fine-grained garment attribute recognition, landmark detection, and parsing.
- **Strengths:** Rich attribute vocabularies (sleeve length, neckline type, closure type, etc.). Large-scale datasets available.
- **Gaps:** Attributes are descriptive, not constructive -- they describe *what* a garment looks like, not *how* to construct it.
- **Relevance:** Attribute extraction can parameterize garment style choices (e.g., "V-neck, long sleeve, A-line silhouette") which can then drive parametric pattern generation.

---

## 5. Open Source Projects

### 5.1 FreeSewing
- **URL:** https://freesewing.org/ | https://github.com/freesewing
- **What it does:** Open-source JavaScript library and platform for parametric sewing patterns. Users enter measurements, select a design, and get a bespoke pattern.
- **Strengths:** Mature ecosystem. Dozens of designs. Fully parametric -- adapts to any body measurements. Active community. Well-documented API.
- **Gaps:** No photo input. Requires manual measurement entry. Design selection is manual. Limited to pre-coded designs.
- **Relevance:** **Key integration target.** FreeSewing's parametric engine could serve as the pattern generation backend. If photo analysis identifies (a) body measurements and (b) garment style parameters, FreeSewing could generate the actual printable pattern.

### 5.2 Seamly2D
- **URL:** https://seamly.io/ | https://github.com/FashionFreedom/Seamly2D
- **What it does:** Open-source parametric pattern drafting software (desktop). Implements traditional pattern drafting methods with measurements as input parameters.
- **Strengths:** Cross-platform (Windows, Mac, Linux). GPLv3+ license. Implements established drafting systems. Outputs industry-standard formats.
- **Gaps:** Desktop application, not a library/API. Manual drafting process. No photo input or AI features.
- **Relevance:** Validates the parametric approach. Its drafting algorithms encode decades of tailoring knowledge that could be extracted/referenced.

### 5.3 Valentina
- **URL:** https://smart-pattern.com.ua/en/ | https://gitlab.com/smart-pattern/valentina
- **What it does:** Open-source parametric pattern design software. Patterns rearrange automatically when measurements change.
- **Strengths:** Full parametric capability. Cross-platform. Active development since 2013.
- **Gaps:** Desktop application. No automation or AI. Steep learning curve for non-technical users.
- **Relevance:** Another parametric pattern engine that could theoretically be driven by automated measurement + style inputs.

### 5.4 JBlockCreator
- **Paper:** https://www.sciencedirect.com/science/article/pii/S2352711018302528
- **What it does:** Open-source framework for automatic drafting of custom pattern blocks (trousers, skirts, bodices, sleeves). Can connect to body scanners and plotters.
- **Strengths:** API-oriented design. Implements standard drafting methods. ASTM/AAMA-DXF output. Designed for automation.
- **Gaps:** Limited garment types (basic blocks only). Java-based. Less active development.
- **Relevance:** Demonstrates the automation pipeline concept (body scanner -> pattern drafting -> plotter output).

### 5.5 GarmentCode
- **URL:** https://github.com/maria-korosteleva/GarmentCode
- **What it does:** Programming framework for designing parametric sewing patterns using object-oriented principles. Includes GarmentCodeData dataset (115K data points).
- **Strengths:** First DSL for garment modeling. Component-oriented design. Auto-generates made-to-measure patterns. Includes body measurement integration. Large dataset. XPBD simulation pipeline.
- **Gaps:** Requires programming to use. Not consumer-facing.
- **Relevance:** **Highly relevant infrastructure.** Used by ChatGarment (CVPR 2025) as the pattern generation backend. The parametric model + dataset combination is the most complete open-source foundation.

### 5.6 SewingPatternMaker / BobbinLab
- **URL:** https://github.com/SarahPappas/SewingPatternMaker
- **What it does:** Web app that generates a basic sewing pattern from a photo of a garment laid flat on a surface.
- **Strengths:** Directly addresses photo-to-pattern. Simple user workflow.
- **Gaps:** Requires garment to be laid flat (not worn). Basic pattern output. Limited garment types.
- **Relevance:** Proof of concept for the simplest version of photo-to-pattern (flat garment photos).

### 5.7 Patternfy
- **URL:** https://github.com/caretdashcaret/Patternfy
- **What it does:** Turns 3D models (from video games) into sewing patterns for stuffed animals, preserving shape and coloration.
- **Strengths:** Novel approach to 3D-to-pattern conversion. Procedural pattern generation.
- **Gaps:** Designed for stuffed animals from game models, not garments from photos.
- **Relevance:** Demonstrates automated 3D-to-flat-pattern conversion, albeit in a different domain.

---

## 6. AI/ML Approaches

### 6.1 Transformer-Based Pattern Prediction
- **Key works:** SewFormer, Panelformer
- **Approach:** Treat sewing pattern reconstruction as a set prediction problem. Use vision transformers to encode images and decode panel shapes + stitch connections.
- **Strengths:** End-to-end trainable. Can handle variable numbers of panels.
- **Gaps:** Limited by training data diversity. Struggle with complex patterns.

### 6.2 Autoregressive / GPT-Based Generation
- **Key works:** DressCode/SewingGPT
- **Approach:** Quantize sewing patterns into token sequences and use GPT-style models for autoregressive generation.
- **Strengths:** Flexible generation. Natural language conditioning.
- **Gaps:** Slow generation (sequential token prediction). Quantization limits precision.

### 6.3 Diffusion Models
- **Key works:** GarmentDiffusion, DMap, Dress-1-to-3
- **Approach:** Use denoising diffusion models to generate sewing patterns or garment geometry. Can condition on multiple modalities.
- **Strengths:** High-quality outputs. Multi-modal conditioning. Fast inference possible with modern architectures.
- **Gaps:** Require large training datasets. Controlling output precision is challenging.

### 6.4 Vision-Language Models (VLMs)
- **Key works:** ChatGarment, DressWild
- **Approach:** Fine-tune VLMs to understand garment images and output structured garment descriptions (JSON parameters, text descriptions) that drive parametric pattern models.
- **Strengths:** Leverage massive pre-trained knowledge. Natural interaction. Handle in-the-wild images.
- **Gaps:** Output quality depends on downstream parametric model coverage. Fine-tuning requires curated datasets.

### 6.5 Differentiable Physics Simulation
- **Key works:** Inverse Garment Modeling (2024), Dress-1-to-3
- **Approach:** Use differentiable cloth simulators to refine pattern shapes by optimizing for match between simulated drape and target appearance.
- **Strengths:** Physically plausible results. Can refine ML-based initial estimates.
- **Gaps:** Computationally expensive. Requires good initialization. Simulation fidelity depends on material parameters.

### 6.6 Raster-Based Pattern Representations
- **Key works:** GarmentImage (SIGGRAPH 2025)
- **Approach:** Encode sewing patterns as multi-channel images rather than variable-length vector sequences.
- **Strengths:** Enables standard CNN/diffusion architectures. Smooth interpolation across topologies.
- **Gaps:** Resolution-limited. Lossy encoding of fine details.

---

## 7. Gap Analysis & Synthesis

### The End-to-End Vision: Photo -> Body Dimensions + Outfit Silhouette -> Printable Pattern Pieces

No existing system fully achieves this end-to-end pipeline. Here is where each component stands:

### What Exists Today

| Pipeline Stage | Maturity | Key Solutions |
|---|---|---|
| Body measurement from photos | **High** | 3DLOOK (96-97% accuracy), TrueToForm, SMPL estimation |
| Garment type/style recognition | **High** | Segmentation models, fashion attribute classifiers |
| Garment pattern estimation from images | **Medium** | SewFormer, Panelformer, DressWild, ChatGarment |
| Parametric pattern generation from measurements | **High** | FreeSewing, GarmentCode, Sewist, Tailornova |
| Multi-modal pattern generation (text/image/sketch) | **Medium** | GarmentDiffusion, GarmageNet, ChatGarment |
| Physics-based pattern refinement | **Medium** | Differentiable simulators, Dress-1-to-3 |
| Printable PDF pattern output | **High** | FreeSewing, Seamly2D, Sewist CAD |

### Critical Gaps

1. **No unified photo-to-printable-pattern pipeline exists.** Each component works in isolation. The integration challenge -- connecting body measurement, garment recognition, pattern generation, and printable output -- remains unsolved.

2. **Body measurement + pattern sizing integration is missing.** Academic pattern estimation work (SewFormer, Panelformer, etc.) reconstructs pattern *shapes* but does not produce *sized* patterns for a specific body. They estimate what the garment looks like, not what pattern you'd need to sew it for *your* body.

3. **Real-world photo robustness is limited.** Most ML approaches train on synthetic data (SewFactory, GarmentCodeData) and struggle with in-the-wild photos. DressWild (Feb 2026) specifically targets this gap but is very new.

4. **Seam allowances, grain lines, and construction details are absent.** Academic models output geometric panel shapes but omit the practical details needed for actual sewing: seam allowances, notch marks, grain line indicators, dart markings, and assembly instructions.

5. **Fabric/material considerations are ignored.** Pattern sizing depends on fabric stretch, drape, and weight. No current system accounts for this in pattern generation.

6. **The "last mile" to printable patterns is underserved.** Converting ML-estimated pattern panels into properly formatted, tiled PDF patterns with registration marks, seam allowances, and cutting instructions requires significant post-processing that no research system addresses.

### Proposed Architecture (Based on Prior Art)

Based on this research, the most promising architecture would combine:

1. **SMPL body estimation** (from 2 smartphone photos) -> body measurements
2. **VLM-based garment analysis** (ChatGarment-style) -> garment type + style parameters (JSON)
3. **Parametric pattern generation** (FreeSewing/GarmentCode) -> base pattern sized to measurements
4. **Optional: ML-based pattern refinement** (SewFormer/GarmentDiffusion style) -> adjust pattern to match specific garment details
5. **Pattern post-processing** -> add seam allowances, grain lines, notches, tiling for PDF output

This approach leverages the strengths of each component while avoiding the weakest links (e.g., end-to-end ML pattern generation that is not yet production-quality).

---

## Sources

### Commercial Products
- [Tailornova](https://tailornova.com/)
- [CLO3D](https://www.clo3d.com/)
- [Browzwear](https://browzwear.com/)
- [fashionINSTA](https://fashioninsta.ai/)
- [Sewist CAD](https://www.sewist.com/)
- [DartSide](https://apps.apple.com/us/app/dartside-pattern-drafting/id6468904118)

### Academic Papers
- [SewFormer - ACM TOG 2023](https://arxiv.org/abs/2311.04218)
- [Panelformer - WACV 2024](https://github.com/ericsujw/Panelformer)
- [GarmentDiffusion - IJCAI 2025](https://arxiv.org/abs/2504.21476)
- [DressCode/SewingGPT - SIGGRAPH 2024](https://arxiv.org/abs/2401.16465)
- [ChatGarment - CVPR 2025](https://chatgarment.github.io/)
- [DressWild - arXiv 2026](https://arxiv.org/abs/2602.16502)
- [Dress-1-to-3 - ACM TOG 2025](https://arxiv.org/abs/2502.03449)
- [GarmentImage - SIGGRAPH 2025](https://arxiv.org/abs/2505.02592)
- [GarmageNet - SIGGRAPH Asia 2025](https://arxiv.org/abs/2504.01483)
- [Inverse Garment Modeling - CGF 2024](https://arxiv.org/abs/2403.06841)
- [DMap - SIGGRAPH 2025](https://arxiv.org/abs/2504.08353)
- [NeuralTailor - ACM TOG 2022](https://arxiv.org/abs/2201.13063)
- [Deep Learning for 3D Garment Generation: A Review (2025)](https://journals.sagepub.com/doi/10.1177/00405175251335188)

### Body Measurement Technology
- [3DLOOK](https://3dlook.ai/)
- [TrueToForm](https://www.truetoform.fit/)
- [Nettelo](https://nettelo.com/)
- [SMPL Body Model](https://smpl.is.tue.mpg.de/)

### Open Source Projects
- [FreeSewing](https://freesewing.org/)
- [Seamly2D](https://github.com/FashionFreedom/Seamly2D)
- [Valentina](https://gitlab.com/smart-pattern/valentina)
- [GarmentCode](https://github.com/maria-korosteleva/GarmentCode)
- [JBlockCreator](https://www.sciencedirect.com/science/article/pii/S2352711018302528)
- [SewingPatternMaker](https://github.com/SarahPappas/SewingPatternMaker)
- [Awesome 3D Garments](https://github.com/Shanthika/Awesome-3D-Garments)
- [GarmageNet Implementation](https://github.com/Style3D/garmagenet-impl)

### Curated Resource Lists
- [Awesome 3D Garments](https://github.com/Shanthika/Awesome-3D-Garments)
- [Awesome Virtual Try-On](https://github.com/minar09/awesome-virtual-try-on)
