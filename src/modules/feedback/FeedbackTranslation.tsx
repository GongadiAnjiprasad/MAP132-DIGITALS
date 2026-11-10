import { useState } from 'react';
import { Languages } from 'lucide-react';
import { api } from '../../api';

type Language = 'te' | 'en';
type Props = { id:string; message:string; sourceLanguage?:string };

export default function FeedbackTranslation({id,message,sourceLanguage}:Props) {
  const originalLanguage:Language|null = sourceLanguage==='te' || /[\u0C00-\u0C7F]/.test(message) ? 'te' : sourceLanguage==='hi' || /[\u0900-\u097F]/.test(message) ? null : 'en';
  const [selected,setSelected] = useState<Language|null>(originalLanguage);
  const [translations,setTranslations] = useState<Partial<Record<Language,string>>>({});
  const [loading,setLoading] = useState<Language|null>(null);
  const [error,setError] = useState('');

  async function chooseLanguage(language:Language) {
    setSelected(language);
    setError('');
    if(language===originalLanguage || translations[language])return;
    setLoading(language);
    try {
      const result=await api.post('/api/translate',{text:message,targetLanguage:language});
      const translated=String(result.data.translatedText||'').trim();
      if(!translated)throw new Error('The translation service returned an empty result.');
      setTranslations(current=>({...current,[language]:translated}));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Translation could not be completed. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  const displayedText=selected===null||selected===originalLanguage?message:translations[selected]||message;
  return <div className="feedback-translation" data-feedback-id={id}>
    <p className="feedback-translation-text">“{displayedText}”</p>
    <div className="feedback-translation-controls" aria-label="Translate feedback">
      <Languages className="feedback-translation-icon" size={13} strokeWidth={1.8} aria-hidden="true" />
      <button type="button" className={selected==='te'?'active':''} aria-label="Translate to Telugu" aria-pressed={selected==='te'} disabled={loading!==null} onClick={()=>chooseLanguage('te')}>T</button>
      <button type="button" className={selected==='en'?'active':''} aria-label="Translate to English" aria-pressed={selected==='en'} disabled={loading!==null} onClick={()=>chooseLanguage('en')}>E</button>
      {loading&&<small role="status">Translating…</small>}
      {error&&<small role="status">{error}</small>}
    </div>
  </div>;
}
