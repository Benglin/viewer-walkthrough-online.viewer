function memcpy(src, srcOffset, dst, dstOffset, length) {
    src = src.subarray || src.slice ? src : src.buffer;
    dst = dst.subarray || dst.slice ? dst : dst.buffer;

    src = srcOffset
        ? src.subarray
            ? src.subarray(srcOffset, length && srcOffset + length)
            : src.slice(srcOffset, length && srcOffset + length)
        : src;

    if (dst.set) {
        dst.set(src, dstOffset);
    } else {
        for (let i = 0; i < src.length; i++) {
            dst[i + dstOffset] = src[i];
        }
    }

    return dst;
}

class StreamLine {
    constructor() {
        this.positions = [];
        this.previous = [];
        this.next = [];
        this.side = [];
        this.width = [];
        this.indices_array = [];
        this.uvs = [];
        this.counters = [];

        this.widthCallback = null;
        this._geometry = null; // THREE.BufferGeometry();
    }

    get geometry() {
        return this._geometry;
    }

    setPoints(points, wcb) {
        if (!(points instanceof Float32Array) || points.length === 0) {
            throw new Error("Input points must be of Float32Array type");
        }

        this.widthCallback = wcb;
        this.positions = [];
        this.counters = [];

        for (let j = 0; j < points.length; j += 3) {
            const c = j / points.length;
            this.positions.push(points[j], points[j + 1], points[j + 2]);
            this.positions.push(points[j], points[j + 1], points[j + 2]);
            this.counters.push(c);
            this.counters.push(c);
        }

        this.process();
    }

    compareV3(a, b) {
        var aa = a * 6;
        var ab = b * 6;
        return (
            this.positions[aa] === this.positions[ab] &&
            this.positions[aa + 1] === this.positions[ab + 1] &&
            this.positions[aa + 2] === this.positions[ab + 2]
        );
    }

    copyV3(a) {
        var aa = a * 6;
        return [this.positions[aa], this.positions[aa + 1], this.positions[aa + 2]];
    }

    process() {
        if (this._geometry) {
            this._geometry.dispose();
            this._geometry = null;
        }

        const l = this.positions.length / 6;

        this.previous = [];
        this.next = [];
        this.side = [];
        this.width = [];
        this.indices_array = [];
        this.uvs = [];

        let v;
        // initial previous points
        if (this.compareV3(0, l - 1)) {
            v = this.copyV3(l - 2);
        } else {
            v = this.copyV3(0);
        }

        this.previous.push(v[0], v[1], v[2]);
        this.previous.push(v[0], v[1], v[2]);

        for (var j = 0; j < l; j++) {
            // sides
            this.side.push(1);
            this.side.push(-1);

            // widths
            let w = 1.0;
            if (this.widthCallback) {
                w = this.widthCallback(j / (l - 1));
            }

            this.width.push(w);
            this.width.push(w);

            // uvs
            this.uvs.push(j / (l - 1), 0);
            this.uvs.push(j / (l - 1), 1);

            if (j < l - 1) {
                // points previous to poisitions
                v = this.copyV3(j);
                this.previous.push(v[0], v[1], v[2]);
                this.previous.push(v[0], v[1], v[2]);

                // indices
                var n = j * 2;
                this.indices_array.push(n, n + 1, n + 2);
                this.indices_array.push(n + 2, n + 1, n + 3);
            }
            if (j > 0) {
                // points after poisitions
                v = this.copyV3(j);
                this.next.push(v[0], v[1], v[2]);
                this.next.push(v[0], v[1], v[2]);
            }
        }

        // last next point
        if (this.compareV3(l - 1, 0)) {
            v = this.copyV3(1);
        } else {
            v = this.copyV3(l - 1);
        }

        this.next.push(v[0], v[1], v[2]);
        this.next.push(v[0], v[1], v[2]);

        // redefining the attribute seems to prevent range errors
        // if the user sets a differing number of vertices
        if (!this._attributes || this._attributes.position.count !== this.positions.length) {
            this._attributes = {
                position: new THREE.BufferAttribute(new Float32Array(this.positions), 3),
                previous: new THREE.BufferAttribute(new Float32Array(this.previous), 3),
                next: new THREE.BufferAttribute(new Float32Array(this.next), 3),
                side: new THREE.BufferAttribute(new Float32Array(this.side), 1),
                width: new THREE.BufferAttribute(new Float32Array(this.width), 1),
                index: new THREE.BufferAttribute(new Uint16Array(this.indices_array), 1),
            };
        } else {
            this._attributes.position.copyArray(new Float32Array(this.positions));
            this._attributes.position.needsUpdate = true;
            this._attributes.previous.copyArray(new Float32Array(this.previous));
            this._attributes.previous.needsUpdate = true;
            this._attributes.next.copyArray(new Float32Array(this.next));
            this._attributes.next.needsUpdate = true;
            this._attributes.side.copyArray(new Float32Array(this.side));
            this._attributes.side.needsUpdate = true;
            this._attributes.width.copyArray(new Float32Array(this.width));
            this._attributes.width.needsUpdate = true;
            this._attributes.index.copyArray(new Uint16Array(this.indices_array));
            this._attributes.index.needsUpdate = true;
        }

        this._geometry = new THREE.BufferGeometry();

        this._geometry.addAttribute("position", this._attributes.position);
        this._geometry.addAttribute("previous", this._attributes.previous);
        this._geometry.addAttribute("next", this._attributes.next);
        this._geometry.addAttribute("side", this._attributes.side);
        this._geometry.addAttribute("width", this._attributes.width);
        this._geometry.addAttribute("index", this._attributes.index);

        this._geometry.computeBoundingSphere();
        this._geometry.computeBoundingBox();
    }

    /**
     * Fast method to advance the line by one position.  The oldest position is removed.
     * @param position
     */
    advance(position) {
        var positions = this._attributes.position.array;
        var previous = this._attributes.previous.array;
        var next = this._attributes.next.array;
        var l = positions.length;

        // PREVIOUS
        memcpy(positions, 0, previous, 0, l);

        // POSITIONS
        memcpy(positions, 6, positions, 0, l - 6);

        positions[l - 6] = position.x;
        positions[l - 5] = position.y;
        positions[l - 4] = position.z;
        positions[l - 3] = position.x;
        positions[l - 2] = position.y;
        positions[l - 1] = position.z;

        // NEXT
        memcpy(positions, 6, next, 0, l - 6);

        next[l - 6] = position.x;
        next[l - 5] = position.y;
        next[l - 4] = position.z;
        next[l - 3] = position.x;
        next[l - 2] = position.y;
        next[l - 1] = position.z;

        this._attributes.position.needsUpdate = true;
        this._attributes.previous.needsUpdate = true;
        this._attributes.next.needsUpdate = true;
    }
}

export { StreamLine };
