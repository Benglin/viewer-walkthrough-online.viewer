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
        this._position = [];
        this._prev = [];
        this._next = [];
        this._side = [];
        this._width = [];
        this._index = [];

        this._widthCallback = null;
        this._geometry = null; // THREE.BufferGeometry();
    }

    get geometry() {
        return this._geometry;
    }

    setPoints(points, wcb) {
        if (!(points instanceof Float32Array) || points.length === 0) {
            throw new Error("Input points must be of Float32Array type");
        }

        this._widthCallback = wcb;
        this._position = [];

        for (let j = 0; j < points.length; j += 3) {
            const c = j / points.length;
            this._position.push(points[j], points[j + 1], points[j + 2]);
            this._position.push(points[j], points[j + 1], points[j + 2]);
        }

        this.process();
    }

    compareV3(a, b) {
        const aa = a * 6;
        const ab = b * 6;

        return (
            this._position[aa] === this._position[ab] &&
            this._position[aa + 1] === this._position[ab + 1] &&
            this._position[aa + 2] === this._position[ab + 2]
        );
    }

    copyV3(a) {
        const aa = a * 6;
        return {
            x: this._position[aa],
            y: this._position[aa + 1],
            z: this._position[aa + 2],
        };
    }

    updateAttribute(attribute, dataArray) {
        attribute.copyArray(dataArray);
        attribute.needsUpdate = true;
    }

    process() {
        if (this._geometry) {
            this._geometry.dispose();
            this._geometry = null;
        }

        const l = this._position.length / 6;

        this._prev = [];
        this._next = [];
        this._side = [];
        this._width = [];
        this._index = [];

        const isLoop = this.compareV3(0, l - 1);

        {
            // Create a 'previous point' for the first point of line. This 'previous'
            // point of the first point can either be the same as the first point itself
            // (when the line does not form a loop), or the second last point (when the
            // line is a loop).
            // 
            const copyFromIndex = isLoop ? l - 2 : 0;
            const { x, y, z } = this.copyV3(copyFromIndex);

            this._prev.push(x, y, z);
            this._prev.push(x, y, z);
        }

        for (var j = 0; j < l; j++) {
            // sides
            this._side.push(1);
            this._side.push(-1);

            // widths
            let w = 1.0;
            if (this._widthCallback) {
                w = this._widthCallback(j / (l - 1));
            }

            this._width.push(w);
            this._width.push(w);

            if (j < l - 1) {
                // points prev to poisitions
                const { x, y, z } = this.copyV3(j);
                this._prev.push(x, y, z);
                this._prev.push(x, y, z);

                // indices
                var n = j * 2;
                this._index.push(n, n + 1, n + 2);
                this._index.push(n + 2, n + 1, n + 3);
            }
            if (j > 0) {
                // points after poisitions
                const { x, y, z } = this.copyV3(j);
                this._next.push(x, y, z);
                this._next.push(x, y, z);
            }
        }

        {
            // Create a 'next point' for the last point in the line. This 'next' point
            // of the last point in line can either be the same as the last point itself
            // (when the line does not form a loop), or the second point in line (when
            // the line is a loop).
            // 
            const copyFromIndex = isLoop ? 1 : l - 1;
            const { x, y, z } = this.copyV3(copyFromIndex);

            this._next.push(x, y, z);
            this._next.push(x, y, z);
        }

        const positionArray = new Float32Array(this._position);
        const prevArray = new Float32Array(this._prev);
        const nextArray = new Float32Array(this._next);
        const sideArray = new Float32Array(this._side);
        const widthArray = new Float32Array(this._width);
        const indexArray = new Uint16Array(this._index);

        if (!this._attributes || this._attributes.position.count !== this._position.length) {
            this._attributes = {
                position: new THREE.BufferAttribute(positionArray, 3),
                prev: new THREE.BufferAttribute(prevArray, 3),
                next: new THREE.BufferAttribute(nextArray, 3),
                side: new THREE.BufferAttribute(sideArray, 1),
                width: new THREE.BufferAttribute(widthArray, 1),
                index: new THREE.BufferAttribute(indexArray, 1),
            };
        } else {
            updateAttribute(this._attributes.position, positionArray);
            updateAttribute(this._attributes.prev, prevArray);
            updateAttribute(this._attributes.next, nextArray);
            updateAttribute(this._attributes.side, sideArray);
            updateAttribute(this._attributes.width, widthArray);
            updateAttribute(this._attributes.index, indexArray);
        }

        this._geometry = new THREE.BufferGeometry();

        this._geometry.addAttribute("position", this._attributes.position);
        this._geometry.addAttribute("prev", this._attributes.prev);
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
        var prev = this._attributes.prev.array;
        var next = this._attributes.next.array;
        var l = positions.length;

        // PREV
        memcpy(positions, 0, prev, 0, l);

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
        this._attributes.prev.needsUpdate = true;
        this._attributes.next.needsUpdate = true;
    }
}

export { StreamLine };
