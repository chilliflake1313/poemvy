const canvas = document.getElementById("bg");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setClearColor(0x445a63, 1);

function createCircleTexture() {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");

    const gradient = ctx.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, size / 2
    );

    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.5)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    return new THREE.CanvasTexture(canvas);
}

const snowTexture = createCircleTexture();

function createLayer(count, size, speed, spread, fadeOnScreen = false) {
    const positions = new Float32Array(count * 3);
    const opacities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * spread;
        positions[i * 3 + 1] = Math.random() * spread;
        positions[i * 3 + 2] = (Math.random() - 0.5) * spread;

        opacities[i] = 1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("opacity", new THREE.BufferAttribute(opacities, 1));

    const material = new THREE.PointsMaterial({
        map: snowTexture,
        size: size,
        transparent: true,
        depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    return { points, count, speed, spread, fadeOnScreen };
}

const back = createLayer(1000, 0.03, 0.001, 30);
const mid = createLayer(700, 0.06, 0.002, 25);

function animateLayer(layer) {
    const positions = layer.points.geometry.attributes.position.array;
    const opacities = layer.points.geometry.attributes.opacity?.array;

    for (let i = 0; i < layer.count; i++) {

        positions[i * 3 + 1] -= layer.speed;

        if (layer.fadeOnScreen) {
            if (positions[i * 3 + 1] < -1) {
                if (opacities[i] > 0) {
                    opacities[i] -= 0.03;
                } else {
                    positions[i * 3 + 1] = layer.spread / 2;
                    opacities[i] = 1;
                }
            }
        } else {
            if (positions[i * 3 + 1] < -layer.spread / 2) {
                positions[i * 3 + 1] = layer.spread / 2;
            }
        }
    }

    layer.points.geometry.attributes.position.needsUpdate = true;
    if (layer.fadeOnScreen) {
        layer.points.geometry.attributes.opacity.needsUpdate = true;
    }
}

function animate() {
    requestAnimationFrame(animate);

    animateLayer(back);
    animateLayer(mid);

    renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
