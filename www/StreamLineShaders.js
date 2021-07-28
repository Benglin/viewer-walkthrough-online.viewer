const StreamLineVert = [
    "",
    THREE.ShaderChunk.logdepthbuf_pars_vertex,
    THREE.ShaderChunk.fog_pars_vertex,
    "",
    "attribute vec3 previous;",
    "attribute vec3 next;",
    "attribute float side;",
    "attribute float width;",
    "attribute float counters;",
    "",
    "uniform vec2 resolution;",
    "uniform float lineWidth;",
    "uniform vec3 color;",
    "uniform float opacity;",
    "uniform float sizeAttenuation;",
    "",
    "varying vec2 vUV;",
    "varying vec4 vColor;",
    "varying float vCounters;",
    "",
    "vec2 fix( vec4 i, float aspect ) {",
    "",
    "    vec2 res = i.xy / i.w;",
    "    res.x *= aspect;",
    "     vCounters = counters;",
    "    return res;",
    "",
    "}",
    "",
    "void main() {",
    "",
    "    float aspect = resolution.x / resolution.y;",
    "",
    "    vColor = vec4( color, opacity );",
    "    vUV = uv;",
    "",
    "    mat4 m = projectionMatrix * modelViewMatrix;",
    "    vec4 finalPosition = m * vec4( position, 1.0 );",
    "    vec4 prevPos = m * vec4( previous, 1.0 );",
    "    vec4 nextPos = m * vec4( next, 1.0 );",
    "",
    "    vec2 currentP = fix( finalPosition, aspect );",
    "    vec2 prevP = fix( prevPos, aspect );",
    "    vec2 nextP = fix( nextPos, aspect );",
    "",
    "    float w = lineWidth * width;",
    "",
    "    vec2 dir;",
    "    if( nextP == currentP ) dir = normalize( currentP - prevP );",
    "    else if( prevP == currentP ) dir = normalize( nextP - currentP );",
    "    else {",
    "        vec2 dir1 = normalize( currentP - prevP );",
    "        vec2 dir2 = normalize( nextP - currentP );",
    "        dir = normalize( dir1 + dir2 );",
    "",
    "        vec2 perp = vec2( -dir1.y, dir1.x );",
    "        vec2 miter = vec2( -dir.y, dir.x );",
    "        //w = clamp( w / dot( miter, perp ), 0., 4. * lineWidth * width );",
    "",
    "    }",
    "",
    "    //vec2 normal = ( cross( vec3( dir, 0. ), vec3( 0., 0., 1. ) ) ).xy;",
    "    vec4 normal = vec4( -dir.y, dir.x, 0., 1. );",
    "    normal.xy *= .5 * w;",
    "    normal *= projectionMatrix;",
    "    if( sizeAttenuation == 0. ) {",
    "        normal.xy *= finalPosition.w;",
    "        normal.xy /= ( vec4( resolution, 0., 1. ) * projectionMatrix ).xy;",
    "    }",
    "",
    "    finalPosition.xy += normal.xy * side;",
    "",
    "    gl_Position = finalPosition;",
    "",
    THREE.ShaderChunk.logdepthbuf_vertex,
    THREE.ShaderChunk.fog_vertex &&
        "    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
    THREE.ShaderChunk.fog_vertex,
    "}",
].join("\n");

const StreamLineFrag = [
    "",
    THREE.ShaderChunk.fog_pars_fragment,
    THREE.ShaderChunk.logdepthbuf_pars_fragment,
    "",
    "uniform sampler2D map;",
    "uniform sampler2D alphaMap;",
    "uniform float useMap;",
    "uniform float useAlphaMap;",
    "uniform float useDash;",
    "uniform float dashArray;",
    "uniform float dashOffset;",
    "uniform float dashRatio;",
    "uniform float visibility;",
    "uniform float alphaTest;",
    "uniform vec2 repeat;",
    "",
    "varying vec2 vUV;",
    "varying vec4 vColor;",
    "varying float vCounters;",
    "",
    "void main() {",
    "",
    THREE.ShaderChunk.logdepthbuf_fragment,
    "",
    "    vec4 c = vColor;",
    "    if( useMap == 1. ) c *= texture2D( map, vUV * repeat );",
    "    if( useAlphaMap == 1. ) c.a *= texture2D( alphaMap, vUV * repeat ).a;",
    "    if( c.a < alphaTest ) discard;",
    "    if( useDash == 1. ){",
    "        c.a *= ceil(mod(vCounters + dashOffset, dashArray) - (dashArray * dashRatio));",
    "    }",
    "    gl_FragColor = c;",
    "    gl_FragColor.a *= step(vCounters, visibility);",
    "",
    THREE.ShaderChunk.fog_fragment,
    "}",
].join("\n");

