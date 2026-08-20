export const DISTRICTS: { code: string; hi: string; en: string }[] = [
  { code: "70", hi: "कानपुर नगर", en: "Kanpur Nagar" },
  { code: "72", hi: "लखनऊ", en: "Lucknow" },
  { code: "50", hi: "प्रयागराज", en: "Prayagraj" },
  { code: "67", hi: "वाराणसी", en: "Varanasi" },
  { code: "55", hi: "मेरठ", en: "Meerut" },
  { code: "13", hi: "गोरखपुर", en: "Gorakhpur" },
  { code: "06", hi: "हाथरस", en: "Hathras" },
  { code: "18", hi: "मथुरा", en: "Mathura" },
  { code: "31", hi: "झाँसी", en: "Jhansi" },
  { code: "44", hi: "बरेली", en: "Bareilly" },
  { code: "28", hi: "अलीगढ़", en: "Aligarh" },
  { code: "61", hi: "अयोध्या", en: "Ayodhya" },
  { code: "OS", hi: "उत्तर प्रदेश के बाहर", en: "Outside Uttar Pradesh" },
];

export function districtHi(code: string): string {
  return DISTRICTS.find((d) => d.code === code)?.hi ?? `जिला कोड ${code}`;
}
