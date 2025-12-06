import { useTexture } from '@react-three/drei';
import { RepeatWrapping } from 'three';

// Define the texture URLs constant
const TEXTURE_URLS = {
  concrete: {
    map: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/concrete_wall_008/concrete_wall_008_diff_1k.jpg',
    normalMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/concrete_wall_008/concrete_wall_008_nor_gl_1k.jpg',
    roughnessMap: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/concrete_wall_008/concrete_wall_008_rough_1k.jpg',
  },
  grass: {
    map: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/grass_path_2/grass_path_2_diff_1k.jpg',
    // We can use just diffuse for ground to keep it simple, or add others if needed
  }
};

export function useArchitecturalMaterials() {
  // Load textures using standard useTexture
  const concreteTextures = useTexture(TEXTURE_URLS.concrete);
  const grassTexture = useTexture(TEXTURE_URLS.grass);

  // Configure Concrete Textures
  // Iterate over loaded textures to set wrapping
  Object.values(concreteTextures).forEach((t) => {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(2, 2); // Scale texture density
  });

  // Configure Grass Textures
  Object.values(grassTexture).forEach((t) => {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(20, 20); // Large ground plane
  });

  return {
    concrete: concreteTextures,
    grass: grassTexture
  };
}
