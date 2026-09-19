import { useCallback, useState } from "react";

interface EmailValidationOptions {
	emptyErrorMessage?: string;
	invalidErrorMessage?: string;
}

interface ValidationResult {
	isValid: boolean;
	message?: string;
}

const useEmailValidation = (options?: EmailValidationOptions) => {
	const defaultMessages = {
		emptyErrorMessage: "Email cannot be empty!",
		invalidErrorMessage: "Please enter a valid email address",
		...options,
	};

	const [error, setError] = useState<string>("");

	const resetError = useCallback(() => setError(""), []);

	const validateEmail = useCallback(
		(email: string): ValidationResult => {
			const trimmedEmail = email.trim();

			if (!trimmedEmail) {
				setError(defaultMessages.emptyErrorMessage);
				return { isValid: false, message: defaultMessages.emptyErrorMessage };
			}

			const emailRegex =
				/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

			if (!emailRegex.test(trimmedEmail)) {
				setError(defaultMessages.invalidErrorMessage);
				return { isValid: false, message: defaultMessages.invalidErrorMessage };
			}

			resetError();
			return { isValid: true };
		},
		[
			defaultMessages.emptyErrorMessage,
			defaultMessages.invalidErrorMessage,
			resetError,
		]
	);

	return { validateEmail, error, resetError };
};

export default useEmailValidation;
