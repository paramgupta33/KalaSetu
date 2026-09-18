import { Language } from '../types';

export interface LanguageOption {
  code: Language;
  label: string; // Native name
  englishName: string; // English name
  region: string; // Region or State
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', englishName: 'English', region: 'Pan-India & Global' },
  { code: 'hi', label: 'हिन्दी', englishName: 'Hindi', region: 'उत्तर भारत (North India)' },
  { code: 'mr', label: 'मराठी', englishName: 'Marathi', region: 'महाराष्ट्र (Maharashtra)' },
  { code: 'bn', label: 'বাংলা', englishName: 'Bengali', region: 'পশ্চিমবঙ্গ (West Bengal)' },
  { code: 'ta', label: 'தமிழ்', englishName: 'Tamil', region: 'தமிழ்நாடு (Tamil Nadu)' },
  { code: 'te', label: 'తెలుగు', englishName: 'Telugu', region: 'ఆంధ్ర & తెలంగాణ (AP & Telangana)' },
  { code: 'gu', label: 'ગુજરાતી', englishName: 'Gujarati', region: 'ગુજરાત (Gujarat)' },
  { code: 'kn', label: 'ಕನ್ನಡ', englishName: 'Kannada', region: 'ಕರ್ನಾಟಕ (Karnataka)' },
  { code: 'ml', label: 'മലയാളം', englishName: 'Malayalam', region: 'കേരളം (Kerala)' },
  { code: 'or', label: 'ଓଡ଼ିଆ', englishName: 'Odia', region: 'ଓଡ଼ିଶା (Odisha)' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', englishName: 'Punjabi', region: 'ਪੰਜਾਬ (Punjab)' },
  { code: 'as', label: 'অসমীয়া', englishName: 'Assamese', region: 'অসম (Assam & North East)' },
  { code: 'ur', label: 'اردو', englishName: 'Urdu', region: 'ہندوستان (Pan-India)' },
  { code: 'sa', label: 'संस्कृतम्', englishName: 'Sanskrit', region: 'प्राचीन विरासत (Heritage)' },
  { code: 'bho', label: 'भोजपुरी', englishName: 'Bhojpuri', region: 'बिहार व पूर्वांचल (Bhojpur)' },
];
