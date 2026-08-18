declare module "vanta/dist/vanta.birds.min" {
  const BIRDS: (options: Record<string, unknown>) => {
    destroy: () => void;
    setOptions: (options: Record<string, unknown>) => void;
  };
  export default BIRDS;
}
