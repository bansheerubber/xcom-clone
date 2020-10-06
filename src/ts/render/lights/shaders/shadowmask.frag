#version 300 es

precision mediump float;

#define PI 3.14159265358979323844

in vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform int resolutionMode;
uniform float zoom;

out vec4 outColor;

// domain of rectangular x/y is [0, 1], return is [0, 1]
vec2 rectToPolar(in vec2 rectangular) {
	float radius = rectangular.y / 2.0;
	float angle = (rectangular.x * PI * 2.0) + PI / 2.0;
	float x = radius * sin(angle) + 0.5;
	float y = radius * cos(angle) + 0.5;
	
	return vec2(x, y);
}

void main(void) {
	float resolution = 1024.0;
	if(resolutionMode == 1) {
		resolution = 256.0;
	}
	else if(resolutionMode == 2) {
		resolution = 512.0;
	}
	else if(resolutionMode == 3) {
		resolution = 1024.0;
	}

	float distance = 1.0; // the closer the distance, the closer the shadow

	// for with each x, check each y in the supplied sampler
	if(int(vTextureCoord.y * resolution) <= int(5.0 * (1.0 / zoom))) {
		const float incrementAmount = 4.0;
		for(float y = 0.0; y < resolution; y += incrementAmount) {
			vec2 coord = vec2(vTextureCoord.x, y / resolution);
			vec2 polarCoord = rectToPolar(coord);
			vec4 color = texelFetch(uSampler, ivec2(int(polarCoord.x * resolution), int(polarCoord.y * resolution)), 0);

			if(color.a > 0.9) {
				distance = (y + incrementAmount) / resolution + 1.0 / 300.0; // add 1 / 300.0 onto it so shadows overlap with the casters a little
				break;
			}
		}
		
		outColor = vec4(vec3(distance), 1.0);
	}
	else {
		outColor = texture(uSampler, vTextureCoord);
	}

	/*vec2 polarCoord = rectToPolar(vTextureCoord);
	vec4 color = texelFetch(uSampler, ivec2(int(polarCoord.x * resolution), int(polarCoord.y * resolution)), 0);

	outColor = color;*/
}