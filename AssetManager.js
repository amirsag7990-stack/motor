// AssetManager.js — load textures at runtime, including images the USER
// uploads from their device (no rebuild needed). This is what makes
// "می‌خوام عکس آپلود کنم" possible.
export class AssetManager {
    constructor() {
        this.engine = null;
        this.loaded = new Set();
    }

    init(engine) {
        this.engine = engine;
    }

    /**
     * Load an image from a File object (e.g. from an <input type="file">)
     * and register it as a Phaser texture, usable immediately by any sprite.
     * @param {File} file
     * @param {string} key - texture key to use later, e.g. scene.add.sprite(x, y, key)
     */
    uploadImageFile(file, key) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject(new Error('Selected file is not an image'));
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    const scene = this.engine.scene;
                    if (scene.textures.exists(key)) scene.textures.remove(key);
                    scene.textures.addImage(key, img);
                    this.loaded.add(key);
                    this.engine.bus.emit('asset:loaded', { key, source: 'upload' });
                    resolve(key);
                };
                img.onerror = () => reject(new Error('Could not decode image'));
                img.src = reader.result;
            };
            reader.onerror = () => reject(new Error('Could not read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Load an image from a URL at runtime (e.g. from a mod pack, CDN, or
     * a level shared by another player).
     */
    loadImageFromURL(url, key) {
        return new Promise((resolve, reject) => {
            const scene = this.engine.scene;
            scene.load.image(key, url);
            scene.load.once(`filecomplete-image-${key}`, () => {
                this.loaded.add(key);
                this.engine.bus.emit('asset:loaded', { key, source: 'url' });
                resolve(key);
            });
            scene.load.once('loaderror', (file) => {
                if (file.key === key) reject(new Error(`Failed to load ${url}`));
            });
            scene.load.start();
        });
    }

    has(key) { return this.loaded.has(key); }
}

/**
 * Wires up a hidden <input type="file"> so any UI button can trigger it.
 * Call once, e.g. in main.js: setupImageUploadUI(engine, document.getElementById('uploadBtn'))
 */
export function setupImageUploadUI(engine, triggerButtonEl) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        const key = `upload_${Date.now()}`;
        try {
            await engine.getSystem('assets').uploadImageFile(file, key);
            console.log(`Image uploaded as texture key: ${key}`);
        } catch (err) {
            console.error('Upload failed:', err);
        }
        input.value = '';
    });

    triggerButtonEl?.addEventListener('click', () => input.click());
    return input;
}
