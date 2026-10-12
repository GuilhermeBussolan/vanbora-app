// Configuração dinâmica por cima do app.json. Só muda algo no build de demonstração do
// portfólio (`npm run build:demo`), servido no subcaminho /demos/vanbora.
module.exports = ({ config }) =>
  process.env.EXPO_PUBLIC_DEMO === '1'
    ? { ...config, experiments: { ...config.experiments, baseUrl: '/demos/vanbora' } }
    : config;
