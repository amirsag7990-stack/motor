// InputSystem.js — unified input for desktop (keyboard) and mobile
// (on-screen virtual joystick + action button). This matters a lot once
// you package the game as an APK, since there's no keyboard on a phone.
export class InputSystem {
    constructor() {
        // Final combined state, recomputed every frame in update() — read this from game logic.
        this.up = false; this.down = false; this.left = false; this.right = false;
        this.action = false; // "interact" / "use tool" button

        // Touch-only state, set by the virtual joystick drag handlers below.
        this._touch = { up: false, down: false, left: false, right: false };
        this._actionJustPressed = false;
    }

    init(engine) {
        this.engine = engine;
        const scene = engine.scene;

        // --- Keyboard (desktop) ---
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keyW = scene.input.keyboard.addKey('W');
        this.keyA = scene.input.keyboard.addKey('A');
        this.keyS = scene.input.keyboard.addKey('S');
        this.keyD = scene.input.keyboard.addKey('D');
        this.keyE = scene.input.keyboard.addKey('E');

        // --- Touch (mobile) ---
        this._buildTouchControls(scene);
    }

    _buildTouchControls(scene) {
        // Virtual joystick: a base + thumb drawn with Phaser graphics, fixed
        // to the camera (scrollFactor 0) so it stays on screen while the
        // world scrolls.
        const baseX = 120, baseY = scene.scale.height - 120, radius = 60;

        this.joystickBase = scene.add.circle(baseX, baseY, radius, 0x000000, 0.25)
            .setScrollFactor(0).setDepth(1000).setInteractive();
        this.joystickThumb = scene.add.circle(baseX, baseY, 28, 0xffffff, 0.5)
            .setScrollFactor(0).setDepth(1001);

        this.actionButton = scene.add.circle(scene.scale.width - 100, scene.scale.height - 120, 45, 0xffcc00, 0.6)
            .setScrollFactor(0).setDepth(1000).setInteractive();
        scene.add.text(scene.scale.width - 118, scene.scale.height - 134, 'USE', { fontSize: '16px', color: '#000' })
            .setScrollFactor(0).setDepth(1001);

        let dragging = false;
        this.joystickBase.on('pointerdown', (p) => { dragging = true; this._updateJoystick(p, baseX, baseY, radius); });
        scene.input.on('pointermove', (p) => { if (dragging) this._updateJoystick(p, baseX, baseY, radius); });
        scene.input.on('pointerup', () => {
            dragging = false;
            this._touch.up = this._touch.down = this._touch.left = this._touch.right = false;
            this.joystickThumb.setPosition(baseX, baseY);
        });

        this.actionButton.on('pointerdown', () => { this.action = true; this._actionJustPressed = true; });
        this.actionButton.on('pointerup', () => { this.action = false; });
    }

    _updateJoystick(pointer, baseX, baseY, radius) {
        const dx = pointer.x - baseX, dy = pointer.y - baseY;
        const dist = Math.min(Math.sqrt(dx * dx + dy * dy), radius);
        const angle = Math.atan2(dy, dx);
        this.joystickThumb.setPosition(baseX + Math.cos(angle) * dist, baseY + Math.sin(angle) * dist);

        const deadzone = 0.3;
        const nx = dist / radius; // 0..1
        this._touch.right = nx > deadzone && Math.cos(angle) > 0.3;
        this._touch.left  = nx > deadzone && Math.cos(angle) < -0.3;
        this._touch.down  = nx > deadzone && Math.sin(angle) > 0.3;
        this._touch.up    = nx > deadzone && Math.sin(angle) < -0.3;
    }

    /** Call once per frame (e.g. from the scene's update()) before reading movement flags */
    update() {
        this.left  = this.cursors.left.isDown  || this.keyA.isDown || this._touch.left;
        this.right = this.cursors.right.isDown || this.keyD.isDown || this._touch.right;
        this.up    = this.cursors.up.isDown    || this.keyW.isDown || this._touch.up;
        this.down  = this.cursors.down.isDown  || this.keyS.isDown || this._touch.down;
        if (Phaser.Input.Keyboard.JustDown(this.keyE)) this._actionJustPressed = true;
    }

    /** Call once per frame from game logic; clears the "just pressed" edge trigger */
    consumeActionPress() {
        const v = this._actionJustPressed;
        this._actionJustPressed = false;
        return v;
    }
}
