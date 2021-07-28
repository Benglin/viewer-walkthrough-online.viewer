import { StreamLineVert, StreamLineFrag } from "/StreamLineShaders.js";

function StreamLineMaterial(parameters) {
    function check(v, d) {
        return v === undefined ? d : v;
    }

    THREE.Material.call(this);

    parameters = parameters || {};
    parameters = Object.assign(parameters, {
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,
    });

    this.color = check(parameters.color, new THREE.Color(0xffffff));

    const vertexShader = StreamLineVert;
    const fragmentShader = StreamLineFrag;

    const material = new THREE.RawShaderMaterial({
        uniforms: {
            lineWidth: { type: "f", value: 6.0 },
            color: { type: "c", value: this.color },
            opacity: { type: "f", value: 1.0 },
            resolution: { type: "v2", value: new THREE.Vector2(1680, 1330) },
            sizeAttenuation: { type: "f", value: 0.0 },
        },
        attributes: {
            position: { type: "v3", value: new THREE.Vector3() },
            prev: { type: "v3", value: new THREE.Vector3() },
            next: { type: "v3", value: new THREE.Vector3() },
            side: { type: "f", value: 0.0 },
            width: { type: "f", value: 0.0 },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    });

    material.type = "StreamLineMaterial";
    delete parameters.color;
    material.setValues(parameters);
    return material;
}

StreamLineMaterial.prototype = Object.create(THREE.Material.prototype);
StreamLineMaterial.prototype.constructor = StreamLineMaterial;

StreamLineMaterial.prototype.copy = function (source) {
    THREE.Material.prototype.copy.call(this, source);
    return this;
};

export { StreamLineMaterial };
