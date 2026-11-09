import { useEffect, useState } from 'react';
import { FiUsers, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import API from '../../services/api';
import Loader from '../../components/common/Loader';

function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/auth/users?page=${page}&limit=10`);
      setUsers(data.users || []);
      setPages(data.pages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you entirely certain you want to revoke account permission and purge this user context?')) return;
    try {
      await API.delete(`/auth/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (error) {
      alert(error.response?.data?.message || 'Access pipeline operation failure');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen py-12 bg-slate-50 text-slate-800 antialiased">
      <div className="max-w-5xl mx-auto px-6">

        {/* ── HEADER PANEL ── */}
        <div className="mb-8 border-b border-slate-200/60 pb-5">
          <h1 className="text-[#1B4332] text-2xl font-black tracking-tight flex items-center gap-2">
            <FiUsers className="text-[#2D6A4F]" size={24} /> Identity Management
          </h1>
          <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">
            Review user roles structures access nodes or delete records systems
          </p>
        </div>

        {/* ── CLIENT SYSTEM IDENTITIES TABLE ── */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="p-4 pl-6">Client Identity</th>
                  <th className="p-4">Email Coordinates</th>
                  <th className="p-4">System Access Level</th>
                  <th className="p-4">Contact Protocol</th>
                  <th className="p-4 pr-6 text-right">Revoke Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50/40 transition">
                      
                      {/* Full Name block */}
                      <td className="p-4 pl-6">
                        <p className="text-slate-900 font-black text-sm tracking-tight">{user.name}</p>
                        <p className="text-[9px] text-slate-400 font-mono tracking-wider">UID: {user._id.slice(-6).toUpperCase()}</p>
                      </td>

                      {/* Email coordinate paths data strings */}
                      <td className="p-4 text-slate-600 font-medium text-xs">
                        {user.email}
                      </td>

                      {/* Explicit Access Level System Rules */}
                      <td className="p-4">
                        <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                          user.role === 'admin'
                            ? 'bg-[#1B4332]/5 text-[#1B4332]'
                            : 'bg-blue-50 text-blue-600'
                        }`}>
                          {user.role}
                        </span>
                      </td>

                      {/* Mobile telecommunications vectors */}
                      <td className="p-4 text-slate-500 text-xs font-mono">
                        {user.phone || '—'}
                      </td>

                      {/* Administrative management controls tools */}
                      <td className="p-4 pr-6 text-right">
                        {user.role !== 'admin' ? (
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Purge User Account"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 pr-2 select-none uppercase tracking-wider">Root Protected</span>
                        )}
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-slate-400 text-xs">
                      No customer account nodes profiles populated inside database clusters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── PAGINATION SYSTEM CONTROLS ── */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition"
            >
              <FiChevronLeft size={16} />
            </button>
            
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-xl text-xs font-black transition ${
                  p === page 
                    ? 'bg-[#2D6A4F] text-white shadow-sm shadow-[#2D6A4F]/20' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage(prev => Math.min(prev + 1, pages))}
              disabled={page === pages}
              className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminUsers;