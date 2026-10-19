# Contributing to clh.lol

We welcome contributions! Follow these steps to get your changes merged.

## 1. Fork the repository
Click the **Fork** button on GitHub to create your own copy of the repo.

## 2. Clone your fork
```bash
git clone https://github.com/<your-username>/Website-React.git
cd Website-React
```

## 3. Create a new branch
```bash
git checkout -b <feature-or-bugfix-name>
```
Use a descriptive name, e.g., `fix-mobile-hook` or `add-new-project-card`.

## 4. Install dependencies
```bash
npm install
```

## 5. Make your changes
- Keep the **React functional component** style (hooks at top level).
- Follow the existing code style: TypeScript, Tailwind utility classes, and `framer‑motion` for animations.
- Run the dev server (`npm run dev`) and visually verify your changes.
- Run `npm run check` before submitting a change.
- Run `npm run test:e2e` for navigation, layout, service-worker, or accessibility changes.

## 6. Lint
Run the repository's ESLint configuration:
```bash
npm run lint
```

## 7. Commit your changes
```bash
git add .
git commit -m "<short description>"
```
Use a concise commit message and reference the related issue if applicable.

## 8. Push and open a PR
```bash
git push origin <branch-name>
```
Then, on GitHub, open a Pull Request against the `main` branch of the original repository.

## 9. Review process
- A maintainer will review your PR.
- Address any requested changes.
- Once approved, the PR will be merged.

### Code of Conduct
We expect all contributors to be respectful and inclusive. Harassment or discriminatory language is not tolerated.

---

**Thank you for helping improve clh.lol!**
