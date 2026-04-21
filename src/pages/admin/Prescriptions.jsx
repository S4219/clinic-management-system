import { useEffect, useState, useCallback } from 'react'
import { Search, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import AdminLayout from '../../layouts/AdminLayout'
import Pagination from '../../components/shared/Pagination'
import { ModalShell } from '../../components/shared/Modal'
import ConfirmModal from '../../components/shared/ConfirmModal'
import toast from 'react-hot-toast'

const PAGE_SIZE = 10

export default function AdminPrescriptions() {
  const [rows,     setRows]     = useState([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [expanded,   setExpanded]   = useState(null)
  const [viewRx,     setViewRx]     = useState(null)
  const [delTarget,  setDelTarget]  = useState(null)
  const [deleting,   setDeleting]   = useState(false)

  const fetch = useCallback(async (p = page) => {
    setLoading(true)
    const from = (p-1)*PAGE_SIZE, to = from+PAGE_SIZE-1

    let q = supabase.from('prescriptions')
      .select(`
        prescription_id, diagnosis, instructions, date,
        patients ( name ),
        doctors  ( name ),
        prescription_medicines ( medicine_id, medicine_name, dosage, frequency, duration )
      `, { count: 'exact' })
      .order('date', { ascending: false })
      .range(from, to)

    if (search)
      q = q.ilike('diagnosis', `%${search}%`)

    const { data, count, error } = await q
    if (error) toast.error(error.message)
    else { setRows(data??[]); setTotal(count??0) }
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetch(page) }, [page])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetch(1) }, 300)
    return () => clearTimeout(t)
  }, [search])

  function toggleExpand(id) {
    setExpanded(prev => prev === id ? null : id)
  }

  async function confirmDelete() {
    setDeleting(true)
    await supabase.from('prescription_medicines').delete().eq('prescription_id', delTarget.prescription_id)
    const { error } = await supabase.from('prescriptions').delete().eq('prescription_id', delTarget.prescription_id)
    setDeleting(false)
    if (error) { toast.error(error.message); return }
    toast.success('Prescription deleted')
    setDelTarget(null); fetch(page)
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div><h1 className="page-title">Prescriptions</h1><p className="page-sub">{total} prescriptions on record</p></div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search diagnosis…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="th w-8"></th>
                <th className="th">Date</th>
                <th className="th">Patient</th>
                <th className="th">Doctor</th>
                <th className="th">Diagnosis</th>
                <th className="th">Medicines</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({length:5}).map((_,i)=>(
                    <tr key={i}><td colSpan={7}><div className="h-5 m-4 bg-gray-100 animate-pulse rounded"/></td></tr>
                  ))
                : rows.length===0
                  ? <tr><td colSpan={7} className="text-center py-14 text-sm text-gray-400">No prescriptions found</td></tr>
                  : rows.map(r => {
                      const isOpen = expanded === r.prescription_id
                      return (
                        <>
                          <tr key={r.prescription_id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="td">
                              {(r.prescription_medicines?.length ?? 0) > 0 && (
                                <button onClick={() => toggleExpand(r.prescription_id)}
                                  className="text-gray-400 hover:text-gray-600 transition-colors">
                                  {isOpen
                                    ? <ChevronDown className="w-4 h-4"/>
                                    : <ChevronRight className="w-4 h-4"/>}
                                </button>
                              )}
                            </td>
                            <td className="td text-gray-600">{r.date}</td>
                            <td className="td font-medium text-gray-900">{r.patients?.name??'—'}</td>
                            <td className="td text-gray-600">{r.doctors?.name??'—'}</td>
                            <td className="td text-gray-700 max-w-[180px] truncate" title={r.diagnosis??''}>{r.diagnosis||'—'}</td>
                            <td className="td">
                              <span className="badge-purple">{r.prescription_medicines?.length??0} medicine{r.prescription_medicines?.length!==1?'s':''}</span>
                            </td>
                            <td className="td">
                              <div className="flex gap-1">
                                <button onClick={() => setViewRx(r)} className="btn-ghost text-xs py-1 px-2">View</button>
                                <button onClick={() => setDelTarget(r)} className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
                              </div>
                            </td>
                          </tr>

                          {isOpen && (r.prescription_medicines?.length??0) > 0 && (
                            <tr key={`${r.prescription_id}-expand`} className="bg-blue-50/40">
                              <td colSpan={7} className="px-8 py-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Prescribed Medicines</p>
                                <table className="w-full">
                                  <thead>
                                    <tr>
                                      <th className="th py-1.5 bg-transparent text-left">Medicine</th>
                                      <th className="th py-1.5 bg-transparent text-left">Dosage</th>
                                      <th className="th py-1.5 bg-transparent text-left">Frequency</th>
                                      <th className="th py-1.5 bg-transparent text-left">Duration</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {r.prescription_medicines.map(m => (
                                      <tr key={m.medicine_id}>
                                        <td className="td py-2 font-medium text-gray-800">{m.medicine_name}</td>
                                        <td className="td py-2 text-gray-600">{m.dosage||'—'}</td>
                                        <td className="td py-2 text-gray-600">{m.frequency||'—'}</td>
                                        <td className="td py-2 text-gray-600">{m.duration||'—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })
              }
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={p=>{setPage(p);fetch(p)}} />
      </div>

      {/* Full prescription view modal */}
      {viewRx && (
        <ModalShell title="Prescription Details" subtitle={`${viewRx.patients?.name} · ${viewRx.date}`} onClose={() => setViewRx(null)} size="lg">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs font-semibold text-gray-400 uppercase">Patient</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{viewRx.patients?.name??'—'}</p></div>
              <div><p className="text-xs font-semibold text-gray-400 uppercase">Doctor</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{viewRx.doctors?.name??'—'}</p></div>
              <div><p className="text-xs font-semibold text-gray-400 uppercase">Date</p>
                <p className="text-sm text-gray-800 mt-1">{viewRx.date}</p></div>
            </div>

            {viewRx.diagnosis && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Diagnosis</p>
                <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">{viewRx.diagnosis}</p>
              </div>
            )}

            {viewRx.instructions && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Instructions</p>
                <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3 leading-relaxed">{viewRx.instructions}</p>
              </div>
            )}

            {(viewRx.prescription_medicines?.length??0) > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Medicines</p>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="th">Medicine</th><th className="th">Dosage</th>
                        <th className="th">Frequency</th><th className="th">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {viewRx.prescription_medicines.map(m => (
                        <tr key={m.medicine_id}>
                          <td className="td font-medium">{m.medicine_name}</td>
                          <td className="td text-gray-600">{m.dosage||'—'}</td>
                          <td className="td text-gray-600">{m.frequency||'—'}</td>
                          <td className="td text-gray-600">{m.duration||'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
            <button className="btn-secondary" onClick={() => setViewRx(null)}>Close</button>
          </div>
        </ModalShell>
      )}

      {delTarget && (
        <ConfirmModal
          title="Delete Prescription"
          message={`Delete prescription for "${delTarget.patients?.name}"? This will also remove all associated medicines and cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDelTarget(null)}
          loading={deleting}
        />
      )}
    </AdminLayout>
  )
}
