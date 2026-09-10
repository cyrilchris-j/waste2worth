import { Volume2, Battery, Laptop, Cpu, Cable, Monitor, AlertTriangle, Recycle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { localizedSafetyGuides, type Language } from '../locales/translations';
import type { SafetyGuide } from '../types/domain';

function renderSafetyIcon(icon: string, size = 18) {
  switch (icon) {
    case 'battery':
      return <Battery size={size} />;
    case 'laptop':
      return <Laptop size={size} />;
    case 'cpu':
      return <Cpu size={size} />;
    case 'cable':
      return <Cable size={size} />;
    case 'monitor':
      return <Monitor size={size} />;
    case 'alert':
      return <AlertTriangle size={size} />;
    case 'recycle':
      return <Recycle size={size} />;
    default:
      return <Recycle size={size} />;
  }
}

export function SafetyLibrary({ guides: _guides }: { guides: SafetyGuide[] }) {
  const [language, setLanguage] = useState<Language>('en');
  const localizedGuides = localizedSafetyGuides(language);
  const [active, setActive] = useState(localizedGuides[0]);

  useEffect(() => {
    const select = document.querySelector('.language select');
    const onChange = () => setLanguage(((select as HTMLSelectElement)?.value as Language) || 'en');
    select?.addEventListener('change', onChange);
    return () => select?.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    setActive((current) => localizedGuides.find((guide) => guide.category === current.category) ?? localizedGuides[0]);
  }, [language]);

  const listen = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(`${active.title}. ${active.instructions.join('. ')}`));
  };

  return (
    <section>
      <div className="section-heading">
        <div>
          <div className="eyebrow">FIELD NOTES</div>
          <h2>Safety, in plain language.</h2>
        </div>
        <button className="icon-button" title="Listen to guidance" onClick={listen}>
          <Volume2 size={18} /> Listen
        </button>
      </div>
      <div className="safety-layout">
        <nav className="safety-tabs">
          {localizedGuides.map((guide) => (
            <button
              className={active.category === guide.category ? 'active' : ''}
              key={guide.category}
              onClick={() => setActive(guide)}
            >
              <span className="inline-flex items-center justify-center mr-1.5">{renderSafetyIcon(guide.icon, 16)}</span>
              {guide.category}
            </button>
          ))}
        </nav>
        <div className="safety-content">
          <div className="safety-icon">{renderSafetyIcon(active.icon, 32)}</div>
          <h3>{active.title}</h3>
          <ul>
            {active.instructions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="warning">
            <b>Safety first</b>
            <span>{active.warnings.join(' ')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
