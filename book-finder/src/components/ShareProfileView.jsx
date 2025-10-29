import { useEffect, useState } from "react";
import { fetchShareProfile, fetchShareResume } from "../api";

export default function ShareProfileView({ token }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [viewer, setViewer] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProfile = async (viewerName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchShareProfile(token, viewerName);
      setProfile(response.profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [token]);

  const downloadResume = async () => {
    try {
      const blob = await fetchShareResume(token);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "resume";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p className="text-gray-600 text-center">Loading shared profile...</p>;
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow p-6 max-w-3xl mx-auto">
        <p className="text-red-600">{error}</p>
        <button
          className="mt-3 text-blue-600 underline"
          onClick={() => loadProfile(viewer || undefined)}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return <p className="text-center text-gray-500">Profile not available.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow p-6 flex gap-6 items-center">
        {profile.profilePhoto && (
          <img
            src={`data:image/*;base64,${profile.profilePhoto}`}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border"
          />
        )}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{profile.fullName}</h1>
          <p className="text-gray-600">{profile.email}</p>
          <p className="text-gray-600">{profile.phone}</p>
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={viewer}
              onChange={(e) => setViewer(e.target.value)}
              placeholder="Your name (for access log)"
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <button
              type="button"
              className="bg-blue-600 text-white px-3 py-2 rounded-lg"
              onClick={() => loadProfile(viewer || undefined)}
            >
              Refresh with name
            </button>
          </div>
        </div>
      </div>

      <Section title="Education">
        {profile.education?.length ? (
          <ul className="space-y-3">
            {profile.education.map((item) => (
              <li key={`${item.degree}-${item.institution}`} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800">{item.degree}</h3>
                <p className="text-sm text-gray-600">{item.institution}</p>
                <p className="text-sm text-gray-500">
                  {item.completion_year} • {item.score}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No education history provided.</p>
        )}
      </Section>

      <Section title="Work Experience">
        {profile.experience?.length ? (
          <ul className="space-y-3">
            {profile.experience.map((item) => (
              <li key={`${item.company}-${item.role}`} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800">{item.role}</h3>
                <p className="text-sm text-gray-600">{item.company}</p>
                <p className="text-sm text-gray-500">
                  {item.start_date} – {item.end_date}
                </p>
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{item.responsibilities}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No work experience listed.</p>
        )}
      </Section>

      <Section title="Skills">
        {profile.skills?.length ? (
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No skills provided.</p>
        )}
      </Section>

      <Section title="Languages">
        {profile.languages?.length ? (
          <div className="flex flex-wrap gap-2">
            {profile.languages.map((lang) => (
              <span key={lang} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                {lang}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No languages provided.</p>
        )}
      </Section>

      <div className="bg-white rounded-xl shadow p-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Resume</h3>
          <p className="text-sm text-gray-600">Download the candidate's latest resume.</p>
        </div>
        <button className="bg-slate-900 text-white px-4 py-2 rounded-lg" onClick={downloadResume}>
          Download Resume
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-3">{title}</h2>
      {children}
    </section>
  );
}
