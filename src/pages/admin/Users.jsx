import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import AdminLayout from '../../layouts/AdminLayout'
import { ModalShell, ModalActions } from '../../components/shared/Modal'
import ConfirmModal from '../../components/shared/ConfirmModal'
import Pagination from '../../components/shared/Pagination'
import toast from 'react-hot-toast'

const PAGE_SIZE = 10
const ROLES = ['admin','doctor','receptionist']
const ROLE_BADGE = { admin:'badge-purple', doctor:'badge-teal', receptionist:'badge-blue' }
const EMPTY = { user_id:'', name:'', email:'', password_hash:'', role:'receptionist', linked_id:'' }

export default function AdminUsers() {
  const [rows,    setRows]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [search,  setSearch]  = useState('')
  const [roleF,   setRoleF]   = useState('')

  const [modal,    setModal]    = useState(null)
  const [selected, setSelected] = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [delTarget, setDelTarget] = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  useEffect(() => {
    supabase.from('doctors').select('doctor_id,name').order('name')
      .then(({data}) => setDoctors(data??[]))
  }, [])

  const fetch = useCallback(async (p = page) => {
    setLoading(true)
    const from = (p-1)*PAGE_SIZE, to = from+PAGE_SIZE-1
    let q = supabase.from('users')
      .select('user_id,name,email,role,linked_id', { count:'exact' })
      .order('name').range(from, to)
    if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    if (roleF)  q = q.eq('role', roleF)
    const { data, count, error } = await q
    if (error) toast.error(error.message)
    else { setRows(data??[]); setTotal(count??0) }
    setLoading(false)
  }, [page, search, roleF])

  useEffect(() => { fetch(page) }, [page])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetch(1) }, 300)
    return () => clearTimeout(t)
  }, [search, roleF])

  async function handleSave(e) {
    e.preventDefault()
    if (modal === 'add' && !selected.user_id.trim()) { toast.error('User ID is required'); return }
    if (!selected.name || !selected.email) { toast.error('Name and email are required'); return }
    if (modal === 'add' && !selected.password_hash) { toast.error('Password is required'); return }
    setSaving(true)
    const payload = {
      ...(modal === 'add' ? { user_id: selected.user_id } : {}),
      name:    selected.name,
      email:   selected.email,
      role:    selected.role,
      linked_id: selected.role === 'doctor' ? (selected.linked_id || null) : null,
      ...(modal === 'add' ? { password_hash: selected.password_hash } : {}),
    }
    const { error } = modal === 'add'
      ? await supabase.from('users').insert([payload])
      : await supabase.from('users').update(payload).eq('user_id', selected.user_id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(modal === 'add' ? 'User created' : 'User updated')
    setModal(null); fetch(page)
  }

  async function confirmDelete() {
    setDeleting(true)
    const { error } = await supabase.from('users').delete().eq('user_id', delTarget.user_id)
    setDeleting(false)
    if (error) { toast.error(error.message); return }
    toast.success('User deleted')
    setDelTarget(null); fetch(page)
  }

  const set = (k,v) => setSelected(s => ({ ...s, [k]: v }))

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div><h1 className="page-title">User Accounts</h1><p className="page-sub">{total} users</p></div>
        <button onClick={() => { setSelected(EMPTY); setModal('add') }} className="btn-primary text-sm self-start">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search name or email…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-36" value={roleF} onChange={e => setRoleF(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r=><option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="th">Name</th><th className="th">Email</th>
                <th className="th">Role</th><th className="th">Linked Doctor</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({length:5}).map((_,i)=>(
                    <tr key={i}><td colSpan={5}><div className="h-5 m-4 bg-gray-100 animate-pulse rounded"/></td></tr>
                  ))
                : rows.length===0
                  ? <tr><td colSpan={5} className="text-center py-14 text-sm text-gray-400">No users found</td></tr>
                  : rows.map(r=>(
                      <tr key={r.user_id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="td font-medium text-gray-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {r.name?.[0]?.toUpperCase()?? '?'}
                            </div>
                            {r.name}
                          </div>
                        </td>
                        <td className="td text-gray-600">{r.email}</td>
                        <td className="td"><span className={ROLE_BADGE[r.role]??'badge-gray capitalize'}>{r.role}</span></td>
                        <td className="td text-gray-500">
                          {r.role==='doctor' && r.linked_id
                            ? doctors.find(d=>d.doctor_id===r.linked_id)?.name ?? r.linked_id
                            : '—'}
                        </td>
                        <td className="td">
                          <div className="flex gap-1">
                            <button onClick={() => { setSelected(r); setModal('edit') }} className="btn-ghost p-1.5"><Pencil className="w-4 h-4"/></button>
                            <button onClick={() => setDelTarget(r)} className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={p=>{setPage(p);fetch(p)}} />
      </div>

      {(modal==='add'||modal==='edit') && (
        <ModalShell title={modal==='add'?'Add User':'Edit User'} onClose={()=>setModal(null)}>
          <form onSubmit={handleSave} className="space-y-3">
            {modal==='add' && (
              <div><label className="label">User ID *</label>
                <input className="input" value={selected.user_id} onChange={e=>set('user_id',e.target.value)} placeholder="e.g. USR-001" /></div>
            )}
            <div><label className="label">Full Name *</label>
              <input className="input" value={selected.name} onChange={e=>set('name',e.target.value)}/></div>
            <div><label className="label">Email *</label>
              <input className="input" type="email" value={selected.email} onChange={e=>set('email',e.target.value)}/></div>
            {modal==='add' && (
              <div><label className="label">Password *</label>
                <input className="input" type="password" value={selected.password_hash} onChange={e=>set('password_hash',e.target.value)} placeholder="Set a password"/></div>
            )}
            <div><label className="label">Role</label>
              <select className="input" value={selected.role} onChange={e=>set('role',e.target.value)}>
                {ROLES.map(r=><option key={r} value={r} className="capitalize">{r}</option>)}
              </select></div>
            {selected.role==='doctor' && (
              <div><label className="label">Link to Doctor Record</label>
                <select className="input" value={selected.linked_id||''} onChange={e=>set('linked_id',e.target.value)}>
                  <option value="">None</option>
                  {doctors.map(d=><option key={d.doctor_id} value={d.doctor_id}>{d.name}</option>)}
                </select></div>
            )}
            <ModalActions onClose={()=>setModal(null)} loading={saving} submitLabel={modal==='add'?'Create User':'Save'} />
          </form>
        </ModalShell>
      )}

      {delTarget && (
        <ConfirmModal
          title="Delete User"
          message={`Delete user "${delTarget.name}"? They will lose all access.`}
          onConfirm={confirmDelete}
          onCancel={()=>setDelTarget(null)}
          loading={deleting}
        />
      )}
    </AdminLayout>
  )
}
