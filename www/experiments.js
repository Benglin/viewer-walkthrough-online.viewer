import { StreamLine } from "/StreamLine.js";
import { StreamLineMaterial } from "/StreamLineMaterial.js";

async function addMeshToViewer(mesh, viewer) {
    const sceneBuilder = await viewer.loadExtension("Autodesk.Viewing.SceneBuilder");
    const modelBuilder = await sceneBuilder.addNewModel({
        modelNameOverride: "My Custom Model",
        conserveMemory: false,
    });

    modelBuilder.addMesh(mesh);
}

async function addMeshToScene(mesh, viewer) {
    const overlayName = "StreamLineOverlay";
    viewer.impl.createOverlayScene(overlayName);

    let scene = new THREE.Scene();
    scene.add(mesh);
    viewer.impl.addOverlay(overlayName, scene);
}

window.createStreamLines = async function (viewer) {
    const line = new StreamLine();
    line.setPoints(
        new Float32Array([
            0.0, 0.0, 0.0, -10.0, 10.0, 10.0, 20.0, -20.0, 20.0, -11.0, 11.0, 11.0, 21.0, -21.0,
            21.0, 30.0, 30.0, 30.0,
        ])
    );

    const material = new StreamLineMaterial({
        color: new THREE.Color(0xffe066),
    });

    line.geometry.visible = true;
    const mesh = new THREE.Mesh(line.geometry, material);
    await addMeshToScene(mesh, viewer);

    setTimeout(() => viewer.impl.invalidate(true, true, true), 16);
};

window.createStreamLinesz = async function (viewer) {
    const theGeometry = new THREE.BufferGeometry().fromGeometry(
        new THREE.BoxGeometry(32.0, 32.0, 32.0, 8.0, 8.0, 8.0)
    );

    const theMaterial = new THREE.MeshPhongMaterial({ color: new THREE.Color(1.0, 0.5, 0) });
    const mesh = new THREE.Mesh(theGeometry, theMaterial);
    addMeshToScene(mesh, viewer);
};
