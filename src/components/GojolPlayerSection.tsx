import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import {
  Link2,
  Music,
  Pause,
  Play,
  Plus,
  Repeat,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { toBengaliDigits } from '../data/foundation';

interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  kind: 'audio' | 'youtube';
  src: string; // URL, objectURL, or YouTube video ID
  durationLabel?: string;
  isDefault?: boolean;
}

const DEFAULT_TRACK: AudioTrack = {
  id: 'default-jaane-janaan',
  title: 'জানে জানাঁ — রহমাতুল্লিল আলামিন',
  artist: 'আয়ান সাজাদ · নাতে রাসূল',
  kind: 'audio',
  src: '/assets/aistudio/NAAT__Jaane_Janaan___Ayaan_Sajad____Arif_Mir___Rj_Umar_Nisar_256k__4aa5ed04.mp3',
  durationLabel: '০৫:০২',
  isDefault: true,
};

const BUILTIN_TUNE_TRACK: AudioTrack = {
  id: 'default-seba-tune',
  title: 'মানবতার আহ্বান — শান্ত সুর',
  artist: 'সেবা ফাউন্ডেশন অডিও',
  kind: 'audio',
  src: '/audio/seba-gojol-tune.wav',
  durationLabel: '০:১৬ (লুপ)',
  isDefault: true,
};

const STORAGE_TRACKS_META_KEY = 'seba_gojol_tracks_meta_v1';
const DB_NAME = 'seba_foundation_audio_db';
const STORE_NAME = 'audio_files';

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveAudioBlob(id: string, blob: Blob): Promise<void> {
  try {
    const db = await openAudioDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore IndexedDB unavailable
  }
}

