#version 300 es

precision mediump float;

#define PI 3.14159265358979323844

in vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float textureSize;
uniform vec4 color;
uniform float zoom;
uniform float adjustment;

out vec4 outColor;

void main(void) {
	vec2 uv = vTextureCoord * adjustment;
	float angle = atan(-uv.y + 0.5, uv.x - 0.5);
	if(angle < 0.0) {
		angle = PI * 2.0 + angle;
	}
	int index = int((angle / (PI * 2.0)) * textureSize) + 1;
	
	float shadowDist = texelFetch(uSampler, ivec2(index, 1), 0).x;

	float x = (uv.x - 0.5);
	float y = (uv.y - 0.5);
	float dist = length(vec2(x, y));
	
	if(dist < 0.5) {
		if(shadowDist < dist * 2.0) {
			// outColor = vec4(0, 0, 0, 0);

			float lightStrength = 1.0 - (dist * 2.0);
			lightStrength = pow(lightStrength, 2.0);
			outColor = vec4(color.rgb, 1.0) * lightStrength * color.a * 0.5;
		}
		else {
			float lightStrength = 1.0 - (dist * 2.0);
			lightStrength = pow(lightStrength, 2.0);
			outColor = vec4(color.rgb, 1.0) * lightStrength * color.a;
		}
	}
}