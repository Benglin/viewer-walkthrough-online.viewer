import { StreamLineVert, StreamLineFrag } from "/StreamLineShaders.js";

class StreamLineMaterialEx extends THREE.RawShaderMaterial {
    constructor(parameters) {
        const uniforms = Object.assign({}, THREE.UniformsLib.fog, {
            lineWidth: { type: "f", value: 1 },
            map: { type: "t", value: null },
            useMap: { type: "f", value: 0 },
            alphaMap: { type: "t", value: null },
            useAlphaMap: { type: "f", value: 0 },
            color: { type: "v3", value: new THREE.Color(0xffffff) },
            opacity: { type: "f", value: 1 },
            resolution: { type: "v2", value: new THREE.Vector2(1, 1) },
            sizeAttenuation: { type: "f", value: 1 },
            dashArray: { type: "f", value: 0 },
            dashOffset: { type: "f", value: 0 },
            dashRatio: { type: "f", value: 0.5 },
            useDash: { type: "f", value: 0 },
            visibility: { type: "f", value: 1 },
            alphaTest: { type: "f", value: 0 },
            repeat: { type: "v2", value: new THREE.Vector2(1, 1) },
        });

        Object.entries(parameters).forEach(([key, value]) => {
            const currentValue = uniforms[key];
            if (currentValue) currentValue.value = value;
        });

        const vertexShader = StreamLineVert;
        const fragmentShader = StreamLineFrag;

        super({
            uniforms,
            vertexShader,
            fragmentShader,
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false,
        });

        this.isMeshLineMaterial = true;
    }
}

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

    const vertexShader = `
        attribute vec3 position;

        uniform mat4 projectionMatrix;
        uniform mat4 modelViewMatrix;
        uniform vec3 color;

        varying vec3 vColor;

        void main() {
            vColor = color;

            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_Position = projectionMatrix * mvPosition;
        }`;

    const fragmentShader = `
        varying vec3 vColor;

        void main() {
            gl_FragColor = vec4(vColor, 1.0);
        }`;

    const material = new THREE.RawShaderMaterial({
        uniforms: {
            color: { type: "c", value: this.color },
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

// class StreamLineMaterial extends THREE.RawShaderMaterial {
//     constructor(parameters) {
//         const uniforms = {
//             color: { type: "c", value: new THREE.Color(0x0000ff) },
//         };

//         super({
//             uniforms,
//             vertexShader: vertexShader,
//             fragmentShader: fragmentShader,
//             side: THREE.DoubleSide,
//             depthTest: false,
//             depthWrite: false,
//         });
//     }
// }

export { StreamLineMaterial };
