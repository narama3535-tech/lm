import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const WarningBanner: React.FC = () => {
  return (
    <div className="bg-red-900/90 border-b border-red-700 text-white px-4 py-2 text-xs md:text-sm font-medium text-center relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <AlertTriangle size={16} className="text-red-300" />
        <span>
          СТРОГО 18+. ПРОДУКЦИЯ СОДЕРЖИТ НИКОТИН. НИКОТИН ВЫЗЫВАЕТ ЗАВИСИМОСТЬ.
          САЙТ НОСИТ ИСКЛЮЧИТЕЛЬНО ИНФОРМАЦИОННЫЙ ХАРАКТЕР. ПРОДАЖА ОСУЩЕСТВЛЯЕТСЯ ТОЛЬКО В ОФФЛАЙН МАГАЗИНЕ.
          МЫ СОБЛЮДАЕМ ЗАКОНОДАТЕЛЬСТВО РФ.
        </span>
      </div>
    </div>
  );
};