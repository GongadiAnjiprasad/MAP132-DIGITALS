export type FeedbackResponseType = 'positive' | 'suggestion' | 'complaint' | 'enquiry' | 'general';
export type FeedbackLanguage = 'te' | 'te-latn' | 'hi' | 'en';

export function createFeedbackResponse(message: string, rating: number) {
  const source = String(message || '').trim();
  const lower = source.toLowerCase();
  const hasTeluguScript = /[\u0C00-\u0C7F]/.test(source);
  const hasHindiScript = /[\u0900-\u097F]/.test(source);
  const romanTelugu = /\b(mee|mi|mana|maaku|memu|undhi|undi|bagundi|baagundi|nachindi|nachindhi|chala|chaala|cheyandi|cheyochu|avuthundi|avuthundhi|entha|ela|kosam|kani|inka|ivvandi|chesam|chesaru|super)\b/i.test(source);
  const language: FeedbackLanguage = hasTeluguScript ? 'te' : hasHindiScript ? 'hi' : romanTelugu ? 'te-latn' : 'en';
  const enquiry = /\?|\b(price|pricing|cost|charge|rate|quote|how much|how to|when can|available|availability|contact|reach out|details|booking|book|order|portfolio|can you|could you|do you|is it possible|entha|rate entha|ela book|ela contact|cheyadaniki|cheyyadaniki|details kavali|contact ela)\b|ఎంత|ధర|రేటు|ఎలా|ఎప్పుడు|కాంటాక్ట్|వివరాలు|బుక్/.test(lower) || /\?|ఎంత|ధర|రేటు|ఎలా|ఎప్పుడు|కాంటాక్ట్|వివరాలు|బుక్/.test(source);
  const complaint = rating <= 2 || /\b(bad|poor|worst|disappointed|delay|late|not good|issue|problem|waste|unhappy|unsatisfied|broken|చెడు|బాగోలేదు|ఆలస్యం|సమస్య|నచ్చలేదు)\b/i.test(source);
  const suggestion = /\b(suggest|suggestion|improve|improvement|could|should|add|change|better|consider|recommend|చేర్చండి|మార్చండి|మెరుగుపరచండి|బాగుంటుంది)\b/i.test(source);
  const positive = rating >= 4 || /\b(super|excellent|amazing|awesome|great|good|love|loved|fantastic|perfect|బాగుంది|సూపర్|చాలా బాగుంది|నచ్చింది)\b/i.test(source);
  const type: FeedbackResponseType = enquiry ? 'enquiry' : complaint ? 'complaint' : suggestion ? 'suggestion' : positive ? 'positive' : 'general';
  const replies: Record<FeedbackLanguage, Record<FeedbackResponseType, string>> = {
    te: {
      positive: 'మీ అభిప్రాయాన్ని పంచుకున్నందుకు చాలా ధన్యవాదాలు! మా పని మీకు నచ్చినందుకు సంతోషంగా ఉంది. మీ ప్రోత్సాహం మాకు ఎంతో విలువైనది.',
      suggestion: 'మీ విలువైన సూచనకు ధన్యవాదాలు. దీన్ని పరిశీలించి MAP132 DIGITALS అనుభవాన్ని మరింత మెరుగుపరచడానికి ప్రయత్నిస్తాము.',
      complaint: 'మీ అనుభవం మీ అంచనాలకు తగ్గట్టుగా లేకపోవడం బాధాకరం. సమస్యను తెలియజేసినందుకు ధన్యవాదాలు. దయచేసి మమ్మల్ని సంప్రదించండి; దాన్ని పరిష్కరించడానికి ప్రయత్నిస్తాము.',
      enquiry: 'మమ్మల్ని సంప్రదించినందుకు ధన్యవాదాలు! ధరలు, వివరాలు లేదా బుకింగ్ కోసం దయచేసి మా WhatsApp లేదా ఇమెయిల్ ద్వారా సంప్రదించండి. మీ అవసరాన్ని బట్టి సహాయం చేస్తాము.',
      general: 'మీ అభిప్రాయాన్ని పంచుకున్నందుకు ధన్యవాదాలు. మీ మాటలు మా సేవలను మెరుగుపరచడంలో సహాయపడతాయి.'
    },
    'te-latn': {
      positive: 'Maa feedback share chesinanduku chala thanks! Maa work meeku nachinanduku santosham. Mee support maaku chala valuable.',
      suggestion: 'Mee valuable suggestion ki thanks! Dinni consider chesi MAP132 DIGITALS experience ni inka improve cheyadaniki try chestham.',
      complaint: 'Mee experience mee expectations ki taggattu lekapovadam maaku badha ga undi. Issue ni share chesinanduku thanks. Dayachesi mammalni contact cheyyandi; resolve cheyadaniki try chestham.',
      enquiry: 'Mammalni contact chesinanduku thanks! Pricing, details leka booking kosam dayachesi maa WhatsApp leka email dwara reach out avvandi. Mee requirement batti assist chestham.',
      general: 'Mee feedback share chesinanduku thanks! Mee abhiprayam maa service ni improve cheyadaniki help avuthundi.'
    },
    hi: {
      positive: 'अपना अनुभव साझा करने के लिए बहुत धन्यवाद! आपको हमारा काम पसंद आया, यह जानकर खुशी हुई। आपका समर्थन हमारे लिए बहुत मायने रखता है।',
      suggestion: 'आपके उपयोगी सुझाव के लिए धन्यवाद। हम इस पर विचार करेंगे और MAP132 DIGITALS के अनुभव को बेहतर बनाने की कोशिश करेंगे।',
      complaint: 'आपका अनुभव आपकी उम्मीदों के अनुसार नहीं रहा, इसके लिए हमें खेद है। कृपया हमसे संपर्क करें ताकि हम समस्या को समझकर समाधान कर सकें।',
      enquiry: 'हमसे संपर्क करने के लिए धन्यवाद! कीमत, जानकारी या बुकिंग के लिए कृपया WhatsApp या ईमेल के माध्यम से संपर्क करें।',
      general: 'अपना फीडबैक साझा करने के लिए धन्यवाद। इससे हमें अपनी सेवाओं को बेहतर बनाने में मदद मिलती है।'
    },
    en: {
      positive: 'Thank you for your valuable feedback! We’re glad you enjoyed the experience. Your support means a lot to MAP132 DIGITALS.',
      suggestion: 'Thank you for the thoughtful suggestion. We’ll consider it as we continue improving the MAP132 DIGITALS experience.',
      complaint: 'We’re sorry your experience did not meet expectations. Thank you for bringing this to our attention. Please reach out so we can understand the issue and work toward a resolution.',
      enquiry: 'Thanks for reaching out! For pricing, availability or project details, please contact us through our WhatsApp or email links so we can understand your requirements and assist you.',
      general: 'Thank you for taking the time to share your feedback. Your comments help us keep improving.'
    }
  };
  return { language, type, reply: replies[language][type], publishable: type !== 'enquiry' };
}
