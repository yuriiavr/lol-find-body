'use client'

import Link from "next/link";
import { ArrowLeft, FileText, UserCheck, Ban, AlertTriangle, Scale, RefreshCw, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <section className="border-b border-white/5 pb-12 mb-12 last:border-0 last:pb-0 last:mb-0">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-xl bg-[rgb(var(--accent-color)/0.1)] border border-[rgb(var(--accent-color)/0.2)]">
        <Icon size={16} className="text-[rgb(var(--accent-color))]" />
      </div>
      <h2 className="text-lg font-black uppercase tracking-tight text-white">{title}</h2>
    </div>
    <div className="space-y-4 text-sm text-zinc-400 leading-relaxed pl-11">{children}</div>
  </section>
);

const Rule = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2">
    <span className="text-[rgb(var(--accent-color))] mt-0.5 font-black flex-shrink-0">→</span>
    <span>{children}</span>
  </li>
);

export default function TermsPage() {
  const t = useTranslations('TermsPage');
  const lastUpdated = "April 26, 2026";

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-slate-50">
      {/* Header */}
      <div className="border-b border-white/5 bg-[rgb(var(--bg-secondary)/0.5)] backdrop-blur-lg">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-[rgb(var(--accent-color))] transition-colors mb-8 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            {t('backToApp')}
          </Link>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-[rgb(var(--accent-color)/0.1)] border border-[rgb(var(--accent-color)/0.2)] mt-1">
              <FileText size={24} className="text-[rgb(var(--accent-color))]" />
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter bg-gradient-to-r from-[rgb(var(--accent-color))] to-zinc-500 bg-clip-text text-transparent">
                {t('header.title')}
              </h1>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">
                {t('header.lastUpdated', { date: lastUpdated })}
              </p>
            </div>
          </div>

          <p className="mt-6 text-zinc-400 text-sm leading-relaxed border-l-2 border-[rgb(var(--accent-color)/0.4)] pl-4">
            {t('header.intro')}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Section icon={UserCheck} title={t('sections.eligibility.title')}>
          <p>{t.rich('sections.eligibility.p1', { white: (chunks) => <span className="text-white font-bold">{chunks}</span> })}</p>
          <p>{t('sections.eligibility.p2')}</p>
          <p>{t('sections.eligibility.p3')}</p>
          <p>{t('sections.eligibility.p4')}</p>
        </Section>

        <Section icon={UserCheck} title={t('sections.acceptableUse.title')}>
          <p>{t('sections.acceptableUse.p1')}</p>
          <ul className="space-y-2 mt-2 mb-6">
            {t.raw('sections.acceptableUse.rules').map((item: string) => (
              <Rule key={item}>{item}</Rule>
            ))}
          </ul>
        </Section>

        <Section icon={Ban} title={t('sections.prohibitedConduct.title')}>
          <p>{t('sections.prohibitedConduct.p1')}</p>
          <ul className="space-y-2 mt-2">
            {t.raw('sections.prohibitedConduct.rules').map((item: string) => (
              <Rule key={item}>{item}</Rule>
            ))}
          </ul>
          <p className="mt-4">
            {t.rich('sections.prohibitedConduct.banNotice', { white: (chunks) => <span className="text-white font-bold">{chunks}</span> })}
          </p>
        </Section>

        <Section icon={AlertTriangle} title={t('sections.riotData.title')}>
          <p>{t.rich('sections.riotData.p1', { white: (chunks) => <span className="text-white font-bold">{chunks}</span> })}</p>
          <ul className="space-y-2 mt-2">
            {t.raw('sections.riotData.rules').map((item: string) => (
              <Rule key={item}>{item}</Rule>
            ))}
          </ul>
          <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <p className="text-amber-400/80 text-xs font-bold uppercase tracking-widest mb-1">{t('sections.riotData.notice.title')}</p>
            <p className="text-amber-300/60 text-xs">
              {t('sections.riotData.notice.text')}
            </p>
          </div>
        </Section>

        <Section icon={FileText} title={t('sections.userContent.title')}>
          <p>{t('sections.userContent.p1')}</p>
          <p>{t('sections.userContent.p2')}</p>
          <ul className="space-y-2 mt-2">
            {t.raw('sections.userContent.rules').map((item: string) => (
              <Rule key={item}>{item}</Rule>
            ))}
          </ul>
          <p className="mt-4">{t('sections.userContent.removalNotice')}</p>
        </Section>

        <Section icon={Scale} title={t('sections.liability.title')}>
          <p>{t.rich('sections.liability.p1', { white: (chunks) => <span className="text-white font-bold">{chunks}</span> })}</p>
          <p>{t('sections.liability.p2')}</p>
          <p>{t('sections.liability.p3')}</p>
          <p>{t('sections.liability.p4')}</p>
        </Section>

        <Section icon={RefreshCw} title={t('sections.changes.title')}>
          <p>{t('sections.changes.p1')}</p>
          <p>{t('sections.changes.p2')}</p>
          <p>{t('sections.changes.p3')}</p>
        </Section>

        <Section icon={Mail} title={t('sections.contact.title')}>
          <p>{t('sections.contact.p1')}</p>
          <div className="mt-4 p-4 bg-[rgb(var(--accent-color)/0.05)] border border-[rgb(var(--accent-color)/0.15)] rounded-xl">
            <p className="text-white font-bold text-sm">{t('sections.contact.support')}</p>
            <a href="mailto:rematch.support@gmail.com" className="text-[rgb(var(--accent-color))] text-sm hover:underline">
              rematch.support@gmail.com
            </a>
          </div>
          <p className="mt-4">{t('sections.contact.p2')}</p>
        </Section>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-[rgb(var(--accent-color))] transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-[rgb(var(--accent-color))] transition-colors">
              {t('footer.backToApp')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}