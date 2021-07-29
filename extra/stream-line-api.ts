declare namespace THREE {
    class Color {}
}

declare namespace StreamLineLibrary {
    class StreamLineMaterial {
        readonly id: string;

        constructor(lineWidth: number, lineColor: THREE.Color, opacity: number);
    }

    interface GetLineWidthScaleFunc {
        (fraction: number): number;
    }

    class StreamLineData {
        points: Float32Array;
        colors?: Float32Array;
        scaleCallback?: GetLineWidthScaleFunc;
    }

    class StreamLineSpecs {
        lineWidth: number;
        lineColor: THREE.Color;
        opacity: number;
        lineData: StreamLineData;
    }

    class StreamLine {
        constructor(streamLineData: StreamLineData);
        dispose(): void;
        advance(xyz: number[], rgb: number[]): void;
    }

    class StreamLineBuilder {
        private _materials: Map<string, StreamLineMaterial>;

        constructor(viewer: any);
        dispose(): void;
        createStreamLine(streamLineSpecs: StreamLineSpecs): StreamLine;
    }
}
