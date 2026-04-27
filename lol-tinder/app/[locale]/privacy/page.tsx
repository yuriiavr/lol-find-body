'use client'

import Link from "next/link";
import { ArrowLeft, Shield, Eye, Database, Lock, Trash2, Mail, ExternalLink } from "lucide-react";
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

export default function PrivacyPage() {
  const t = useTranslations('PrivacyPage');
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
              <Shield size={24} className="text-[rgb(var(--accent-color))]" />
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
        <Section icon={Eye} title={t('sections.collection.title')}>
          <p><span className="text-white font-bold">{t('sections.collection.discord.title')}</span> {t('sections.collection.discord.text')}</p>
          <p><span className="text-white font-bold">{t('sections.collection.riot.title')}</span> {t('sections.collection.riot.text')}</p>
          <p><span className="text-white font-bold">{t('sections.collection.profile.title')}</span> {t('sections.collection.profile.text')}</p>
          <p><span className="text-white font-bold">{t('sections.collection.usage.title')}</span> {t('sections.collection.usage.text')}</p>
          <p><span className="text-white font-bold">{t('sections.collection.messages.title')}</span> {t('sections.collection.messages.text')}</p>
        </Section>

        <Section icon={Database} title={t('sections.usage.title')}>
          <p>{t('sections.usage.intro')}</p>
          <ul className="space-y-2 mt-2">
            {t.raw('sections.usage.list').map((item: string) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-[rgb(var(--accent-color))] mt-0.5 font-black">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4">
            <span className="text-white font-bold">{t('sections.usage.noSell')}</span>
          </p>
        </Section>

        <Section icon={Lock} title={t('sections.storage.title')}>
          <p>{t('sections.storage.p1')}</p>
          <p>{t('sections.storage.p2')}</p>
          <p>{t('sections.storage.p3')}</p>
          <p>{t('sections.storage.p4')}</p>
        </Section>

        <Section icon={Eye} title={t('sections.visibility.title')}>
          <p>{t('sections.visibility.p1')}</p>
          <p>{t('sections.visibility.p2')}</p>
          <p>{t('sections.visibility.p3')}</p>
        </Section>

        <Section icon={Trash2} title={t('sections.retention.title')}>
          <p>{t('sections.retention.p1')}</p>
          <p>{t('sections.retention.p2')}</p>
          <p>{t('sections.retention.p3')}</p>
        </Section>

        <Section icon={Shield} title={t('sections.thirdParty.title')}>
          <div className="space-y-3">
            {[
              { id: 'riot', href: "https://www.riotgames.com/en/privacy-notice" },
              { id: 'discord', href: "https://discord.com/privacy" },
              { id: 'supabase', href: "https://supabase.com/privacy" },
              { id: 'vercel', href: "https://vercel.com/legal/privacy-policy" },
            ].map(({ id, href }) => (
              <div key={id} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-bold text-xs uppercase tracking-widest">{t(`sections.thirdParty.services.${id}.name`)}</span>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-[rgb(var(--accent-color))] transition-colors">
                    {t('sections.thirdParty.policyLink')} <ExternalLink size={10} />
                  </a>
                </div>
                <p className="text-zinc-500 text-xs">{t(`sections.thirdParty.services.${id}.desc`)}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs">
            {t('sections.thirdParty.disclaimer')}
          </p>
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
            <Link href="/terms" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-[rgb(var(--accent-color))] transition-colors">
              {t('footer.terms')}
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