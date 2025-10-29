import { useState } from "react";
import { registerUser } from "../api";
import { fileToBase64 } from "../utils";

const initialState = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  profilePhoto: null,
  resume: null,
};

export default function RegistrationForm({ onSwitchToLogin }) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = (e) => {
    const { name, files } = e.target;
    setForm((prev) => ({ ...prev, [name]: files?.[0] || null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        profilePhoto: await fileToBase64(form.profilePhoto),
        resume: await fileToBase64(form.resume),
      };
      const response = await registerUser(payload);
      setMessage(response);
      setForm(initialState);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl w-full">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900">Create Your SOCRP Membership</h2>
      <p className="text-gray-600 mb-6">
        Register to receive a verification link and start building your professional profile.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
            <input
              type="file"
              accept="image/*"
              name="profilePhoto"
              onChange={handleFile}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resume (PDF/DOC)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              name="resume"
              onChange={handleFile}
              className="w-full"
            />
          </div>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
            <p className="font-medium">Registration successful!</p>
            <p className="text-sm mt-1">
              Use the verification link below to activate your account. Share it via email delivery service in production.
            </p>
            <code className="mt-2 block text-sm break-all bg-white border border-green-100 rounded p-2">
              {message.verificationLink}
            </code>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
      <p className="text-sm text-gray-600 mt-4">
        Already have an account?{" "}
        <button className="text-blue-600 hover:underline" onClick={onSwitchToLogin}>
          Sign in
        </button>
      </p>
    </div>
  );
}
