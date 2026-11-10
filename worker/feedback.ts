export type FeedbackResponseType = 'positive' | 'suggestion' | 'complaint' | 'enquiry' | 'general';
export type FeedbackLanguage = 'te' | 'te-latn' | 'hi' | 'en';

type FeedbackTopic =
  | 'editing' | 'colour' | 'wedding' | 'audio' | 'delivery'
  | 'communication' | 'website' | 'pricing' | 'design';

const topicRules: Array<[FeedbackTopic, RegExp]> = [
  ['editing', /\b(edit|editing|video|videos|trailer|trailers|montage|reel|reels|shorts)\b|ఎడిటింగ్|వీడియో|ట్రైలర్|రీల్స్|वीडियो|एडिटिंग|ट्रेलर|रील्स/i],
  ['colour', /\b(colou?r|grading|colour grading|color grading|tone|visuals)\b|కలర్|గ్రేడింగ్|రంగులు|कलर|ग्रेडिंग|रंग/i],
  ['wedding', /\b(wedding|marriage|bride|groom|birthday)\b|పెళ్లి|వెడ్డింగ్|వివాహం|పుట్టినరోజు|शादी|विवाह|जन्मदिन/i],
  ['audio', /\b(audio|sound|music|song|voice|mixing)\b|ఆడియో|సౌండ్|మ్యూజిక్|పాట|శబ్దం|ऑडियो|आवाज़|संगीत|गाना/i],
  ['delivery', /\b(delivery|deadline|delay|late|timely|time)\b|డెలివరీ|ఆలస్యం|సమయం|త్వరగా|देरी|समय|डिलीवरी/i],
  ['communication', /\b(communicat|response|reply|support|contact|cooperation)\b|స్పందన|సమాధానం|సపోర్ట్|సంప్రదింపు|जवाब|सहयोग|संपर्क/i],
  ['website', /\b(website|site|navigation|mobile|desktop|page|loading|layout)\b|వెబ్‌సైట్|సైట్|నావిగేషన్|మొబైల్|పేజీ|वेबसाइट|साइट|मोबाइल|पेज/i],
  ['pricing', /\b(price|pricing|cost|charge|rate|budget|affordable)\b|ధర|రేటు|ఖర్చు|చార్జ్|कीमत|दर|खर्च/i],
  ['design', /\b(design|thumbnail|poster|title|logo|graphic|animation)\b|డిజైన్|థంబ్‌నెయిల్|పోస్టర్|లోగో|యానిమేషన్|डिज़ाइन|थंबनेल|पोस्टर|लोगो/i],
];

const topicText: Record<FeedbackLanguage, Record<FeedbackTopic, string>> = {
  te: {
    editing: 'వీడియో ఎడిటింగ్ గురించి',
    colour: 'కలర్ గ్రేడింగ్ మరియు విజువల్స్ గురించి',
    wedding: 'వెడ్డింగ్ మరియు ప్రత్యేక వేడుకల వీడియోల గురించి',
    audio: 'ఆడియో మరియు మ్యూజిక్ గురించి',
    delivery: 'డెలివరీ సమయం గురించి',
    communication: 'మా కమ్యూనికేషన్ మరియు స్పందన గురించి',
    website: 'వెబ్‌సైట్ అనుభవం గురించి',
    pricing: 'ధరలు మరియు బడ్జెట్ గురించి',
    design: 'డిజైన్ మరియు గ్రాఫిక్స్ గురించి',
  },
  'te-latn': {
    editing: 'video editing gurinchi',
    colour: 'colour grading mariyu visuals gurinchi',
    wedding: 'wedding mariyu special event videos gurinchi',
    audio: 'audio mariyu music gurinchi',
    delivery: 'delivery timing gurinchi',
    communication: 'maa communication mariyu response gurinchi',
    website: 'website experience gurinchi',
    pricing: 'pricing mariyu budget gurinchi',
    design: 'design mariyu graphics gurinchi',
  },
  hi: {
    editing: 'वीडियो एडिटिंग के बारे में',
    colour: 'कलर ग्रेडिंग और विज़ुअल्स के बारे में',
    wedding: 'शादी और खास समारोह के वीडियो के बारे में',
    audio: 'ऑडियो और म्यूज़िक के बारे में',
    delivery: 'डिलीवरी के समय के बारे में',
    communication: 'हमारे संवाद और जवाब के बारे में',
    website: 'वेबसाइट के अनुभव के बारे में',
    pricing: 'कीमत और बजट के बारे में',
    design: 'डिज़ाइन और ग्राफ़िक्स के बारे में',
  },
  en: {
    editing: 'the video editing',
    colour: 'the colour grading and visuals',
    wedding: 'the wedding and special-event videos',
    audio: 'the audio and music',
    delivery: 'the delivery timing',
    communication: 'our communication and response',
    website: 'the website experience',
    pricing: 'the pricing and budget',
    design: 'the design and graphics',
  },
};

