import { useState, FormEvent, ChangeEvent } from "react";
import { toast } from "react-toastify";

// Define the form data structure
interface FormData {
	fullname: string;
	email: string;
	companyname: string;
	phone: string;
	message: string;
}

const ContactForm = () => {
	// Get the API key from environment variables
	const apiKey = import.meta.env.VITE_CONTACT_API_KEY as string;

	// Initialize form state
	const [form, setForm] = useState<FormData>({
		fullname: "",
		email: "",
		companyname: "",
		phone: "",
		message: "",
	});

	// Email validation function
	const isValidEmail = (email: string): boolean =>
		/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

	const isValidPhone = (phone: string): boolean => /^[0-9]{7,15}$/.test(phone);

	// Handle input changes
	const handleChange = (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	// Handle form submission
	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();

		if (!form.fullname.trim()) {
			toast.error("Full Name field is required!");
			return;
		}
		if (!form.email.trim()) {
			toast.error("Email field is required!");
			return;
		}
		if (!isValidEmail(form.email)) {
			toast.error("Please enter a valid email address!");
			return;
		}
		if (!form.companyname.trim()) {
			toast.error("Company Name field is required!");
			return;
		}
		if (!form.phone.trim()) {
			toast.error("Phone field is required!");
			return;
		}
		if (!isValidPhone(form.phone)) {
			toast.error("Please enter a valid phone number (7-15 digits)!");
			return;
		}
		if (!form.message.trim()) {
			toast.error("Message field is required!");
			return;
		}

		const formData = new FormData();
		formData.append("access_key", apiKey);
		formData.append("fullname", form.fullname);
		formData.append("email", form.email);
		formData.append("companyname", form.companyname);
		formData.append("phone", form.phone);
		formData.append("message", form.message);

		try {
			const res = await fetch("https://api.web3forms.com/submit", {
				method: "POST",
				body: formData,
			});

			if (res.ok) {
				toast.success("Message sent successfully!", {
					style: { background: "#d4edda", color: "#155724" },
				});
				setForm({
					fullname: "",
					email: "",
					companyname: "",
					phone: "",
					message: "",
				});
			} else {
				const errorData = await res.json();
				toast.error(errorData.message || "Failed to send message. Try again.");
			}
		} catch (err) {
			console.error("Submission error:", err);
			toast.error("Network error. Please try again later.");
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="cs_contact_form row cs_gap_y_24"
			id="cs_form"
			data-aos="fade-up"
			data-aos-duration="800"
		>
			<div className="col-sm-6">
				<label htmlFor="fullname">Full Name*</label>
				<input
					type="text"
					name="fullname"
					id="fullname"
					className="cs_form_field cs_radius_30"
					value={form.fullname}
					onChange={handleChange}
					aria-required="true"
				/>
			</div>
			<div className="col-sm-6">
				<label htmlFor="email">Email*</label>
				<input
					type="email"
					name="email"
					id="email"
					className="cs_form_field cs_radius_30"
					value={form.email}
					onChange={handleChange}
					aria-required="true"
				/>
			</div>
			<div className="col-sm-6">
				<label htmlFor="companyname">Company Name*</label>
				<input
					type="text"
					name="companyname"
					id="companyname"
					className="cs_form_field cs_radius_30"
					value={form.companyname}
					onChange={handleChange}
					aria-required="true"
				/>
			</div>
			<div className="col-sm-6">
				<label htmlFor="phone">Mobile*</label>
				<input
					type="tel" // Changed from number to tel for better mobile UX
					name="phone"
					id="phone"
					className="cs_form_field cs_radius_30"
					value={form.phone}
					onChange={handleChange}
					pattern="[0-9]{7,15}"
					aria-required="true"
				/>
			</div>
			<div className="col-sm-12">
				<label htmlFor="message">Write Query Details*</label>
				<textarea
					name="message"
					id="message"
					rows={7}
					className="cs_form_field cs_radius_30"
					value={form.message}
					onChange={handleChange}
					aria-required="true"
				/>
			</div>
			<div className="col-sm-12">
				<button
					type="submit"
					className="cs_btn cs_style_1 cs_accent_bg cs_purple_hover cs_fs_16 cs_semibold cs_white_color cs_radius_30 aos fadeInUp"
					data-aos="fade-up"
					data-aos-duration="800"
				>
					<span>Send Message</span>
				</button>
				<div id="cs_result" className="cs_result"></div>
			</div>
		</form>
	);
};

export default ContactForm;
