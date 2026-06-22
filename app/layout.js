import './globals.css';
import { Providers } from '../components/Providers';
import PWA from '../components/PWA';

export const metadata = {
  title: 'Gauras Mart',
  description: 'Manufacturer–Distributor–Farmer marketplace',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Gauras Mart', statusBarStyle: 'default' },
  icons: {
    icon: '/favicon-32.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  themeColor: '#3f8f5c',
};

// Applies saved theme (dark) + color before first paint to avoid a flash.
const prePaint = `(function(){try{
  if((localStorage.getItem('theme')||'light')==='dark')document.documentElement.classList.add('dark');
  var raw=localStorage.getItem('color');if(raw){var p=JSON.parse(raw);
    var presets={green:['#3f8f5c','#34784d','#163b2b','#edf7f1'],blue:['#2f6fed','#2457c4','#16306e','#eaf1fe'],teal:['#0d9488','#0b7d73','#134e4a','#e6f6f4'],purple:['#7c3aed','#6d28d9','#3b1d72','#f1ebfe'],orange:['#ea7317','#c75f0c','#7a3a06','#fdf0e3']};
    var v=p.kind==='custom'&&p.value?[p.value,p.value,p.value,p.value]:(presets[p.value]||presets.green);
    var r=document.documentElement.style;r.setProperty('--brand',v[0]);r.setProperty('--brand-dark',v[1]);r.setProperty('--brand-deep',v[2]);r.setProperty('--brand-light',v[3]);
  }
}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: prePaint }} />
      </head>
      <body>
        <Providers>
          {children}
          <PWA />
        </Providers>
      </body>
    </html>
  );
}
