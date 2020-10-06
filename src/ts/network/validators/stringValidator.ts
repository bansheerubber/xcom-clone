import { validator } from "../networkDecorators";
import Validator from "./validator";

@validator(String)
export default class StringValidator extends Validator {
	public static validate(value: string): boolean {
		if(typeof value == "string" || value == undefined) {
			return true
		}
		else {
			return false
		}
	}
}