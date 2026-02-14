"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { READER_FIT, READER_THEMES, READING_MODES } from "@/lib/constants/site";
import { clamp } from "@/lib/utils/format";
import { useAppStore, useCurrentUser } from "@/stores/app-store";

export default function SettingsPage() {
  const user = useCurrentUser();
  const updateProfile = useAppStore((state) => state.updateProfile);
  const updatePassword = useAppStore((state) => state.updatePassword);
  const readerSettings = useAppStore((state) => state.readerSettings);
  const setReaderSetting = useAppStore((state) => state.setReaderSetting);

  const [profileState, setProfileState] = useState({
    username: user?.username ?? "",
    bio: user?.bio ?? "",
    preferredLocale: user?.preferredLocale ?? "id",
  });

  const [securityState, setSecurityState] = useState({
    currentPassword: "",
    nextPassword: "",
  });

  const [securityMessage, setSecurityMessage] = useState<string | null>(null);

  const canSaveProfile = useMemo(() => profileState.username.trim().length >= 3, [profileState.username]);
  const autoScrollSpeed = clamp(Number(readerSettings.autoScrollSpeed ?? 80), 20, 260);

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <h1 className="font-display text-3xl text-[var(--text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)]">Kelola profil akun, keamanan, dan preferensi reader default.</p>
      </header>

      <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Profile</h2>
        <Input
          value={profileState.username}
          onChange={(event) => setProfileState((prev) => ({ ...prev, username: event.target.value }))}
          placeholder="Username"
        />
        <Textarea value={profileState.bio} onChange={(event) => setProfileState((prev) => ({ ...prev, bio: event.target.value }))} placeholder="Bio" />
        <Select
          value={profileState.preferredLocale}
          onChange={(event) => setProfileState((prev) => ({ ...prev, preferredLocale: event.target.value as "id" | "en" }))}
        >
          <option value="id">Bahasa Indonesia</option>
          <option value="en">English</option>
        </Select>
        <div className="flex justify-end">
          <Button
            disabled={!canSaveProfile}
            onClick={() => {
              updateProfile({
                username: profileState.username,
                bio: profileState.bio,
                preferredLocale: profileState.preferredLocale,
              });
              alert("Profil berhasil diperbarui.");
            }}
          >
            Simpan Profil
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Security</h2>
        <Input
          type="password"
          value={securityState.currentPassword}
          onChange={(event) => setSecurityState((prev) => ({ ...prev, currentPassword: event.target.value }))}
          placeholder="Password saat ini"
        />
        <Input
          type="password"
          value={securityState.nextPassword}
          onChange={(event) => setSecurityState((prev) => ({ ...prev, nextPassword: event.target.value }))}
          placeholder="Password baru"
        />
        {securityMessage ? <p className="text-sm text-[var(--text-secondary)]">{securityMessage}</p> : null}
        <div className="flex justify-end">
          <Button
            onClick={async () => {
              const result = await updatePassword(securityState.currentPassword, securityState.nextPassword);
              if (!result.ok) {
                setSecurityMessage(result.error);
                return;
              }

              setSecurityMessage("Password berhasil diperbarui.");
              setSecurityState({ currentPassword: "", nextPassword: "" });
            }}
          >
            Ubah Password
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Reader Preferences</h2>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="text-[var(--text-secondary)]">Mode</span>
            <Select value={readerSettings.mode} onChange={(event) => setReaderSetting("mode", event.target.value as typeof readerSettings.mode)}>
              {READING_MODES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-[var(--text-secondary)]">Theme</span>
            <Select value={readerSettings.theme} onChange={(event) => setReaderSetting("theme", event.target.value as typeof readerSettings.theme)}>
              {READER_THEMES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-[var(--text-secondary)]">Fit</span>
            <Select value={readerSettings.fit} onChange={(event) => setReaderSetting("fit", event.target.value as typeof readerSettings.fit)}>
              {READER_FIT.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <div className="space-y-2 rounded-xl border border-[var(--border)] p-3">
          <Switch checked={readerSettings.autoNextChapter} onChange={(next) => setReaderSetting("autoNextChapter", next)} label="Auto next chapter" />
          <Switch checked={readerSettings.reduceMotion} onChange={(next) => setReaderSetting("reduceMotion", next)} label="Reduce motion" />
          <Switch
            checked={Boolean(readerSettings.autoScrollEnabled)}
            onChange={(next) => setReaderSetting("autoScrollEnabled", next)}
            label="Auto scroll (Vertical/Webtoon)"
          />

          <label className="space-y-1 text-sm">
            <span className="text-[var(--text-secondary)]">Auto scroll speed ({autoScrollSpeed}px/s)</span>
            <input
              type="range"
              min={20}
              max={260}
              step={10}
              value={autoScrollSpeed}
              onChange={(event) => setReaderSetting("autoScrollSpeed", Number(event.target.value))}
              className="w-full"
            />
          </label>
        </div>
      </section>
    </section>
  );
}
