# 📜 Change Log

All notable changes to the **Sanity Plugin Smart Asset Manager** will be documented in this file.

## [1.0.0] - 2026-03-01

### 🚀 Features

- **All Assets Tab**: A comprehensive dashboard to view and manage all images, videos, and files.
- **Size Analyzer**: Identify which assets are taking up the most space with weight-based sorting and dimensional data.
- **Unused Assets Tab**: Automatically detect files not referenced by any document in Sanity Studio.
- **Bulk Cleanup**: Support for multi-select deletion of unused assets with checkboxes.
- **Asset Usage Scan**: Click any asset to see which documents are referencing it.
- **Batch Uploads**: Upload up to 5 files at a time with smart progress feedback.
- **Duplicate Prevention**: Automatic filename checking during upload to prevent redundant assets.
- **Interactive Previews**: Autoplaying video previews, audio icons, and high-quality image thumbnails.

### 🛠 Improvements

- **UI/UX Refinement**: Built using Sanity UI for a native Studio appearance and premium feel.
- **Loading States**: Integrated spinners and progress toasts for all long-running operations.
- **Performance**: Optimized asset fetching with pagination and smart-refresh logic.
- **Build System**: Switched to `tsup` for faster ESM and CommonJS builds.

### 🧹 Cleanup

- Removed legacy broken link checking and unused code items.
- Streamlined component props and styled-components for better maintainability.

---

## [Initial Release] - 2026-02-28

- Project started with core asset management capabilities.