async function getAudioBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openAudioDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve((req.result as Blob) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function deleteAudioBlob(id: string): Promise<void> {
  try {
    const db = await openAudioDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}

function extractYouTubeId(input: string): string | null {
  try {
    const url = new URL(input.trim());
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.slice(1).split('/')[0] || null;
    }
    if (url.hostname.includes('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v) return v;
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'embed' || parts[0] === 'shorts') {
        return parts[1] || null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function formatTimeBn(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '০:০০';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
  return toBengaliDigits(formatted);
}

export function GojolPlayerSection() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const userPausedRef = useRef<boolean>(false);

  const [tracks, setTracks] = useState<AudioTrack[]>([
    DEFAULT_TRACK,
    BUILTIN_TUNE_TRACK,
  ]);
  const [activeTrackId, setActiveTrackId] = useState<string>(DEFAULT_TRACK.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Restore saved tracks from localStorage + IndexedDB on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_TRACKS_META_KEY);
        if (!raw) return;
        const savedMeta = JSON.parse(raw) as Array<
          AudioTrack & { storedInDb?: boolean }
        >;
        if (!Array.isArray(savedMeta)) return;

        const restored: AudioTrack[] = [];
        for (const item of savedMeta) {
          if (item.storedInDb) {
            const blob = await getAudioBlob(item.id);
            if (blob) {
              const objUrl = URL.createObjectURL(blob);
              objectUrlsRef.current.push(objUrl);
              restored.push({ ...item, src: objUrl });
            }
          } else {
            restored.push(item);
          }
        }
        if (!cancelled && restored.length > 0) {
          setTracks([DEFAULT_TRACK, BUILTIN_TUNE_TRACK, ...restored]);
        }
      } catch {
        // ignore storage errors
      }
    })();

    return () => {
      cancelled = true;
      for (const u of objectUrlsRef.current) {
        URL.revokeObjectURL(u);
      }
    };
  }, []);

  const persistCustomTracks = (allTracks: AudioTrack[]) => {
    try {
      const custom = allTracks
        .filter((t) => !t.isDefault)
        .map((t) => ({
          ...t,
          storedInDb: t.kind === 'audio' && t.src.startsWith('blob:'),
          src: t.kind === 'audio' && t.src.startsWith('blob:') ? '' : t.src,
        }));
      localStorage.setItem(STORAGE_TRACKS_META_KEY, JSON.stringify(custom));
    } catch {
      // ignore
    }
  };

  const activeTrack = tracks.find((t) => t.id === activeTrackId) ?? tracks[0];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || activeTrack.kind !== 'audio') return;

    audio.loop = isLooping;
    audio.muted = isMuted;
  }, [isLooping, isMuted, activeTrack.kind]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(0);
    setDuration(0);

    if (activeTrack.kind === 'audio') {
      audio.src = activeTrack.src;
      audio.load();
      if (isPlaying) {
        audio.play().catch(() => setIsPlaying(false));
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrackId]);

  // Auto-play on website open; if browser blocks unmuted autoplay, start on very first user interaction
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let unlocked = false;

    const tryPlay = () => {
      if (unlocked || userPausedRef.current) return;
      audio
        .play()
        .then(() => {
          unlocked = true;
          setIsPlaying(true);
        })
        .catch(() => {
          // Browser blocked autoplay before user gesture; will retry on first interaction
        });
    };

    const onFirstInteraction = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-audio-toggle="true"]')) {
        return;
      }
      tryPlay();
    };

    window.addEventListener('pointerdown', onFirstInteraction, { passive: true });
    window.addEventListener('click', onFirstInteraction, { passive: true });
    window.addEventListener('touchend', onFirstInteraction, { passive: true });
    window.addEventListener('keydown', onFirstInteraction, { passive: true });

    tryPlay();

    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('click', onFirstInteraction);
      window.removeEventListener('touchend', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || activeTrack.kind !== 'audio') return;
    if (!audio.paused) {
      userPausedRef.current = true;
      audio.pause();
      setIsPlaying(false);
    } else {
      userPausedRef.current = false;
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const next = Number(e.target.value);
    if (audio && Number.isFinite(next)) {
      audio.currentTime = next;
      setCurrentTime(next);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);

    if (!file.type.startsWith('audio/')) {
      setFormError('অনুগ্রহ করে সঠিক অডিও ফাইল (.mp3, .wav, .m4a) নির্বাচন করুন।');
      return;
    }

    const id = `gojol-file-${Date.now()}`;
    await saveAudioBlob(id, file);
    const objUrl = URL.createObjectURL(file);
    objectUrlsRef.current.push(objUrl);

    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    const added: AudioTrack = {
      id,
      title: newTitle.trim() || cleanName,
      artist: newArtist.trim() || 'আপনার আপলোড করা গজল',
      kind: 'audio',
      src: objUrl,
    };

    const next = [...tracks, added];
    setTracks(next);
    persistCustomTracks(next);
    setActiveTrackId(added.id);
    setIsPlaying(true);
    setNewTitle('');
    setNewArtist('');
    setNewUrl('');
    setShowAddForm(false);
    e.target.value = '';
  };

  const handleAddUrlTrack = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedUrl = newUrl.trim();
    if (!trimmedUrl) {
      setFormError('অনুগ্রহ করে গজলের ইউটিউব লিঙ্ক বা সরাসরি MP3 লিঙ্ক দিন।');
      return;
    }

    const ytId = extractYouTubeId(trimmedUrl);
    if (ytId) {
      const added: AudioTrack = {
        id: `gojol-yt-${Date.now()}`,
        title: newTitle.trim() || 'ইউটিউব গজল / নাশিদ',
        artist: newArtist.trim() || 'ইউটিউব অডিও',
        kind: 'youtube',
        src: ytId,
      };
      const next = [...tracks, added];
      setTracks(next);
      persistCustomTracks(next);
      setActiveTrackId(added.id);
      setNewTitle('');
      setNewArtist('');
      setNewUrl('');
      setShowAddForm(false);
      return;
    }

    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      const added: AudioTrack = {
        id: `gojol-url-${Date.now()}`,
        title: newTitle.trim() || 'অনলাইন গজল / গান',
        artist: newArtist.trim() || 'অডিও লিঙ্ক',
        kind: 'audio',
        src: trimmedUrl,
      };
      const next = [...tracks, added];
      setTracks(next);
      persistCustomTracks(next);
      setActiveTrackId(added.id);
      setIsPlaying(true);
      setNewTitle('');
      setNewArtist('');
      setNewUrl('');
      setShowAddForm(false);
      return;
    }

    setFormError('সঠিক https:// লিঙ্ক অথবা ইউটিউব লিঙ্ক দিন।');
  };

  const handleRemoveTrack = async (id: string) => {
    const next = tracks.filter((t) => t.id !== id);
    setTracks(next);
    persistCustomTracks(next);
    await deleteAudioBlob(id);
    if (activeTrackId === id) {
      setActiveTrackId(DEFAULT_TRACK.id);
      setIsPlaying(false);
    }
  };

  return (
    <section id="gojol" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
      <audio
        ref={audioRef}
        preload="auto"
        playsInline
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={() => {
          if (!isLooping) setIsPlaying(false);
        }}
      />

      <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-sm font-semibold text-primary">মানবতার সুর ও গজল</span>
            <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              ওয়েবসাইটে গজল বা গান শুনুন ও যুক্ত করুন
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              প্লে বাটনে চাপ দিয়ে শুনতে পারেন অথবা আপনার নিজের ফোনের MP3 গজল কিংবা ইউটিউব গজলের
              লিঙ্ক সরাসরি এখানে যোগ করতে পারেন।
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-input bg-background px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary whitespace-nowrap"
          >
            <Plus className="size-4 text-primary" />
            {showAddForm ? 'ফর্ম বন্ধ করুন' : 'নতুন গজল / গান যোগ করুন'}
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Active Player */}
          <div className="rounded-2xl border border-border bg-background p-5 lg:col-span-7">
            <div className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                <Music className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg font-bold">{activeTrack.title}</p>
                <p className="truncate text-xs text-muted-foreground">{activeTrack.artist}</p>
              </div>
            </div>

            {activeTrack.kind === 'youtube' ? (
              <div className="mt-5 overflow-hidden rounded-xl border border-border bg-black">
                <div className="aspect-video w-full">
                  <iframe
                    src={`https://www.youtube.com/embed/${activeTrack.src}`}
                    title={activeTrack.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="size-full border-0"
                  />
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 16}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    aria-label="অডিও সময়"
                    className="w-full cursor-pointer accent-primary"
                  />
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground tabular-nums">
                    <span>{formatTimeBn(currentTime)}</span>
                    <span>{duration ? formatTimeBn(duration) : activeTrack.durationLabel ?? '০:০০'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      data-audio-toggle="true"
                      onClick={togglePlay}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 font-display text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-105"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="size-4" />
                          বিরতি দিন
                        </>
                      ) : (
                        <>
                          <Play className="size-4" />
                          গজল শুনুন
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsLooping((v) => !v)}
                      aria-label="বারবার বাজান (লুপ)"
                      title="লুপ চালু/বন্ধ"
                      className={`flex size-10 items-center justify-center rounded-full border transition-colors ${
                        isLooping
                          ? 'border-primary bg-primary/15 text-primary-glow'
                          : 'border-input bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Repeat className="size-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsMuted((v) => !v)}
                      aria-label={isMuted ? 'শব্দ চালু করুন' : 'মিউট করুন'}
                      className="flex size-10 items-center justify-center rounded-full border border-input bg-card text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                    </button>
                  </div>

                  <span className="text-xs text-muted-foreground">
                    {isPlaying ? 'চলছে...' : 'চালু করতে প্লে চাপুন'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Playlist & Upload/URL Adder */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-background p-5 lg:col-span-5">
            {showAddForm ? (
              <div className="space-y-4">
                <h3 className="font-display text-base font-bold">আপনার গজল বা গান যুক্ত করুন</h3>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/60 bg-primary/10 px-4 py-3 text-xs font-semibold text-primary-glow transition-colors hover:bg-primary/15"
                  >
                    <Upload className="size-4" />
                    ফোন / কম্পিউটার থেকে MP3 ফাইল আপলোড করুন
                  </button>
                </div>

                <div className="relative flex items-center py-1 text-center text-xs text-muted-foreground">
                  <div className="flex-grow border-t border-border" />
                  <span className="mx-3 shrink-0">অথবা লিঙ্ক দিন</span>
                  <div className="flex-grow border-t border-border" />
                </div>

                <form onSubmit={handleAddUrlTrack} className="space-y-2.5">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="গজলের নাম (যেমন: মন আমার দেহঘড়ি)"
                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    placeholder="শিল্পীর নাম (ঐচ্ছিক)"
                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                  />
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="YouTube লিঙ্ক বা সরাসরি .mp3 লিঙ্ক দিন"
                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                  />
                  {formError && (
                    <p className="text-xs text-red-300">{formError}</p>
                  )}
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-primary py-2.5 text-xs font-bold text-primary-foreground"
                  >
                    <Link2 className="size-3.5" />
                    লিংক থেকে গজল যুক্ত করুন
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-display text-sm font-bold">গজল ও সুরের তালিকা</h3>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {toBengaliDigits(tracks.length)}টি ট্র্যাক
                  </span>
                </div>

                <ul className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
                  {tracks.map((track) => {
                    const selected = track.id === activeTrack.id;
                    return (
                      <li
                        key={track.id}
                        className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 transition-colors ${
                          selected
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card hover:border-primary/40'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveTrackId(track.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-xs font-semibold text-foreground">
                            {track.title}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {track.artist} · {track.kind === 'youtube' ? 'YouTube' : 'Audio'}
                          </p>
                        </button>
                        {!track.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTrack(track.id)}
                            aria-label="মুছে ফেলুন"
                            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-red-300"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTrack.kind === 'audio' && (
        <button
          type="button"
          data-audio-toggle="true"
          onClick={togglePlay}
          aria-label={isPlaying ? 'গজল বিরতি দিন' : 'গজল চালু করুন'}
          className="fixed bottom-4 right-4 z-40 inline-flex h-11 items-center gap-2 rounded-full border border-primary/40 bg-background/95 px-4 text-xs font-semibold text-foreground shadow-card backdrop-blur-md transition-transform hover:scale-105 whitespace-nowrap"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
            {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </span>
          <span>{isPlaying ? 'গজল চলছে · বিরতি' : 'গজল চালু করুন'}</span>
        </button>
      )}
    </section>
  );
}
