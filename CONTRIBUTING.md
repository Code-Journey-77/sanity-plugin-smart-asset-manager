# Contributing to Sanity Plugin Smart Asset Manager

Thank you for your interest in contributing! We welcome all contributions, from fixing a bug to adding a new feature.

## 🛠 Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A local [Sanity Studio](https://www.sanity.io/studio) to test the plugin.

## 🚀 Getting Started

1. **Fork and Clone** the repository:

   ```bash
   git clone https://github.com/Code-Journey-77/sanity-plugin-smart-asset-manager.git
   cd sanity-plugin-smart-asset-manager
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Running the Plugin Locally**:
   You can link the plugin to a local Sanity Studio instance to test it.

   ```bash
   # In the plugin directory
   npm link

   # In your Sanity Studio directory
   npm link sanity-plugin-smart-asset-manager
   ```

4. **Building for Production**:
   ```bash
   npm run build
   ```
   This will generate `dist/` containing ESM and CommonJS builds.

## 📜 Coding Guidelines

- **Prettier**: We use Prettier for code formatting. Run `npm run format` before committing.
- **TypeScript**: All new code should be written in TypeScript.
- **Components**: Use [Sanity UI](https://www.sanity.io/ui) components whenever possible for a native look and feel.

## 🐛 Bug Reports

If you've found a bug, please open an issue and include:

- A clear description of the problem.
- Steps to reproduce it.
- Your OS and Sanity Studio version.

## 💡 Feature Requests

We're always looking for ways to make the Asset Manager better! If you have a feature idea, feel free to open an issue or submit a pull request.

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
