/** Official UP districts as of 2026: 75 districts in 18 divisions. Codes already in the
 *  prototype stay put so existing cases do not break. New rows use unused two-letter codes. */
export const DISTRICTS: { code: string; hi: string; en: string }[] = [
  { code: "15", hi: "आगरा", en: "Agra" },
  { code: "28", hi: "अलीगढ़", en: "Aligarh" },
  { code: "AN", hi: "अम्बेडकर नगर", en: "Ambedkar Nagar" },
  { code: "AM", hi: "अमेठी", en: "Amethi" },
  { code: "61", hi: "अयोध्या", en: "Ayodhya" },
  { code: "AZ", hi: "आज़मगढ़", en: "Azamgarh" },
  { code: "BB", hi: "बाराबंकी", en: "Barabanki" },
  { code: "44", hi: "बरेली", en: "Bareilly" },
  { code: "BS", hi: "बस्ती", en: "Basti" },
  { code: "GB", hi: "गाज़ियाबाद", en: "Ghaziabad" },
  { code: "GN", hi: "गौतम बुद्ध नगर", en: "Gautam Buddha Nagar" },
  { code: "13", hi: "गोरखपुर", en: "Gorakhpur" },
  { code: "06", hi: "हाथरस", en: "Hathras" },
  { code: "31", hi: "झाँसी", en: "Jhansi" },
  { code: "70", hi: "कानपुर नगर", en: "Kanpur Nagar" },
  { code: "KD", hi: "कानपुर देहात", en: "Kanpur Dehat" },
  { code: "72", hi: "लखनऊ", en: "Lucknow" },
  { code: "18", hi: "मथुरा", en: "Mathura" },
  { code: "55", hi: "मेरठ", en: "Meerut" },
  { code: "MB", hi: "मुरादाबाद", en: "Moradabad" },
  { code: "50", hi: "प्रयागराज", en: "Prayagraj" },
  { code: "RB", hi: "रायबरेली", en: "Raebareli" },
  { code: "SH", hi: "सहारनपुर", en: "Saharanpur" },
  { code: "ST", hi: "सीतापुर", en: "Sitapur" },
  { code: "UN", hi: "उन्नाव", en: "Unnao" },
  { code: "67", hi: "वाराणसी", en: "Varanasi" },
  { code: "OT", hi: "सूची में नहीं / अन्य", en: "Other / not listed" },
  { code: "OS", hi: "उत्तर प्रदेश के बाहर", en: "Outside Uttar Pradesh" },
];

export function districtHi(code: string): string {
  return DISTRICTS.find((d) => d.code === code)?.hi ?? `जिला कोड ${code}`;
}
export function districtEn(code: string): string {
  return DISTRICTS.find((d) => d.code === code)?.en ?? `District ${code}`;
}
