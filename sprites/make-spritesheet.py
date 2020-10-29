import os
import math
import json
import re
from PIL import Image

sprite_size = (64, 128)
sprite_trim = 1

sprites = []
for (path, directory_names, file_names) in os.walk("./textures/"):
	sprites = file_names

sprites = sorted(sprites, key=str.lower)

# we place sprites into the sprite sheet left to right, top to bottom
max_sprites_x = 16

x_extent = sprite_size[0] * max_sprites_x + (max_sprites_x * sprite_trim * 2 + sprite_trim)
y_extent = sprite_size[1] * (math.ceil(len(sprites) / max_sprites_x)) + ((math.ceil(len(sprites) / max_sprites_x) % max_sprites_x) * sprite_trim * 2 + sprite_trim)

image = Image.new("RGBA", (x_extent, y_extent), (0, 0, 0, 0))

wall_regex = re.compile(r"^(wall_)([a-zA-Z]+)((_corner)?[1-4]\.png)$")
rotateable_regex = re.compile(r"^([a-zA-Z_0-9]+)[1-4]\.png$")
walls = {}
rotateables = {}
count = 0
x_position = 0
y_position = 0
frames = {}
for sprite in sprites:
	x_position = (count % max_sprites_x) * sprite_size[0] + ((count % max_sprites_x) * sprite_trim * 2 + sprite_trim)
	y_position = math.floor(count / max_sprites_x) * sprite_size[1] + ((math.floor(count / max_sprites_x) % max_sprites_x) * sprite_trim * 2 + sprite_trim)
	
	sprite_image = Image.open(f"./textures/{sprite}")
	image.paste(sprite_image, (x_position, y_position))

	is_tall = False

	# read sides of image and extend them into trim border

	# read top and insert into top trim
	for x in range(0, sprite_size[0]):
		r, g, b, a = sprite_image.getpixel((x, 0))
		image.putpixel((x + x_position, y_position - 1), (r, g, b, a))
	
	# read bottom and insert into bottom trim
	for x in range(0, sprite_size[0]):
		r, g, b, a = sprite_image.getpixel((x, sprite_size[1] - 1))
		image.putpixel((x + x_position, y_position + sprite_size[1]), (r, g, b, a))
	
	# read left and insert into left trim
	for y in range(0, sprite_size[1]):
		r, g, b, a = sprite_image.getpixel((0, y))
		image.putpixel((x_position - 1, y + y_position), (r, g, b, a))
	
	# read right and insert into right trim
	for y in range(0, sprite_size[1]):
		r, g, b, a = sprite_image.getpixel((sprite_size[0] - 1, y))
		image.putpixel((x_position + sprite_size[0], y + y_position), (r, g, b, a))
	
	for x in range(0, sprite_size[0]):
		for y in range(0, 56):
			r, g, b, a = sprite_image.getpixel((x, y))
			if a != 0:
				is_tall = True
				break
	
	match = wall_regex.match(sprite)
	if match:
		if match.group(2) not in walls:
			walls[match.group(2)] = []
		
		walls[match.group(2)].append(sprite)
	
	match = rotateable_regex.match(sprite)
	if match:
		if match.group(1) not in rotateables:
			rotateables[match.group(1)] = []
		
		rotateables[match.group(1)].append(sprite)


	frames[sprite] = {
		"frame": {
			"x": x_position,
			"y": y_position,
			"w": sprite_size[0],
			"h": sprite_size[1],
		},
		"rotated": False,
		"trimmed": True,
		"spriteSourceSize": {
			"x": 0,
			"y": 0,
			"w": sprite_size[0],
			"h": sprite_size[1],
		},
		"sourceSize": {
			"w": sprite_size[0],
			"h": sprite_size[1],
		},
		"custom": {
			"isTall": is_tall,
			"isWall": False,
			"isWallCorner": False,
			"isRotateable": False,
		},
	}

	count = count + 1

# find walls and define them as such
for base_name in walls:
	array = walls[base_name]

	# welcome to hell:
	has_parts = (len(array) == 8 and f"wall_{base_name}1.png" in array and f"wall_{base_name}2.png" in array and f"wall_{base_name}3.png" in array and f"wall_{base_name}4.png" in array and f"wall_{base_name}_corner1.png" in array and f"wall_{base_name}_corner2.png" in array and f"wall_{base_name}_corner3.png" in array and f"wall_{base_name}_corner4.png" in array)

	if has_parts:
		print(f"found wall 'wall_{base_name}*[1-4].png'")
		for sprite in array:
			frames[sprite]["custom"]["isWall"] = True
			if "corner" in sprite:
				frames[sprite]["custom"]["isWallCorner"] = True

# find sprites that require special rotation sprites
for base_name in rotateables:
	array = rotateables[base_name]
	has_parts = (len(array) == 4 and f"{base_name}1.png" in array and f"{base_name}2.png" in array and f"{base_name}3.png" in array and f"{base_name}4.png" in array)

	if has_parts:
		print(f"found rotateable '{base_name}[1-4].png'")
		for sprite in array:
			frames[sprite]["custom"]["isRotateable"] = True

json.dump(
	{
		"frames": frames,
		"meta": {
			"app": "bansheepacker",
			"version": "1.0",
			"image": "spritesheet.png",
			"format": "RGBA8888",
			"size": (x_extent, y_extent),
			"scale": "1",
		}
	},
	open("spritesheet.json", "w")
)

image.save("spritesheet.png", "PNG")