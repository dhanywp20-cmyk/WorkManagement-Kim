'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

import { User, AdminPanelModalProps } from './shared';
import { ModalPortal } from '@/components/shared';
import { muatKelompok, namaKelompokPTS, cariKelompok } from '@/lib/kelompok';

import { StripInfo } from './modal-bersama';
import { AccountSettingsInline } from './modal-akun';
import { UserManagementInline } from './modal-user';
import { BrandPicSettingInline } from './modal-brand-pic';
import { MerekSettingInline } from './modal-merek';
import { KelompokSettingInline } from './modal-kelompok';
import { IntegrasiInline } from './modal-integrasi';

// AdminPanelModal (unified: Settings + User Management + PIC Brand)

export function AdminPanelModal({ initialTab, onClose }: AdminPanelModalProps) {
  const [activeSection, setActiveSection] = useState<'settings' | 'userManagement' | 'picBrand' | 'merek' | 'kelompok' | 'integrasi'>(initialTab);

  /**
 * Kelompok navigasi - MENGIKUTI CARA ADMIN BERPIKIR, bukan urutan fitur
 * dibuat (lihat master prompt bagian 16). Enam tab sebelumnya berbaris
 * datar tanpa hierarki: "Account Settings", "User Management", "PIC
 * Brand", "KPI Roster", "Dashboard Setting", "Kelompok & Notifikasi" -
 * semuanya sama beratnya secara visual walau maknanya berbeda jauh
 * (empat yang pertama tentang ORANG, satu tentang TAMPILAN, satu
 * tentang NOTIFIKASI).
 *
 * Integrations / Security / System SENGAJA belum jadi kelompok sendiri.
 * Master prompt bagian 4 juga bilang: "JANGAN membuat menu kosong hanya
 * untuk terlihat lengkap." Hari ini tidak ada satu pun pengaturan yang
 * pantas masuk ke sana - WhatsApp masih env var Edge Function, bukan
 * sesuatu yang bisa diatur dari sini (menyusul Phase 6). Kelompok itu
 * ditambahkan PERSIS saat isinya ada, bukan lebih dulu.
 */
const GRUP_NAV: { key: 'organization' | 'appearance' | 'notifications'; label: string }[] = [
  { key: 'organization',  label: 'Organisasi' },
  { key: 'appearance',    label: 'Tampilan' },
  { key: 'notifications', label: 'Notifikasi' },
];

const navItems: { key: 'settings' | 'userManagement' | 'picBrand' | 'merek' | 'kelompok' | 'integrasi'; group: typeof GRUP_NAV[number]['key']; label: string; icon: React.ReactElement; color: string; activeBg: string; activeBorder: string; activeText: string }[] = [
    {
      key: 'settings',
      group: 'organization',
      label: 'Account Settings',
      icon: <svg aria-hidden="true" focusable="false" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      color: '#4338ca', activeBg: 'rgba(99,102,241,0.1)', activeBorder: 'rgba(99,102,241,0.4)', activeText: '#4338ca',
    },
    {
      key: 'userManagement',
      group: 'organization',
      label: 'User Management',
      icon: <svg aria-hidden="true" focusable="false" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      color: '#0f766e', activeBg: 'rgba(13,148,136,0.1)', activeBorder: 'rgba(13,148,136,0.4)', activeText: '#0f766e',
    },
    {
      key: 'picBrand',
      group: 'organization',
      label: 'PIC Brand',
      icon: <svg aria-hidden="true" focusable="false" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
      color: '#b45309', activeBg: 'rgba(217,119,6,0.1)', activeBorder: 'rgba(217,119,6,0.4)', activeText: '#b45309',
    },
    {
      key: 'merek',
      group: 'appearance',
      label: 'Dashboard Setting',
      icon: <svg aria-hidden="true" focusable="false" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
      color: '#7e22ce', activeBg: 'rgba(147,51,234,0.1)', activeBorder: 'rgba(147,51,234,0.4)', activeText: '#7e22ce',
    },
    {
      key: 'kelompok',
      group: 'notifications',
      label: 'Kelompok & Notifikasi',
      icon: <svg aria-hidden="true" focusable="false" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
      color: '#be185d', activeBg: 'rgba(219,39,119,0.1)', activeBorder: 'rgba(219,39,119,0.4)', activeText: '#be185d',
    },
    {
      key: 'integrasi',
      group: 'notifications',
      label: 'Integrations',
      icon: <svg aria-hidden="true" focusable="false" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      color: '#0e7490', activeBg: 'rgba(8,145,178,0.1)', activeBorder: 'rgba(8,145,178,0.4)', activeText: '#0e7490',
    },
  ];

  const activeNav = navItems.find(n => n.key === activeSection)!;

  return (
  <ModalPortal>
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm pt-16 px-4 pb-4">
      {/* Di ponsel panel navigasi TIDAK boleh berdiri sebagai kolom kiri: 224px
          dari layar 360px hanya menyisakan seratusan piksel untuk isinya, dan
          tabel di dalamnya jadi terpotong sampai hanya kolom aksi yang terlihat.
          Di sana ia berubah jadi deretan tab mendatar di atas isi. */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col sm:flex-row overflow-hidden border border-slate-200">

        {/* ── LEFT SIDEBAR (ponsel: bilah tab atas) ── */}
        <div className="w-full sm:w-56 flex-shrink-0 flex flex-col border-b sm:border-b-0 sm:border-r border-slate-100" style={{ background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)' }}>
          {/* Sidebar header */}
          <div className="px-4 sm:px-5 py-3 sm:py-5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg aria-hidden="true" focusable="false" className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Admin Panel</p>
                <p className="text-white/40 text-[10px] hidden sm:block">Superadmin Settings</p>
              </div>
            </div>
          </div>

          {/* Nav items - dikelompokkan per GRUP_NAV.
              Ponsel (baris mendatar, ruang sempit): header kelompok dibuang,
              hanya garis vertikal tipis di antara kelompok - menulis
              "ORGANISASI" di atas SATU tombol yang lebarnya sudah pas-pasan
              hanya akan memaksanya membungkus baris kedua.
              Desktop (kolom, ruang cukup): header kelompok tampil penuh,
              karena di sanalah hierarkinya benar-benar terlihat. */}
          <div role="tablist" aria-label="Bagian Admin Panel"
            className="flex-1 p-2 sm:p-3 flex flex-row overflow-x-auto sm:flex-col gap-1 sm:gap-0.5 sm:overflow-y-auto">
            {GRUP_NAV.map((grup, gi) => {
              const items = navItems.filter(n => n.group === grup.key);
              if (items.length === 0) return null;
              return (
                <div key={grup.key} className={`flex flex-row sm:flex-col flex-shrink-0 sm:flex-shrink gap-1 sm:gap-0.5 ${gi > 0 ? 'sm:mt-4 pl-2 sm:pl-0 ml-1 sm:ml-0 border-l sm:border-l-0 border-white/10' : ''}`}>
                  <p className="hidden sm:block px-3 pt-1 pb-1.5 text-[10px] font-bold tracking-widest uppercase text-white/30">
                    {grup.label}
                  </p>
                  {items.map(item => {
                    const isActive = activeSection === item.key;
                    return (
                      <button key={item.key} type="button" role="tab" aria-selected={isActive} onClick={() => setActiveSection(item.key)}
                        className="flex-shrink-0 sm:w-full flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-xl text-left transition-all text-xs sm:text-sm font-semibold whitespace-nowrap"
                        style={isActive
                          ? { background: item.activeBg, border: `1px solid ${item.activeBorder}`, color: item.activeText }
                          : { background: 'transparent', border: '1px solid transparent', color: 'rgba(255,255,255,0.55)' }}
                        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; }}
                        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                        <span className={isActive ? '' : 'opacity-60'}>{item.icon}</span>
                        <span className="sm:truncate">{item.label}</span>
                        {isActive && <div className="hidden sm:block ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color }} />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT CONTENT ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Section header strip */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center gap-2 sm:gap-3 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: activeNav.activeBg, border: `1px solid ${activeNav.activeBorder}`, color: activeNav.activeText }}>
              {activeNav.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">{activeNav.label}</h2>
              <p className="text-slate-500 text-[10px] sm:text-xs hidden sm:block">
                {activeSection === 'settings' && 'Kelola akun user & hak akses menu'}
                {activeSection === 'userManagement' && 'Mapping Atasan, IVP & MVI Account & CC per User'}
                {activeSection === 'picBrand' && 'Mapping Brand PIC per divisi & produk'}
                {activeSection === 'merek' && 'Logo, nama, warna header & tampilan halaman login'}
                {activeSection === 'kelompok' && 'Daftar kelompok kerja & lonceng yang boleh dilihat masing-masing'}
                {activeSection === 'integrasi' && 'Kanal notifikasi (In-App, WhatsApp, Telegram) & event mana lewat kanal mana'}
              </p>
            </div>
            <button aria-label="Tutup" onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all text-slate-400 hover:text-slate-700"
              style={{ background: 'rgba(0,0,0,0.05)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#dc2626'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = ''; }}
              title="Tutup">
              <svg aria-hidden="true" focusable="false" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Embedded content — no backdrop/fixed positioning */}
          <div className="flex-1 overflow-hidden">
            {activeSection === 'settings' && <AccountSettingsInline />}
            {activeSection === 'userManagement' && <UserManagementInline />}
            {activeSection === 'picBrand' && <BrandPicSettingInline />}
            {activeSection === 'merek' && <MerekSettingInline />}
            {activeSection === 'kelompok' && <KelompokSettingInline />}
            {activeSection === 'integrasi' && (
              <div className="h-full overflow-y-auto p-4"><IntegrasiInline /></div>
            )}
          </div>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
}