const SimpleVert = `
// #ifdef USE_LOGDEPTHBUF
// 
//     #ifdef USE_LOGDEPTHBUF_EXT
// 
//         varying float vFragDepth;
// 
//     #endif
// 
//     uniform float logDepthBufFC;
// 
// #endif

attribute vec3 position;
attribute vec3 previous;
attribute vec3 next;
attribute float side;
attribute float width;
attribute float counters;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform vec2 resolution;
uniform float lineWidth;
uniform vec3 color;
uniform float opacity;
uniform float sizeAttenuation;

varying vec4 vColor;
// varying vec2 vUV;
// varying float vCounters;

vec2 fix( vec4 i, float aspect ) {

    vec2 res = i.xy / i.w;
    res.x *= aspect;
    // vCounters = counters;
    return res;

}

void main() {

    float aspect = resolution.x / resolution.y;

    vColor = vec4( color, opacity );
    // vUV = uv;

    mat4 m = projectionMatrix * modelViewMatrix;
    vec4 finalPosition = m * vec4( position, 1.0 );
    vec4 prevPos = m * vec4( previous, 1.0 );
    vec4 nextPos = m * vec4( next, 1.0 );

    vec2 currentP = fix( finalPosition, aspect );
    vec2 prevP = fix( prevPos, aspect );
    vec2 nextP = fix( nextPos, aspect );

    float w = lineWidth * width;

    vec2 dir;
    if( nextP == currentP ) dir = normalize( currentP - prevP );
    else if( prevP == currentP ) dir = normalize( nextP - currentP );
    else {
        vec2 dir1 = normalize( currentP - prevP );
        vec2 dir2 = normalize( nextP - currentP );
        dir = normalize( dir1 + dir2 );

        vec2 perp = vec2( -dir1.y, dir1.x );
        vec2 miter = vec2( -dir.y, dir.x );

    }

    vec4 normal = vec4( -dir.y, dir.x, 0., 1. );
    normal.xy *= .5 * w;
    normal *= projectionMatrix;
    if( sizeAttenuation == 0. ) {
        normal.xy *= finalPosition.w;
        normal.xy /= ( vec4( resolution, 0., 1. ) * projectionMatrix ).xy;
    }

    finalPosition.xy += normal.xy * side;

    gl_Position = finalPosition;

// #ifdef USE_LOGDEPTHBUF
// 
//     gl_Position.z = log2(max( EPSILON, gl_Position.w + 1.0 )) * logDepthBufFC;
// 
//     #ifdef USE_LOGDEPTHBUF_EXT
// 
//         vFragDepth = 1.0 + gl_Position.w;
// 
// #else
// 
//         gl_Position.z = (gl_Position.z - 1.0) * gl_Position.w;
// 
//     #endif
// 
// #endif
}`;

const SimpleFrag = `
// #ifdef USE_FOG
// 
//     uniform vec3 fogColor;
// 
//     #ifdef FOG_EXP2
// 
//         uniform float fogDensity;
// 
//     #else
// 
//         uniform float fogNear;
//         uniform float fogFar;
//     #endif
// 
// #endif
// 
// #ifdef USE_LOGDEPTHBUF
// 
//     uniform float logDepthBufFC;
// 
//     #ifdef USE_LOGDEPTHBUF_EXT
// 
//         #extension GL_EXT_frag_depth : enable
//         varying float vFragDepth;
// 
//     #endif
// 
// #endif

uniform sampler2D map;
uniform sampler2D alphaMap;
uniform float useMap;
uniform float useAlphaMap;
uniform float useDash;
uniform float dashArray;
uniform float dashOffset;
uniform float dashRatio;
uniform float visibility;
uniform float alphaTest;
uniform vec2 repeat;

varying vec4 vColor;
// varying vec2 vUV;
// varying float vCounters;

void main() {

// #if defined(USE_LOGDEPTHBUF) && defined(USE_LOGDEPTHBUF_EXT)
// 
//     gl_FragDepthEXT = log2(vFragDepth) * logDepthBufFC * 0.5;
// 
// #endif

//    vec4 c = vColor;
//    if( useMap == 1. ) c *= texture2D( map, vUV * repeat );
//    if( useAlphaMap == 1. ) c.a *= texture2D( alphaMap, vUV * repeat ).a;
//    if( c.a < alphaTest ) discard;
//    if( useDash == 1. ){
//        c.a *= ceil(mod(vCounters + dashOffset, dashArray) - (dashArray * dashRatio));
//    }
//    gl_FragColor = c;
//    gl_FragColor.a *= step(vCounters, visibility);

    gl_FragColor = vColor;

// #ifdef USE_FOG
// 
//     #ifdef USE_LOGDEPTHBUF_EXT
// 
//         float depth = gl_FragDepthEXT / gl_FragCoord.w;
// 
//     #else
// 
//         float depth = gl_FragCoord.z / gl_FragCoord.w;
// 
//     #endif
// 
//     #ifdef FOG_EXP2
// 
//         float fogFactor = exp2( - square( fogDensity ) * square( depth ) * LOG2 );
//         fogFactor = whiteCompliment( fogFactor );
// 
//     #else
// 
//         float fogFactor = smoothstep( fogNear, fogFar, depth );
// 
//     #endif
//     
//     outgoingLight = mix( outgoingLight, fogColor, fogFactor );
// 
// #endif
}`;

export { SimpleVert as StreamLineVert, SimpleFrag as StreamLineFrag };
