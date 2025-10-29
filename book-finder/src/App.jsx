import { useEffect, useMemo, useState } from "react";
import AdminDashboard from "./components/AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import LoginForm from "./components/LoginForm";
import ProfileEditor from "./components/ProfileEditor";
import RegistrationForm from "./components/RegistrationForm";
import ShareProfileView from "./components/ShareProfileView";
import VerifyAccount from "./components/VerifyAccount";
import { API_BASE, fetchProfile } from "./api";
import "./App.css";

const VIEWS = {
  LANDING: "landing",
  REGISTER: "register",
  LOGIN: "login",
  VERIFY: "verify",
  PROFILE: "profile",
  ADMIN_LOGIN: "admin-login",
  ADMIN_PANEL: "admin-panel",
  SHARE: "share",
};

function App() {
  const [view, setView] = useState(VIEWS.LANDING);
  const [userToken, setUserToken] = useState(() => localStorage.getItem("socrp_user_token"));
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem("socrp_admin_token"));
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [shareToken, setShareToken] = useState(null);

  useEffect(() => {
    const { pathname } = window.location;
    if (pathname.startsWith("/share/")) {
      const token = pathname.replace("/share/", "");
      setShareToken(token);
      setView(VIEWS.SHARE);
    }
  }, []);

  useEffect(() => {
    if (userToken) {
      loadProfile();
    } else {
      setProfile(null);
    }
  }, [userToken]);

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await fetchProfile(userToken);
      setProfile(response.profile);
      setView(VIEWS.PROFILE);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = () => {
    setUserToken(null);
    localStorage.removeItem("socrp_user_token");
    setProfile(null);
    setView(VIEWS.LANDING);
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    localStorage.removeItem("socrp_admin_token");
    setView(VIEWS.LANDING);
  };

  const heroContent = useMemo(
    () => (
      <header className="text-center py-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-3xl shadow-lg">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">SOCRP Certification & Membership System</h1>
        <p className="max-w-2xl mx-auto text-lg opacity-90">
          Empower candidates to showcase verified professional profiles and enable administrators to manage memberships with ease.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
          <span className="px-4 py-2 bg-white/20 rounded-full">Automated Membership IDs</span>
          <span className="px-4 py-2 bg-white/20 rounded-full">Email Verification</span>
          <span className="px-4 py-2 bg-white/20 rounded-full">Unlimited Education & Experience</span>
          <span className="px-4 py-2 bg-white/20 rounded-full">Shareable Profile Links</span>
        </div>
      </header>
    ),
    []
  );

  const featureMatrix = (
    <section className="bg-white rounded-3xl shadow-xl p-8 mt-10">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Feature Matrix</h2>
      <div className="overflow-auto">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-200 px-4 py-2 text-left">Feature</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Member</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Admin</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Registration", "Name, Email, Phone, Password, Photo, Resume", "View all registered users"],
              ["Membership ID", "Auto-generated after verification", "View & edit"],
              ["Email Verification", "Activate via link", "Monitor status"],
              ["Profile Editing", "Update personal & professional info", "Override any field"],
              ["Education", "Add unlimited entries", "Edit any entry"],
              ["Work Experience", "Add unlimited jobs", "Edit any job"],
              ["Skills & Languages", "Manage lists", "Edit lists"],
              ["Resume Upload", "Upload/update anytime", "View/replace"],
              ["Profile Photo", "Update photo", "Replace if needed"],
              ["Profile Preview", "See full preview", "View all details"],
              ["Profile Sharing", "Generate temporary links", "Monitor usage"],
              ["Employer View", "Photo, education, experience, resume", "Track access logs"],
              ["Blocking", "Cannot block", "Block/unblock"],
              ["Dashboard", "View own profile", "Stats & table"],
            ].map(([feature, member, admin]) => (
              <tr key={feature} className="odd:bg-white even:bg-gray-50">
                <td className="border border-gray-200 px-4 py-2 font-medium text-gray-900">{feature}</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">{member}</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">{admin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderView = () => {
    if (view === VIEWS.SHARE && shareToken) {
      return (
        <main className="min-h-screen bg-slate-100 py-10 px-4">
          <ShareProfileView token={shareToken} />
        </main>
      );
    }

    return (
      <div className="min-h-screen bg-slate-100 py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-10">
          {heroContent}
          <nav className="flex flex-wrap justify-center gap-3 text-sm">
            <button className="nav-pill" onClick={() => setView(VIEWS.REGISTER)}>
              Register
            </button>
            <button className="nav-pill" onClick={() => setView(VIEWS.LOGIN)}>
              Member Login
            </button>
            <button className="nav-pill" onClick={() => setView(VIEWS.VERIFY)}>
              Verify Email
            </button>
            <button className="nav-pill" onClick={() => setView(VIEWS.ADMIN_LOGIN)}>
              Admin Login
            </button>
            <a
              href={`${API_BASE}/api/verify?token=`}
              className="nav-pill"
              target="_blank"
              rel="noreferrer"
            >
              API: Verify Endpoint
            </a>
          </nav>

          {view === VIEWS.REGISTER && <RegistrationForm onSwitchToLogin={() => setView(VIEWS.LOGIN)} />}
          {view === VIEWS.LOGIN && (
            userToken ? (
              <div className="bg-white rounded-xl shadow p-6 text-center">
                <p className="text-gray-700 mb-4">You are already signed in.</p>
                <div className="flex gap-3 justify-center">
                  <button className="primary-btn" onClick={() => setView(VIEWS.PROFILE)}>
                    Go to Profile
                  </button>
                  <button className="secondary-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <LoginForm
                onSuccess={(token) => {
                  localStorage.setItem("socrp_user_token", token);
                  setUserToken(token);
                  setView(VIEWS.PROFILE);
                }}
                onSwitchToRegister={() => setView(VIEWS.REGISTER)}
              />
            )
          )}

          {view === VIEWS.VERIFY && <VerifyAccount />}

          {view === VIEWS.PROFILE && (
            userToken ? (
              profileLoading ? (
                <div className="bg-white rounded-xl shadow p-6 text-center">Loading profile...</div>
              ) : profile ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold text-gray-900">Member Workspace</h2>
                    <button className="secondary-btn" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                  <ProfileEditor token={userToken} profile={profile} onRefresh={loadProfile} />
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow p-6 text-center">
                  <p className="text-gray-700">We couldn't load your profile. Try signing in again.</p>
                  <button className="primary-btn mt-4" onClick={() => setView(VIEWS.LOGIN)}>
                    Back to Login
                  </button>
                </div>
              )
            ) : (
              <div className="bg-white rounded-xl shadow p-6 text-center">
                <p className="text-gray-700">Please sign in to manage your profile.</p>
                <button className="primary-btn mt-4" onClick={() => setView(VIEWS.LOGIN)}>
                  Member Login
                </button>
              </div>
            )
          )}

          {view === VIEWS.ADMIN_LOGIN && (
            adminToken ? (
              <div className="bg-white rounded-xl shadow p-6 text-center">
                <p className="text-gray-700 mb-4">You are already authenticated as an administrator.</p>
                <div className="flex gap-3 justify-center">
                  <button className="primary-btn" onClick={() => setView(VIEWS.ADMIN_PANEL)}>
                    Go to Admin Panel
                  </button>
                  <button className="secondary-btn" onClick={handleAdminLogout}>
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <AdminLogin
                onSuccess={(token) => {
                  localStorage.setItem("socrp_admin_token", token);
                  setAdminToken(token);
                  setView(VIEWS.ADMIN_PANEL);
                }}
              />
            )
          )}

          {view === VIEWS.ADMIN_PANEL && (
            adminToken ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold text-gray-900">Admin Control Center</h2>
                  <button className="secondary-btn" onClick={handleAdminLogout}>
                    Logout
                  </button>
                </div>
                <AdminDashboard token={adminToken} />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow p-6 text-center">
                <p className="text-gray-700">Admin session expired. Please sign in again.</p>
                <button className="primary-btn mt-4" onClick={() => setView(VIEWS.ADMIN_LOGIN)}>
                  Admin Login
                </button>
              </div>
            )
          )}

          {featureMatrix}
        </div>
      </div>
    );
  };

  return renderView();
}

export default App;
