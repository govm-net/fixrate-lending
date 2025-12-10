import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 导入翻译文件
import translationEN from '../locales/en/translation.json';
import translationZH from '../locales/zh/translation.json';

// 配置资源文件
const resources = {
  en: {
    translation: translationEN
  },
  zh: {
    translation: translationZH
  }
};

i18n
  .use(initReactI18next) // 初始化 react-i18next
  .init({
    resources,
    lng: 'en', // 默认语言
    fallbackLng: 'en', // 备用语言
    interpolation: {
      escapeValue: false // React 已经安全地处理了 XSS
    }
  });

export default i18n;