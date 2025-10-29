import { useEffect, useState } from "react";
import { createShareLink, listShareLinks, updateProfile } from "../api";
import { fileToBase64, formatDate } from "../utils";

const emptyEducation = { degree: "", institution: "", completionYear: "", score: "" };
const emptyExperience = {
  company: "",
  designation: "",
  from: "",
  to: "",
  responsibilities: "",
};

export default function ProfileEditor({ token, profile, onRefresh }) {
  const [form, setForm] = useState({});
  const [shareLinks, setShareLinks] = useState([]);
  const [statusMessage, setStatusMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName || "",
        phone: profile.phone || "",
        dob: profile.dob || "",
        gender: profile.gender || "",
        contact: profile.contact || "",
        address: profile.address || "",
        skills: profile.skills || [],
        languages: profile.languages || [],
        education: profile.education?.map((item) => ({
          degree: item.degree || "",
          institution: item.institution || "",
          completionYear: item.completion_year || "",
          score: item.score || "",
        })) || [emptyEducation],
        experience: profile.experience?.map((item) => ({
          company: item.company || "",
          designation: item.role || "",
          from: item.start_date || "",
          to: item.end_date || "",
          responsibilities: item.responsibilities || "",
        })) || [emptyExperience],
        profilePhoto: null,
        resume: null,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (token) {
      refreshShareLinks();
    }
  }, [token]);

  const refreshShareLinks = async () => {
    try {
      const result = await listShareLinks(token);
      setShareLinks(result.links);
    } catch (err) {
      console.error(err);
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateArrayItem = (field, index, key, value) => {
    setForm((prev) => {
      const updated = prev[field].map((item, idx) => (idx === index ? { ...item, [key]: value } : item));
      return { ...prev, [field]: updated };
    });
  };

  const addArrayItem = (field, template) => {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], { ...template }] }));
  };

  const removeArrayItem = (field, index) => {
    setForm((prev) => {
      if (prev[field].length === 1) return prev;
      return { ...prev, [field]: prev[field].filter((_, idx) => idx !== index) };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        skills: form.skills.filter(Boolean),
        languages: form.languages.filter(Boolean),
        education: form.education,
        experience: form.experience,
        profilePhoto: await fileToBase64(form.profilePhoto),
        resume: await fileToBase64(form.resume),
      };
      await updateProfile(token, payload);
      setStatusMessage("Profile saved successfully");
      onRefresh();
      refreshShareLinks();
      setForm((prev) => ({ ...prev, profilePhoto: null, resume: null }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillChange = (index, value, fieldName) => {
    setForm((prev) => {
      const updated = [...prev[fieldName]];
      updated[index] = value;
      return { ...prev, [fieldName]: updated };
    });
  };

  const addSkillField = (fieldName) => {
    setForm((prev) => ({ ...prev, [fieldName]: [...prev[fieldName], ""] }));
  };

  const createShare = async (duration) => {
    setShareLoading(true);
    setError(null);
    try {
      const link = await createShareLink(token, duration);
      setStatusMessage(`Share link created: ${link.shareUrl}`);
      await refreshShareLinks();
    } catch (err) {
      setError(err.message);
    } finally {
      setShareLoading(false);
    }
  };

  if (!profile || !form.education) {
    return <p className="text-gray-600">Loading profile...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Membership Profile</h2>
            <p className="text-gray-500 text-sm">
              Membership ID: <span className="font-semibold">{profile.membershipId || "Pending"}</span> • Status:
              <span className="ml-1 capitalize">{profile.status}</span>
            </p>
          </div>
          {profile.profilePhoto && (
            <img
              src={`data:image/*;base64,${profile.profilePhoto}`}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border"
            />
          )}
        </div>
        <form onSubmit={handleSave} className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={form.dob || ""}
                  onChange={(e) => updateField("dob", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={form.gender || ""}
                  onChange={(e) => updateField("gender", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={form.contact || ""}
                  onChange={(e) => updateField("contact", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={form.address || ""}
                  onChange={(e) => updateField("address", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
                <input type="file" accept="image/*" onChange={(e) => updateField("profilePhoto", e.target.files?.[0] || null)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => updateField("resume", e.target.files?.[0] || null)} />
                {profile.resumePath && (
                  <p className="text-sm text-gray-500 mt-1">Resume already uploaded.</p>
                )}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center justify-between">
              Education
              <button
                type="button"
                className="text-blue-600 text-sm"
                onClick={() => addArrayItem("education", emptyEducation)}
              >
                ➕ Add Education
              </button>
            </h3>
            <div className="space-y-4">
              {form.education.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                    <input
                      type="text"
                      value={item.degree}
                      onChange={(e) => updateArrayItem("education", idx, "degree", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">University/College</label>
                    <input
                      type="text"
                      value={item.institution}
                      onChange={(e) => updateArrayItem("education", idx, "institution", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year of Completion</label>
                    <input
                      type="text"
                      value={item.completionYear}
                      onChange={(e) => updateArrayItem("education", idx, "completionYear", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marks / CGPA</label>
                    <input
                      type="text"
                      value={item.score}
                      onChange={(e) => updateArrayItem("education", idx, "score", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="button"
                      className="text-red-600 text-sm"
                      onClick={() => removeArrayItem("education", idx)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center justify-between">
              Work Experience
              <button
                type="button"
                className="text-blue-600 text-sm"
                onClick={() => addArrayItem("experience", emptyExperience)}
              >
                ➕ Add Experience
              </button>
            </h3>
            <div className="space-y-4">
              {form.experience.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={item.company}
                      onChange={(e) => updateArrayItem("experience", idx, "company", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={item.designation}
                      onChange={(e) => updateArrayItem("experience", idx, "designation", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration From</label>
                    <input
                      type="text"
                      value={item.from}
                      onChange={(e) => updateArrayItem("experience", idx, "from", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration To</label>
                    <input
                      type="text"
                      value={item.to}
                      onChange={(e) => updateArrayItem("experience", idx, "to", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities</label>
                    <textarea
                      value={item.responsibilities}
                      onChange={(e) => updateArrayItem("experience", idx, "responsibilities", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="button"
                      className="text-red-600 text-sm"
                      onClick={() => removeArrayItem("experience", idx)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center justify-between">
                Skills
                <button type="button" className="text-blue-600 text-sm" onClick={() => addSkillField("skills")}>
                  ➕ Add Skill
                </button>
              </h3>
              <div className="space-y-2">
                {form.skills.map((skill, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={skill}
                    onChange={(e) => handleSkillChange(idx, e.target.value, "skills")}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center justify-between">
                Languages
                <button type="button" className="text-blue-600 text-sm" onClick={() => addSkillField("languages")}>
                  ➕ Add Language
                </button>
              </h3>
              <div className="space-y-2">
                {form.languages.map((language, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={language}
                    onChange={(e) => handleSkillChange(idx, e.target.value, "languages")}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                ))}
              </div>
            </div>
          </section>

          {error && <p className="text-red-600">{error}</p>}
          {statusMessage && <p className="text-green-600">{statusMessage}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Sharing</h3>
        <div className="flex gap-3 mb-4">
          {[1, 2, 7].map((day) => (
            <button
              key={day}
              type="button"
              disabled={shareLoading}
              onClick={() => createShare(day)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-60"
            >
              Create {day}-day Link
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {shareLinks.map((link) => (
            <div key={link.token} className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-mono break-all">{link.shareUrl}</p>
              <p className="text-sm text-gray-600">Expires: {formatDate(link.expiresAt)}</p>
              <p className="text-sm text-gray-600">Views: {link.views}</p>
            </div>
          ))}
          {shareLinks.length === 0 && <p className="text-gray-500 text-sm">No share links created yet.</p>}
        </div>
      </div>
    </div>
  );
}
