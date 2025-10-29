import { useState } from "react";
import { verifyAccount } from "../api";

export default function VerifyAccount() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await verifyAccount(token.trim());
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-xl w-full">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900">Verify Your Email</h2>
      <p className="text-gray-600 mb-6">
        Paste the verification token from your email to activate your membership. Tokens expire after 24 hours.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          placeholder="Paste verification token"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm">
            Membership activated! ID: <strong>{result.membershipId}</strong>
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !token.trim()}
          className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
    </div>
  );
}
