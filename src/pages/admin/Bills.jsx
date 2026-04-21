import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Pencil, Printer } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import AdminLayout from '../../layouts/AdminLayout'
import { ModalShell, ModalActions } from '../../components/shared/Modal'
import Pagination from '../../components/shared/Pagination'
import { printBill } from '../../utils/printBill'
import toast from 'react-hot-toast'

const PAGE_SIZE = 10
const STATUS_BADGE = { paid:'badge-green', pending:'badge-yellow', overdue:'badge-red', partial:'badge-blue' }
const PAYMENT_METHODS = ['cash','card','upi','insurance','bank_transfer']
const PAYMENT_STATUSES = ['pending','paid','partial','overdue']

const BILL_EMPTY = {
  bill_id:'', patient_id:'', appointment_id:'',
  consultation_fee:'', lab_charges:'', medicine_charges:'', other_charges:'',
  payment_status:'pending', payment_method:'',
}

function calcTotal(f) {
  return ['consultation_fee','lab_charges','medicine_charges','other_charges']
    .reduce((s,k) => s + (parseFloat(f[k])||0), 0)
}

function invoiceNum() {
  return `INV-${Date.now().toString(36).toUpperCase()}`
}

export default function AdminBills() {
  const [rows,     setRows]     = useState([])
  const [total,    setTotal]    = useState(0)
  const [patients, setPatients] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [statusF,  setStatusF]  = useState('')

  const [modal,    setModal]    = useState(null)   // 'add' | 'edit'
  const [selected, setSelected] = useState(BILL_EMPTY)
  const [aptOpts,  setAptOpts]  = useState([])
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    supabase.from('patients').select('patient_id,name').order('name')
      .then(({data}) => setPatients(data??[]))
  }, [])

  // Load appointments for the selected patient in the modal
  useEffect(() => {
    if (!selected.patient_id) { setAptOpts([]); return }
    supabase.from('appointments')
      .select('appointment_id,date,time,doctors(name)')
      .eq('patient_id', selected.patient_id)
      .order('date', { ascending:false }).limit(20)
      .then(({data}) => setAptOpts(data??[]))
  }, [selected.patient_id])

  const fetch = useCallback(async (p = page) => {
    setLoading(true)
    const from = (p-1)*PAGE_SIZE, to = from+PAGE_SIZE-1

    let q = supabase.from('bills')
      .select('*, patients(name)', { count:'exact' })
      .order('date', { ascending:false })
      .range(from, to)

    if (search)  q = q.ilike('invoice_number', `%${search}%`)
    if (statusF) q = q.eq('payment_status', statusF)

    const { data, count, error } = await q
    if (error) toast.error(error.message)
    else { setRows(data??[]); setTotal(count??0) }
    setLoading(false)
  }, [page, search, statusF])

  useEffect(() => { fetch(page) }, [page])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetch(1) }, 300)
    return () => clearTimeout(t)
  }, [search, statusF])

  async function handleSave(e) {
    e.preventDefault()
    const tot = calcTotal(selected)
    if (modal === 'add' && !selected.bill_id.trim()) { toast.error('Bill ID is required'); return }
    if (!selected.patient_id)    { toast.error('Select a patient'); return }
    if (tot <= 0)                  { toast.error('Enter at least one charge'); return }
    setSaving(true)

    const payload = {
      ...(modal === 'add' ? { bill_id: selected.bill_id } : {}),
      patient_id:       selected.patient_id,
      appointment_id:   selected.appointment_id || null,
      invoice_number:   modal === 'add' ? invoiceNum() : selected.invoice_number,
      consultation_fee: parseFloat(selected.consultation_fee)  || 0,
      lab_charges:      parseFloat(selected.lab_charges)       || 0,
      medicine_charges: parseFloat(selected.medicine_charges)  || 0,
      other_charges:    parseFloat(selected.other_charges)     || 0,
      total_amount:     tot,
      payment_status:   selected.payment_status,
      payment_method:   selected.payment_method || null,
      date:             modal === 'add' ? new Date().toISOString().split('T')[0] : selected.date,
    }

    const { error } = modal === 'add'
      ? await supabase.from('bills').insert([payload])
      : await supabase.from('bills').update(payload).eq('bill_id', selected.bill_id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(modal === 'add' ? 'Bill generated' : 'Bill updated')
    setModal(null); fetch(page)
  }

  const set = (k,v) => setSelected(s => ({ ...s, [k]: v }))
  const tot = calcTotal(selected)

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div><h1 className="page-title">Billing</h1><p className="page-sub">{total} invoices total</p></div>
        <button onClick={() => { setSelected(BILL_EMPTY); setModal('add') }} className="btn-primary text-sm self-start">
          <Plus className="w-4 h-4" /> Generate Bill
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search invoice #…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-36" value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All Status</option>
          {PAYMENT_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="th">Bill ID</th><th className="th">Patient</th>
                <th className="th">Date</th><th className="th">Consult</th>
                <th className="th">Lab</th><th className="th">Meds</th>
                <th className="th">Other</th><th className="th">Total</th>
                <th className="th">Method</th><th className="th">Status</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({length:5}).map((_,i)=>(
                    <tr key={i}><td colSpan={11}><div className="h-5 m-4 bg-gray-100 animate-pulse rounded"/></td></tr>
                  ))
                : rows.length===0
                  ? <tr><td colSpan={11} className="text-center py-14 text-sm text-gray-400">No bills found</td></tr>
                  : rows.map(r => (
                      <tr key={r.bill_id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="td"><code className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{r.bill_id||'—'}</code></td>
                        <td className="td font-medium text-gray-900">{r.patients?.name??'—'}</td>
                        <td className="td text-gray-600">{r.date}</td>
                        <td className="td text-gray-600">₹{(r.consultation_fee||0).toLocaleString()}</td>
                        <td className="td text-gray-600">₹{(r.lab_charges||0).toLocaleString()}</td>
                        <td className="td text-gray-600">₹{(r.medicine_charges||0).toLocaleString()}</td>
                        <td className="td text-gray-600">₹{(r.other_charges||0).toLocaleString()}</td>
                        <td className="td font-semibold text-gray-900">₹{(r.total_amount||0).toLocaleString()}</td>
                        <td className="td text-gray-600 capitalize">{r.payment_method||'—'}</td>
                        <td className="td"><span className={STATUS_BADGE[r.payment_status]??'badge-gray'}>{r.payment_status}</span></td>
                        <td className="td">
                          <div className="flex gap-1">
                            <button onClick={() => { setSelected(r); setModal('edit') }} className="btn-ghost p-1.5" title="Edit"><Pencil className="w-4 h-4"/></button>
                            <button onClick={() => printBill(r)} className="btn-ghost p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50" title="Print"><Printer className="w-4 h-4"/></button>
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
        <ModalShell title={modal==='add'?'Generate Bill':'Edit Bill'} onClose={()=>setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            {modal==='add' && (
              <div><label className="label">Bill ID *</label>
                <input className="input" value={selected.bill_id} onChange={e=>set('bill_id',e.target.value)} placeholder="e.g. BILL-001" /></div>
            )}
            <div><label className="label">Patient *</label>
              <select className="input" value={selected.patient_id} onChange={e=>set('patient_id',e.target.value)}>
                <option value="">Select patient…</option>
                {patients.map(p=><option key={p.patient_id} value={p.patient_id}>{p.name}</option>)}
              </select></div>
            <div><label className="label">Linked Appointment <span className="text-gray-400 font-normal">(optional)</span></label>
              <select className="input" value={selected.appointment_id||''} onChange={e=>set('appointment_id',e.target.value)} disabled={!selected.patient_id}>
                <option value="">None</option>
                {aptOpts.map(a=>(
                  <option key={a.appointment_id} value={a.appointment_id}>
                    {a.date}{a.time?` · ${a.time}`:''}{a.doctors?.name?` · ${a.doctors.name}`:''}
                  </option>
                ))}
              </select></div>

            <div>
              <label className="label mb-2">Charges (₹)</label>
              <div className="grid grid-cols-2 gap-3">
                {[['consultation_fee','Consultation'],['lab_charges','Lab'],['medicine_charges','Medicines'],['other_charges','Other']].map(([k,label])=>(
                  <div key={k}>
                    <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                    <input className="input" type="number" min="0" step="0.01" placeholder="0.00"
                      value={selected[k]} onChange={e=>set(k,e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Amount</span>
              <span className="text-xl font-bold text-blue-700">
                ₹{tot.toLocaleString('en-IN',{minimumFractionDigits:2})}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Payment Status</label>
                <select className="input" value={selected.payment_status} onChange={e=>set('payment_status',e.target.value)}>
                  {PAYMENT_STATUSES.map(s=><option key={s} value={s} className="capitalize">{s}</option>)}
                </select></div>
              <div><label className="label">Payment Method</label>
                <select className="input" value={selected.payment_method||''} onChange={e=>set('payment_method',e.target.value)}>
                  <option value="">Select…</option>
                  {PAYMENT_METHODS.map(m=><option key={m} value={m} className="capitalize">{m.replace('_',' ')}</option>)}
                </select></div>
            </div>

            <ModalActions onClose={()=>setModal(null)} loading={saving} submitLabel={modal==='add'?'Generate Bill':'Save Changes'} />
          </form>
        </ModalShell>
      )}
    </AdminLayout>
  )
}
