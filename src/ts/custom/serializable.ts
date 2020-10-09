import BinaryFileReader from "../helpers/binaryFileReader";
import BinaryFileWriter from "../helpers/binaryFileWriter";

export default abstract class Serializable {
	/**
	 * write object to file
	 * @param file 
	 * @param mode for different modes if we're in a specific place of the file
	 */
	abstract serialize(file: BinaryFileWriter, mode?: number)

	/**
	 * 
	 * @param file 
	 * @param mode for different modes if we're in a specific place of the file
	 */
	abstract read(file: BinaryFileReader, mode?: number)
}