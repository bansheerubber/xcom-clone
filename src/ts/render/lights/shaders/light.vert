#version 300 es
precision mediump float;

in vec2 aVertexPosition;
in vec2 aTextureCoord;

uniform mat3 projectionMatrix;

out vec2 vTextureCoord;
out vec2 UV;

void main(void) {
   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
   vTextureCoord = aTextureCoord;
   UV = (aVertexPosition.xy + vec2(1, 1)) / 2.0;
}