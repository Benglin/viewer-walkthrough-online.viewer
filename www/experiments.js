import { StreamLine } from "/StreamLine.js";
import { StreamLineMaterial } from "/StreamLineMaterial.js";

function addMeshToScene(mesh, viewer) {
    const overlayName = "StreamLineOverlay";
    viewer.impl.createOverlayScene(overlayName);
    viewer.impl.addOverlay(overlayName, mesh);
}

window.createStreamLines = async function (viewer) {
    const sphereRadius = 45.0;
    const horzSegments = 72 | 0;
    const vertSegments = 72 | 0;
    const totalSegments = horzSegments * vertSegments;

    const coords = [];
    for (let s = 0; s < totalSegments; s++) {
        const b = (s / totalSegments) * Math.PI;
        const radius = sphereRadius * Math.sin(b);

        const z = sphereRadius * Math.cos(b);
        const f = s / (horzSegments * 1.0);
        const angle = (f - Math.floor(f)) * 2.0 * Math.PI;
        coords.push(radius * Math.sin(angle), radius * Math.cos(angle), -z);
    }

    const line = new StreamLine();
    line.setPoints(new Float32Array(coords));

    const material = new StreamLineMaterial({
        color: new THREE.Color(0x00ff40),
    });

    line.geometry.visible = true;
    const mesh = new THREE.Mesh(line.geometry, material);
    addMeshToScene(mesh, viewer);

    setTimeout(() => viewer.impl.invalidate(true, true, true), 16);
};
