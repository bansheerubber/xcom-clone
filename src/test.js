// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech');

// Import other required libraries
const fs = require('fs');
const util = require('util');
async function main() {
	// Creates a client
	const client = new textToSpeech.TextToSpeechClient();

	// The text to synthesize
	const text = `<speak>Good evening ladies and gentlemen, welcome to night 3 of Sir Cobblepot's exquisite dinner party. We gather here in celebration of Sir's brand new railway built in North America. All proceeds will go to furthering the construction of the Sir's railway, which will soon encircle the entire world. Unfortunately, I must report that there are MAD, MEAN, MYSTERIOUS, MISCHIEVOUS, MURDEROUS, MAFIA MEMBERS hiding amongst you. I dare say that the Americans have infiltrated this once fabulous ball. It is of the Cobblepot House Rule to not become involved in such disputes, so you must figure out who is responsible for your future deaths on your own. And with that, I bid you farewell, goodnight, sweet dreams, and finally, god save you all.</speak>`;

	// Construct the request
	const request = {
		input: {
			ssml: text
		},
		// Select the language and SSML Voice Gender (optional)
		voice: {
			languageCode: 'en-US',
			name: "en-GB-Wavenet-D",
			ssmlGender: 'NEUTRAL',
		},
		// Select the type of audio encoding
		audioConfig: {
			audioEncoding: 'MP3'
		},
	};

	// Performs the Text-to-Speech request
	const [response] = await client.synthesizeSpeech(request);
	// Write the binary audio content to a local file
	const writeFile = util.promisify(fs.writeFile);
	await writeFile('output.mp3', response.audioContent, 'binary');
	console.log('Audio content written to file: output.mp3');
}

main()