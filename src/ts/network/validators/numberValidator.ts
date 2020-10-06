import { validator } from "../networkDecorators";
import Validator from "./validator";

@validator(Number)
export default class NumberValidator extends Validator {
	public static validate(value: number): boolean {
		if(typeof value == "number" || value == undefined) {
			return true
		}
		else {
			return false
		}
	}
}