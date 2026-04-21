import { Link } from 'react-router-dom'
import {
  Heart, Shield, Clock, Users, Calendar, FileText, FlaskConical,
  CreditCard, Star, Phone, Mail, MapPin, ChevronRight, Menu, X,
  Activity, Stethoscope, Pill, CheckCircle
} from 'lucide-react'
import { useState } from 'react'

const NAV_LINKS = ['Services', 'Features', 'About', 'Contact']

const SERVICES = [
  {
    icon: <Stethoscope className="w-7 h-7 text-blue-600" />,
    title: 'General Consultation',
    desc: 'Comprehensive health assessments and expert medical advice from our experienced physicians.',
    bg: 'bg-blue-50',
  },
  {
    icon: <FlaskConical className="w-7 h-7 text-teal-600" />,
    title: 'Diagnostic Lab',
    desc: 'State-of-the-art laboratory services with fast and accurate test results for all major diagnostics.',
    bg: 'bg-teal-50',
  },
  {
    icon: <Pill className="w-7 h-7 text-purple-600" />,
    title: 'Pharmacy',
    desc: 'In-house pharmacy stocked with a wide range of medications and 24/7 prescription fulfillment.',
    bg: 'bg-purple-50',
  },
  {
    icon: <Activity className="w-7 h-7 text-rose-500" />,
    title: 'Emergency Care',
    desc: 'Round-the-clock emergency medical services with rapid response and critical care support.',
    bg: 'bg-rose-50',
  },
  {
    icon: <Heart className="w-7 h-7 text-pink-600" />,
    title: 'Cardiology',
    desc: 'Specialized cardiac diagnostics, ECG, echo services, and preventive heart care programs.',
    bg: 'bg-pink-50',
  },
  {
    icon: <Shield className="w-7 h-7 text-green-600" />,
    title: 'Preventive Health',
    desc: 'Routine check-ups, vaccinations, and wellness packages tailored to every age group.',
    bg: 'bg-green-50',
  },
]

const FEATURES = [
  { icon: <Calendar className="w-5 h-5" />, title: 'Smart Scheduling', desc: 'Book and manage appointments online with real-time availability.' },
  { icon: <FileText className="w-5 h-5" />, title: 'Digital Prescriptions', desc: 'Paperless prescriptions with complete medication tracking.' },
  { icon: <CreditCard className="w-5 h-5" />, title: 'Easy Billing', desc: 'Transparent invoicing with multiple payment methods supported.' },
  { icon: <Users className="w-5 h-5" />, title: 'Patient Records', desc: 'Secure, centralized medical history and record management.' },
  { icon: <FlaskConical className="w-5 h-5" />, title: 'Lab Reports Online', desc: 'View and download lab results from anywhere, anytime.' },
  { icon: <Shield className="w-5 h-5" />, title: 'Role-Based Access', desc: 'Separate dashboards for Admin, Doctors, and Receptionists.' },
]

