// DialoguePlugin.js — EXAMPLE plugin showing a UI overlay driven by events.
// Any other system/plugin can trigger a dialogue by emitting 'dialogue:show'.
export function DialoguePlugin(engine) {
    const scene = engine.scene;
    const W = scene.scale.width;

    const box = scene.add.rectangle(W / 2, scene.scale.height - 90, W - 40, 120, 0x000000, 0.75)
        .setScrollFactor(0).setDepth(2000).setVisible(false);
    const text = scene.add.text(30, scene.scale.height - 140, '', {
        fontSize: '18px', color: '#ffffff', wordWrap: { width: W - 80 },
    }).setScrollFactor(0).setDepth(2001).setVisible(false);

    let queue = [];
    let active = false;

    function showNext() {
        if (queue.length === 0) { active = false; box.setVisible(false); text.setVisible(false); return; }
        active = true;
        const line = queue.shift();
        box.setVisible(true);
        text.setVisible(true);
        text.setText(line);
    }

    return {
        name: 'dialogue',
        init(engine) {
            engine.bus.on('dialogue:show', ({ lines }) => {
                queue = Array.isArray(lines) ? [...lines] : [lines];
                showNext();
            });
            // Tap the dialogue box (or press E again) to advance
            box.setInteractive().on('pointerdown', showNext);
            engine.bus.on('player:action', () => { if (active) showNext(); });
        },
        isActive: () => active,
    };
}
