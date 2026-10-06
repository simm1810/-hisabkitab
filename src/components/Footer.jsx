import {
  BriefcaseBusiness,
  Camera,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Smartphone,
} from 'lucide-react';
import LogoMark from './LogoMark';

const quickLinks = ['Home', 'Features', 'Group Split', 'Dashboard', 'Analytics', 'Contact'];

const features = ['AI Trip Planner', 'Expense Split', 'AI Settlement', 'Budget Tracker', 'Expense Analytics'];

const socials = [
  { label: 'Website', icon: Globe2 },
  { label: 'App', icon: Smartphone },
  { label: 'Gallery', icon: Camera },
  { label: 'Business', icon: BriefcaseBusiness },
];

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-teal-100 bg-slate-50 text-teal-800">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark className="h-10 w-10 rounded-lg shadow-card" />
            <h2 className="text-2xl font-bold text-teal-950">HisaabKitaab</h2>
          </div>
          <p className="mt-6 max-w-xs text-sm leading-7 text-slate-600">
            AI-powered group trip planner and smart expense management platform.
          </p>
        </div>

        <nav aria-label="Quick links">
          <h3 className="text-lg font-bold text-teal-950">Quick Links</h3>
          <ul className="mt-5 space-y-3">
            {quickLinks.map((link) => (
              <li key={link}>
                <a href="/" className="text-sm font-medium text-slate-600 transition hover:text-teal-700">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="text-lg font-bold text-teal-950">Features</h3>
          <ul className="mt-5 space-y-3 text-sm font-medium text-slate-700">
            {features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold text-teal-950">Contact</h3>
          <ul className="mt-5 space-y-4 text-sm font-medium text-slate-600">
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-saffron-600" />
              <a href="mailto:support@hisaabkitaab.com" className="transition hover:text-teal-700">
                support@hisaabkitaab.com
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-saffron-600" />
              <a href="tel:+919876543210" className="transition hover:text-teal-700">
                +91 98765 43210
              </a>
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="h-4 w-4 shrink-0 text-saffron-600" />
              <span>Sindhudurg, Maharashtra</span>
            </li>
          </ul>

          <div className="mt-8 flex gap-4">
            {socials.map(({ label, icon: Icon }) => (
              <a
                key={label}
                href="/"
                aria-label={label}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-white shadow-card transition hover:bg-teal-700"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-teal-100 px-5 py-5 text-center text-sm font-medium text-slate-500">
        &copy; 2026 HisaabKitaab | All Rights Reserved
      </div>
    </footer>
  );
}