const STATS = [
  { value: '5,000+', label: 'Patients Served' },
  { value: '50+', label: 'Specialist Doctors' },
  { value: '15+', label: 'Departments' },
  { value: '99%', label: 'Patient Satisfaction' },
]

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Patient', text: 'The online appointment system is incredibly convenient. I got my reports in minutes!', rating: 5 },
  { name: 'Dr. Arjun Mehta', role: 'Cardiologist', text: 'The doctor dashboard makes managing patient records effortless and efficient.', rating: 5 },
  { name: 'Rahul Verma', role: 'Patient', text: 'Professional staff, clean facilities, and transparent billing. Highly recommended.', rating: 5 },
]

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">ClinicMS</span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(link => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {link}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="btn-primary text-sm"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden p-2 text-gray-500" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-2">
            {NAV_LINKS.map(link => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                {link}
              </a>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <Link to="/login" className="btn-secondary w-full justify-center">Sign In</Link>
              <Link to="/login" className="btn-primary w-full justify-center">Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-teal-500 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-white/5" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <CheckCircle className="w-3.5 h-3.5" />
            Trusted by 5,000+ patients
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
            Modern Healthcare,<br />
            <span className="text-blue-200">Simplified Management</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            A complete clinic management system for patients, doctors, and staff — appointments, prescriptions, billing, and lab reports in one place.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20"
            >
              Access Dashboard
              <ChevronRight className="w-4 h-4" />
            </Link>
            <a
              href="#services"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
            >
              Explore Services
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative bg-white/10 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {STATS.map(s => (
              <div key={s.label}>
                <div className="text-2xl md:text-3xl font-bold">{s.value}</div>
                <div className="text-xs text-blue-200 mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">What We Offer</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900">Comprehensive Medical Services</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
              From routine check-ups to specialized diagnostics, we provide end-to-end care with the latest medical technology.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(s => (
              <div key={s.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className={`w-14 h-14 rounded-xl ${s.bg} flex items-center justify-center mb-4`}>
                  {s.icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Left — text */}
            <div>
              <span className="text-xs font-semibold text-teal-600 uppercase tracking-widest">Platform Features</span>
              <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                Everything Your Clinic Needs in One Dashboard
              </h2>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                ClinicMS streamlines every workflow — from booking appointments to generating invoices — so your staff can focus on patient care, not paperwork.
              </p>
              <ul className="mt-8 space-y-4">
                {FEATURES.map(f => (
                  <li key={f.title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                      {f.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{f.title}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">{f.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link to="/login" className="btn-primary mt-8 inline-flex">
                Start Managing <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Right — visual card mock */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-teal-500 rounded-3xl p-0.5 shadow-2xl shadow-blue-200">
                <div className="bg-white rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Today's Summary</p>
                      <p className="text-lg font-bold text-gray-900 mt-0.5">Admin Dashboard</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Appointments', value: '24', color: 'bg-blue-50 text-blue-600' },
                      { label: 'Patients', value: '312', color: 'bg-teal-50 text-teal-600' },
                      { label: 'Pending Bills', value: '8', color: 'bg-yellow-50 text-yellow-600' },
                      { label: 'Lab Tests', value: '15', color: 'bg-purple-50 text-purple-600' },
                    ].map(item => (
                      <div key={item.label} className={`rounded-xl p-3 ${item.color.split(' ')[0]}`}>
                        <p className="text-xs text-gray-500">{item.label}</p>
                        <p className={`text-2xl font-bold mt-0.5 ${item.color.split(' ')[1]}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-4 space-y-2.5">
                    {[
                      { name: 'Fatima Khan', time: '09:30', doctor: 'Dr. Mehta', status: 'Scheduled' },
                      { name: 'Rohan Das', time: '10:15', doctor: 'Dr. Patel', status: 'Completed' },
                      { name: 'Ananya Roy', time: '11:00', doctor: 'Dr. Singh', status: 'Scheduled' },
                    ].map(apt => (
                      <div key={apt.name} className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{apt.name}</p>
                          <p className="text-xs text-gray-400">{apt.doctor} · {apt.time}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${apt.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {apt.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg px-4 py-3 border border-gray-100 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Fully HIPAA Ready</p>
                  <p className="text-xs text-gray-400">Secure & Compliant</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="py-20 bg-gradient-to-br from-blue-700 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-semibold text-blue-200 uppercase tracking-widest">About ClinicMS</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold">Built for Modern Healthcare</h2>
          <p className="mt-4 text-blue-100 text-sm max-w-2xl mx-auto leading-relaxed">
            ClinicMS was designed to eliminate paper-based processes, reduce administrative overhead, and improve patient outcomes through intelligent data management and streamlined workflows.
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { icon: <Clock className="w-6 h-6" />, title: 'Save Time', desc: 'Reduce appointment scheduling time by 70% with our smart booking system.' },
              { icon: <Shield className="w-6 h-6" />, title: 'Data Security', desc: 'Patient records protected with enterprise-grade security and role-based access.' },
              { icon: <Users className="w-6 h-6" />, title: 'Team Collaboration', desc: 'Doctors, receptionists and admins work seamlessly on a single platform.' },
            ].map(item => (
              <div key={item.title} className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-blue-100 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Testimonials</span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">What People Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed italic">"{t.text}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Get In Touch</span>
              <h2 className="mt-2 text-3xl font-bold text-gray-900">We're Here to Help</h2>
              <p className="mt-3 text-gray-500 text-sm leading-relaxed max-w-md">
                Have questions about ClinicMS? Reach out to our support team and we'll get back to you within 24 hours.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: <Phone className="w-5 h-5 text-blue-600" />, label: 'Phone', value: '+91 98765 43210' },
                  { icon: <Mail className="w-5 h-5 text-blue-600" />, label: 'Email', value: 'support@clinicms.com' },
                  { icon: <MapPin className="w-5 h-5 text-blue-600" />, label: 'Address', value: '123 Health Street, Mumbai, MH 400001' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                      <p className="text-sm font-medium text-gray-800 mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-5">Send a Message</h3>
              <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name</label>
                    <input className="input" placeholder="John" />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input className="input" placeholder="Doe" />
                  </div>
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="label">Message</label>
                  <textarea className="input resize-none" rows={4} placeholder="How can we help you?" />
                </div>
                <button type="submit" className="btn-primary w-full justify-center">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-lg">ClinicMS</span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                A modern, comprehensive clinic management system designed to streamline healthcare operations.
              </p>
            </div>
            <div>
              <p className="text-white font-semibold text-sm mb-4">Quick Links</p>
              <ul className="space-y-2">
                {NAV_LINKS.map(link => (
                  <li key={link}>
                    <a href={`#${link.toLowerCase()}`} className="text-sm hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold text-sm mb-4">System Access</p>
              <ul className="space-y-2">
                {['Admin Portal', 'Doctor Portal', 'Receptionist Portal'].map(item => (
                  <li key={item}>
                    <Link to="/login" className="text-sm hover:text-white transition-colors">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-xs">© {new Date().getFullYear()} ClinicMS. All rights reserved.</p>
            <div className="flex gap-6">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(item => (
                <a key={item} href="#" className="text-xs hover:text-white transition-colors">{item}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
