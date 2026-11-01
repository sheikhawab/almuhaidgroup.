export type InspectionItem = {
  id: string
  ar: string
  en: string
}

export const inspectionItems: InspectionItem[] = [
  {
    id: "greenhouses",
    ar: "هل البيوت الزجاجية المحمية نظيفة وتعمل بشكل سليم؟",
    en: "Are the glass greenhouses clean and working properly?",
  },
  {
    id: "engineering-design",
    ar: "هل يتم تنفيذ المشروع وفق التصميم الهندسي المعتمد؟",
    en: "Is the project being built according to the approved engineering design?",
  },
  {
    id: "cybersecurity",
    ar: "هل أنظمة الموقع محمية بإجراءات الأمن السيبراني؟",
    en: "Are the site systems protected by cybersecurity measures?",
  },
  {
    id: "residential-units",
    ar: "هل الوحدات السكنية مطابقة لمعايير الجودة؟",
    en: "Do the residential units meet the quality standards?",
  },
  {
    id: "lab-equipment",
    ar: "هل أجهزة المختبر الطبي نظيفة وجاهزة للاستخدام؟",
    en: "Is the medical laboratory equipment clean and ready for use?",
  },
]
