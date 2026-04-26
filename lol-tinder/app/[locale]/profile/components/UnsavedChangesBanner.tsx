import { motion, AnimatePresence } from "framer-motion";
import { memo } from "react";
import { useTranslations } from "next-intl";

interface UnsavedChangesBannerProps {
  isDirty: boolean;
  onSave: () => void;
}

const UnsavedChangesBanner = memo(({ isDirty, onSave }: UnsavedChangesBannerProps) => {
  const t = useTranslations('ProfilePage.editor');

  return (
    <AnimatePresence>
      {isDirty && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] w-[90%] max-w-2xl"
        >
          <div className="bg-zinc-900/90 backdrop-blur-xl border border-[rgb(var(--accent-color)/0.3)] p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-6">
            <div className="flex items-center gap-3 ml-2">
              <div className="w-2 h-2 rounded-full bg-[rgb(var(--accent-color))] animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-200">
                {t('unsavedChanges')}
              </p>
            </div>
            <button 
              onClick={onSave}
              className="bg-[rgb(var(--accent-color))] hover:brightness-110 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all active:scale-95 shadow-lg shadow-[rgb(var(--accent-color)/0.2)]"
            >
              {t('saveNow')}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default UnsavedChangesBanner;