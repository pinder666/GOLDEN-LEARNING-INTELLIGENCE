import { Icon } from "@iconify/react";
import { useState, FormEvent, ChangeEvent } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Define the form data structure
interface FormData {
	fullname: string;
	email: string;
	website: string;
	comment: string;
}

const CommentForm = () => {
	// Get the API key from environment variables
	const apiKey = import.meta.env.VITE_CONTACT_API_KEY || "";

	// Initialize form state
	const [form, setForm] = useState<FormData>({
		fullname: "",
		email: "",
		website: "",
		comment: "",
	});

	// Email validation function
	const isValidEmail = (email: string): boolean => {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	};

	// Handle input changes
	const handleChange = (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	// Handle form submission
	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		// Validate form fields
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
		if (!form.comment.trim()) {
			toast.error("Message field is required!");
			return;
		}

		// Prepare form data
		const formData = new FormData();
		formData.append("access_key", apiKey);
		formData.append("fullname", form.fullname);
		formData.append("email", form.email);
		formData.append("website", form.website);
		formData.append("comment", form.comment);

		try {
			// Submit form data
			const res = await fetch("https://api.web3forms.com/submit", {
				method: "POST",
				body: formData,
			});

			if (res.ok) {
				toast.success("Comment sent successfully!");
				// Reset form after successful submission
				setForm({
					fullname: "",
					email: "",
					website: "",
					comment: "",
				});
			} else {
				throw new Error("Failed to submit form");
			}
		} catch (err) {
			console.error("Submission error:", err);
			toast.error("Failed to send comment. Please try again later.");
		}
	};

	return (
		<form onSubmit={handleSubmit} className="cs_comment_form row cs_gap_y_24">
			<div className="col-sm-6">
				<label htmlFor="fullname">Full Name*</label>
				<input
					type="text"
					name="fullname"
					value={form.fullname}
					onChange={handleChange}
					className="cs_form_field cs_radius_30"
					id="fullname"
				/>
			</div>
			<div className="col-sm-6">
				<label htmlFor="email">Email*</label>
				<input
					type="email"
					name="email"
					value={form.email}
					onChange={handleChange}
					className="cs_form_field cs_radius_30"
					id="email"
				/>
			</div>
			<div className="col-sm-12">
				<label htmlFor="website">Website</label>
				<input
					type="url"
					name="website"
					value={form.website}
					onChange={handleChange}
					className="cs_form_field cs_radius_30"
					id="website"
					placeholder="https://example.com"
				/>
			</div>
			<div className="col-sm-12">
				<label htmlFor="comment">Write Your Comment*</label>
				<textarea
					rows={5}
					name="comment"
					value={form.comment}
					onChange={handleChange}
					className="cs_form_field cs_radius_30"
					id="comment"
				/>
			</div>
			<div className="col-sm-12">
				<button
					type="submit"
					aria-label="Submit Comment"
					className="cs_btn cs_style_1 cs_purple_bg cs_fs_16 cs_white_color cs_semibold cs_accent_hover aos fadeInUp"
					data-aos="fade-up"
					data-aos-duration="800"
				>
					<span>Post Comment</span>
					<span className="cs_btn_icon cs_center overflow-hidden">
						<Icon
							icon="fa6-solid:arrow-right"
							className="cs_custom_anim"
							aria-hidden="true"
						/>
					</span>
				</button>
			</div>
		</form>
	);
};

export default CommentForm;