const replies: Record<FeedbackLanguage, Record<FeedbackResponseType, string>> = {
  te: {
    positive: 'మీ అభిప్రాయాన్ని పంచుకున్నందుకు ధన్యవాదాలు. మా పని మీకు నచ్చినందుకు సంతోషంగా ఉంది. మీ ప్రోత్సాహం మాకు ఎంతో విలువైనది.',
    suggestion: 'మీ విలువైన సూచనకు ధన్యవాదాలు. దీన్ని పరిశీలించి MAP132 DIGITALS అనుభవాన్ని మెరుగుపరచడానికి ప్రయత్నిస్తాము.',
    complaint: 'మీ అనుభవం అంచనాలకు తగ్గట్టుగా లేకపోవడం బాధాకరం. సమస్యను తెలియజేసినందుకు ధన్యవాదాలు. దాన్ని అర్థం చేసుకుని పరిష్కరించడానికి ప్రయత్నిస్తాము.',
    enquiry: 'మమ్మల్ని సంప్రదించినందుకు ధన్యవాదాలు. ధరలు, వివరాలు లేదా బుకింగ్ కోసం మా WhatsApp లేదా ఇమెయిల్ ద్వారా సంప్రదించండి.',
    general: 'మీ అభిప్రాయాన్ని పంచుకున్నందుకు ధన్యవాదాలు. మీ మాటలను మేము పరిగణనలోకి తీసుకుంటాము.',
  },
  'te-latn': {
    positive: 'Maa feedback share chesinanduku chala thanks! Mee work experience nachindani teliyadam santosham. Mee support maaku chala valuable.',
    suggestion: 'Mee valuable suggestion ki thanks! Dinni consider chesi MAP132 DIGITALS experience ni improve cheyadaniki try chestham.',
    complaint: 'Mee experience expectations ki taggattu lekapovadam maaku badha ga undi. Issue ni share chesinanduku thanks. Danni artham chesukoni resolve cheyadaniki try chestham.',
    enquiry: 'Mammalni contact chesinanduku thanks! Pricing, details leka booking kosam maa WhatsApp leka email dwara reach out avvandi.',
    general: 'Mee feedback share chesinanduku thanks! Mee abhiprayanni memu consider chestham.',
  },
  hi: {
    positive: 'अपना अनुभव साझा करने के लिए धन्यवाद! आपको हमारा काम पसंद आया, यह जानकर खुशी हुई। आपका समर्थन हमारे लिए मायने रखता है।',
    suggestion: 'आपके उपयोगी सुझाव के लिए धन्यवाद। हम इस पर विचार करके MAP132 DIGITALS के अनुभव को बेहतर बनाने की कोशिश करेंगे।',
    complaint: 'आपका अनुभव उम्मीदों के अनुसार नहीं रहा, इसके लिए हमें खेद है। समस्या बताने के लिए धन्यवाद। हम इसे समझकर समाधान की कोशिश करेंगे।',
    enquiry: 'हमसे संपर्क करने के लिए धन्यवाद। कीमत, जानकारी या बुकिंग के लिए कृपया WhatsApp या ईमेल के माध्यम से संपर्क करें।',
    general: 'अपना फीडबैक साझा करने के लिए धन्यवाद। हम आपकी बात को ध्यान में रखेंगे।',
  },
  en: {
    positive: 'Thank you for sharing your feedback. We’re glad the experience made a positive impression. Your support means a lot to MAP132 DIGITALS.',
    suggestion: 'Thank you for the thoughtful suggestion. We’ll consider it as we continue improving the MAP132 DIGITALS experience.',
    complaint: 'We’re sorry your experience did not meet expectations. Thank you for bringing this to our attention. We’ll review the concern and work toward a resolution.',
    enquiry: 'Thanks for reaching out. For pricing, availability or project details, please contact us through our WhatsApp or email links so we can assist you.',
    general: 'Thank you for taking the time to share your feedback. We appreciate you helping us improve.',
  },
};

function addTopicContext(reply: string, language: FeedbackLanguage, type: FeedbackResponseType, topic?: FeedbackTopic) {
  if (!topic) return reply;
  const detail = topicText[language][topic];
  const context: Record<FeedbackLanguage, Record<FeedbackResponseType, string>> = {
    te: {
      positive: ` మీరు ప్రత్యేకంగా ${detail} ప్రస్తావించినందుకు ధన్యవాదాలు.`,
      suggestion: ` ${detail} విషయంలో మీ సూచనను పరిశీలిస్తాము.`,
      complaint: ` మీరు పేర్కొన్న ${detail} సమస్యను ప్రత్యేకంగా పరిశీలిస్తాము.`,
      enquiry: ` మీ ప్రశ్న ${detail}కు సంబంధించినదని అర్థమైంది.`,
      general: ` మీరు ${detail} గురించి చెప్పిన విషయాన్ని గమనించాము.`,
    },
    'te-latn': {
      positive: ` ${detail} gurinchi meeru mention chesinanduku thanks.`,
      suggestion: ` ${detail} vishayamlo mee suggestion ni consider chestham.`,
      complaint: ` Meeru mention chesina ${detail} issue ni review chestham.`,
      enquiry: ` Mee enquiry ${detail} gurinchi ani artham ayyindi.`,
      general: ` Meeru ${detail} gurinchi cheppina point ni note chesukunnam.`,
    },
    hi: {
      positive: ` आपने खास तौर पर ${detail} का ज़िक्र किया, इसके लिए धन्यवाद।`,
      suggestion: ` ${detail} से जुड़ा आपका सुझाव हम ध्यान में रखेंगे।`,
      complaint: ` आपने ${detail} के बारे में जो समस्या बताई है, हम उसकी समीक्षा करेंगे।`,
      enquiry: ` आपका सवाल ${detail} से जुड़ा है, यह समझ आ गया।`,
      general: ` आपने ${detail} के बारे में जो बात कही, हमने उसे ध्यान में रखा है।`,
    },
    en: {
      positive: ` We especially appreciate your comments about ${detail}.`,
      suggestion: ` We’ll take your suggestion about ${detail} into consideration.`,
      complaint: ` We’ll specifically review the concern you raised about ${detail}.`,
      enquiry: ` We understand your enquiry is about ${detail}.`,
      general: ` We’ve taken note of what you shared about ${detail}.`,
    },
  };
  return reply + context[language][type];
}

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
  const topic = topicRules.find(([, pattern]) => pattern.test(source))?.[0];
  return {
    language,
    type,
    reply: addTopicContext(replies[language][type], language, type, topic),
    publishable: type !== 'enquiry',
  };
}
