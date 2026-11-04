# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Production

Run `npm run build` to generate the production bundle in `dist/`. Vite minifies JavaScript by default for production builds. Additional obfuscation is optional and does not protect secrets or replace server-side authorization and validation; do not put private keys or tokens in the frontend bundle.

The client-side masks and validations improve data entry, but the backend remains responsible for validating and normalizing submitted data. Disabling browser shortcuts or the context menu is intentionally avoided: it is easy to bypass and harms accessibility and support workflows.

The subscription checkout is currently a demonstration only. Selecting “Simular pagamento aprovado” records an in-memory confirmation for the selected plan and unlocks company registration; it does not contact a payment provider or charge the customer.

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
