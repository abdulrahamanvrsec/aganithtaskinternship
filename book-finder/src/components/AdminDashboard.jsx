import { useEffect, useState } from "react";
import {
  adminToggleBlock,
  adminUpdateUser,
  fetchAdminStats,
  fetchAdminUserDetail,
  fetchAdminUsers,
} from "../api";

const emptyEducation = { degree: "", institution: "", completionYear: "", score: "" };
const emptyExperience = { company: "", designation: "", from: "", to: "", responsibilities: "" };

export default function AdminDashboard({ token }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetchAdminStats(token),
        fetchAdminUsers(token),
      ]);
      setStats(statsRes);
      setUsers(usersRes.users);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadUser = async (user) => {
    setMessage(null);
    setError(null);
    setSelectedUser(user);
    try {
      const detail = await fetchAdminUserDetail(token, user.id);
      const profile = detail.profile;
      setForm({
        fullName: profile.fullName || "",
        email: profile.email,
        phone: profile.phone || "",
        status: profile.status,
        membershipId: profile.membershipId || "",
        dob: profile.dob || "",
        gender: profile.gender || "",
        contact: profile.contact || "",
        address: profile.address || "",
        skills: profile.skills || [],
        languages: profile.languages || [],
        education:
          profile.education?.map((item) => ({
            degree: item.degree || "",
            institution: item.institution || "",
            completionYear: item.completion_year || "",
            score: item.score || "",
          })) || [emptyEducation],
        experience:
          profile.experience?.map((item) => ({
            company: item.company || "",
            designation: item.role || "",
            from: item.start_date || "",
            to: item.end_date || "",
            responsibilities: item.responsibilities || "",
          })) || [emptyExperience],
      });
    } catch (err) {
      setError(err.message);
    }
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

  const handleInput = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addSkillField = (field) => {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const updateSkill = (field, index, value) => {
    setForm((prev) => {
      const updated = [...prev[field]];
      updated[index] = value;
      return { ...prev, [field]: updated };
    });
  };

  const submitUpdate = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await adminUpdateUser(token, selectedUser.id, form);
      setMessage("Profile updated successfully");
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (action) => {
    if (!selectedUser) return;
    try {
      await adminToggleBlock(token, selectedUser.id, action);
      setMessage(`User ${action}ed`);
      await refresh();
      setSelectedUser(null);
      setForm(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dashboard</h2>
          {stats ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Metric label="Total" value={stats.total} />
              <Metric label="Active" value={stats.active} />
              <Metric label="Pending" value={stats.pending} />
              <Metric label="Blocked" value={stats.blocked} />
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Loading stats...</p>
          )}
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Members</h3>
          <div className="space-y-2 max-h-[420px] overflow-auto pr-2">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => loadUser(user)}
                className={`w-full text-left border rounded-lg px-3 py-2 transition ${
                  selectedUser?.id === user.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-400"
                }`}
              >
                <p className="font-medium text-gray-900">{user.full_name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
                <span className="text-xs uppercase tracking-wide text-gray-500">{user.status}</span>
              </button>
            ))}
            {users.length === 0 && <p className="text-gray-500 text-sm">No members yet.</p>}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        {form && selectedUser ? (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Manage {form.fullName}</h3>
                <p className="text-sm text-gray-500">Membership ID: {form.membershipId || "Pending"}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded-lg bg-red-600 text-white"
                  onClick={() => toggleStatus("block")}
                >
                  Block
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded-lg bg-green-600 text-white"
                  onClick={() => toggleStatus("unblock")}
                >
                  Activate
                </button>
              </div>
            </div>
            <form onSubmit={submitUpdate} className="space-y-6">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Name" value={form.fullName} onChange={(v) => handleInput("fullName", v)} />
                <Field label="Phone" value={form.phone} onChange={(v) => handleInput("phone", v)} />
                <Field label="DOB" type="date" value={form.dob || ""} onChange={(v) => handleInput("dob", v)} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => handleInput("status", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <Field label="Membership ID" value={form.membershipId} onChange={(v) => handleInput("membershipId", v)} />
                <Field label="Gender" value={form.gender || ""} onChange={(v) => handleInput("gender", v)} />
                <Field label="Contact Email" value={form.contact || ""} onChange={(v) => handleInput("contact", v)} />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={form.address || ""}
                    onChange={(e) => handleInput("address", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </section>

              <section>
                <HeaderAction title="Education" actionLabel="➕ Add Education" onAction={() => addArrayItem("education", emptyEducation)} />
                <div className="space-y-4">
                  {form.education.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 p-4 rounded-lg">
                      <Field
                        label="Degree"
                        value={item.degree}
                        onChange={(v) => updateArrayItem("education", idx, "degree", v)}
                      />
                      <Field
                        label="University"
                        value={item.institution}
                        onChange={(v) => updateArrayItem("education", idx, "institution", v)}
                      />
                      <Field
                        label="Completion Year"
                        value={item.completionYear}
                        onChange={(v) => updateArrayItem("education", idx, "completionYear", v)}
                      />
                      <Field
                        label="Marks / CGPA"
                        value={item.score}
                        onChange={(v) => updateArrayItem("education", idx, "score", v)}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <HeaderAction
                  title="Work Experience"
                  actionLabel="➕ Add Experience"
                  onAction={() => addArrayItem("experience", emptyExperience)}
                />
                <div className="space-y-4">
                  {form.experience.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 p-4 rounded-lg">
                      <Field
                        label="Company"
                        value={item.company}
                        onChange={(v) => updateArrayItem("experience", idx, "company", v)}
                      />
                      <Field
                        label="Designation"
                        value={item.designation}
                        onChange={(v) => updateArrayItem("experience", idx, "designation", v)}
                      />
                      <Field
                        label="From"
                        value={item.from}
                        onChange={(v) => updateArrayItem("experience", idx, "from", v)}
                      />
                      <Field label="To" value={item.to} onChange={(v) => updateArrayItem("experience", idx, "to", v)} />
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities</label>
                        <textarea
                          value={item.responsibilities}
                          onChange={(e) => updateArrayItem("experience", idx, "responsibilities", e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <HeaderAction title="Skills" actionLabel="➕" onAction={() => addSkillField("skills")} compact />
                <HeaderAction title="Languages" actionLabel="➕" onAction={() => addSkillField("languages")} compact />
                <div className="space-y-2">
                  {form.skills.map((skill, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={skill}
                      onChange={(e) => updateSkill("skills", idx, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  ))}
                </div>
                <div className="space-y-2">
                  {form.languages.map((language, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={language}
                      onChange={(e) => updateSkill("languages", idx, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  ))}
                </div>
              </section>

              {error && <p className="text-red-600">{error}</p>}
              {message && <p className="text-green-600">{message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-black transition disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-500 text-sm">Select a member to view and edit their profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
      <p className="text-xs uppercase tracking-wide text-blue-600">{label}</p>
      <p className="text-xl font-semibold text-blue-800">{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2"
      />
    </div>
  );
}

function HeaderAction({ title, actionLabel, onAction, compact = false }) {
  return (
    <div className={`flex items-center justify-between ${compact ? "" : "mb-2"}`}>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <button type="button" className="text-blue-600 text-sm" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}
