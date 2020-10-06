#version 300 es
precision mediump float;

uniform sampler2D uSampler;
uniform vec4 filterArea;

uniform vec2 position;
uniform vec4 color;
uniform float radius;
uniform vec2 dimensions;
uniform float zoom;

in vec2 vTextureCoord;
out vec4 outColor;

void main(void) {
	vec2 screenPosition = (vTextureCoord * filterArea.xy) / dimensions;

	vec4 screenColor = texture(uSampler, vTextureCoord);

	vec2 lightVector = vec2(position / dimensions * zoom - screenPosition);
    lightVector.x *= dimensions.x / dimensions.y;
	float dist = length(lightVector);
	float screenRadius = radius * zoom / dimensions.y;

	if(dist < screenRadius) {
		outColor.rgb = screenColor.rgb + color.rgb * (1.0 - dist / screenRadius);
		outColor.a = screenColor.a;
	}
	else {
		outColor = screenColor;
	}
}