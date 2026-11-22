import { useEffect, useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import API from '../../services/api';
import Loader from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { AdminPage, AdminHeader, Panel, DataTable, EmptyRow } from '../../components/admin/AdminUI';

function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [toDelete, setToDelete] = useState(null); // user jise delete karna hai

  useEffect(() => {
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
    fetchUsers();
  }, [page]);

  const confirmDelete = async () => {
    const user = toDelete;
    setToDelete(null);
    try {
      await API.delete(`/auth/users/${user._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      toast.success('User deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete user');
    }
  };

  if (loading) return <Loader />;

  return (
    <AdminPage narrow>
      <AdminHeader title="Users" subtitle="Registered accounts. Admin accounts cannot be deleted here." />

      <Panel flush>
        <DataTable
          minWidth={0}
          columns={[
            { label: 'Name' }, { label: 'Email', hideOnMobile: true }, { label: 'Role' }, { label: 'Phone', hideOnMobile: true }, { label: '', align: 'right' },
          ]}
        >
          {users.length > 0 ? users.map((user) => (
            <tr key={user._id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{user.name}</p>
                <p className="break-all text-xs text-slate-500 sm:hidden">{user.email}</p>
              </td>
              <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{user.email}</td>
              <td className="px-4 py-3">
                <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                  user.role === 'admin' ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {user.role === 'admin' ? 'Admin' : 'Customer'}
                </span>
              </td>
              <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{user.phone || '—'}</td>
              <td className="px-4 py-3 text-right">
                {user.role !== 'admin' && (
                  <button
                    type="button"
                    onClick={() => setToDelete(user)}
                    aria-label={`Delete ${user.name}`}
                    className="rounded-md p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <FiTrash2 size={16} />
                  </button>
                )}
              </td>
            </tr>
          )) : <EmptyRow cols={5} text="No users found." />}
        </DataTable>
      </Panel>

      <Pagination page={page} totalPages={pages} onChange={setPage} />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this user?"
        message={`${toDelete?.name || 'This user'} will lose access and the account will be removed.`}
        confirmLabel="Delete"
        cancelLabel="Keep"
        danger
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </AdminPage>
  );
}

export default AdminUsers;
