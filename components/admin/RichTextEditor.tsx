'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Mark, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading3,
  List, ListOrdered, ImagePlus, Undo2, Redo2, RemoveFormatting, Loader2, AlertCircle,
} from 'lucide-react';
import styles from '@/app/admin/admin.module.css';

/**
 * Veličina teksta se NE upisuje kao inline style nego kao jedna od tri fiksne klase.
 * Sanitizer (lib/sanitizeHtml.ts) propušta samo `class="ds-sm|ds-lg|ds-xl"` na <span>,
 * pa proizvoljan CSS ne može da uđe u opis proizvoda.
 */
const TextSize = Mark.create({
  name: 'textSize',

  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).className.match(/^ds-(sm|lg|xl)$/)?.[1] ?? null,
        renderHTML: (attrs) => (attrs.size ? { class: `ds-${attrs.size}` } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[class]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});

const SIZES: { key: string | null; label: string; title: string }[] = [
  { key: 'sm', label: 'A', title: 'Sitno' },
  { key: null, label: 'A', title: 'Normalno' },
  { key: 'lg', label: 'A', title: 'Veliko' },
  { key: 'xl', label: 'A', title: 'Najveće' },
];

interface BtnProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

/** Van komponente: definisana u renderu, React bi je remountovao pri svakom kucanju. */
function Btn({ onClick, active, disabled, title, children }: BtnProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={!!active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // ne gubi selekciju u editoru
      onClick={onClick}
      className={`${styles.editorBtn} ${active ? styles.editorBtnActive : ''}`}
    >
      {children}
    </button>
  );
}

interface Props {
  value: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    // Obavezno u Next-u: bez ovoga contenteditable se renderuje na serveru i puca hidracija
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [3] },
        // Sanitizer ih ne propušta, pa nema svrhe da postoje u editoru
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        code: false,
        link: false,
      }),
      TextSize,
      Image.configure({ allowBase64: false, inline: false }),
    ],
    content: value || '',
    editorProps: {
      attributes: { class: styles.editorContent },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  // Spolja popunjen sadržaj (uvoz sa linka, AI generator) mora da se odrazi ovde
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    // namerno bez `editor` u zavisnostima - setContent bi se vrteo u krug
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const uploadImage = useCallback(
    async (file: File) => {
      if (!editor) return;
      setUploading(true);
      setError(null);
      try {
        const body = new FormData();
        body.append('files', file);
        const res = await fetch('/api/admin/upload', { method: 'POST', body });
        const json = await res.json();
        const url = json.data?.[0]?.url;
        if (!res.ok || !url) throw new Error(json.errors?.[0]?.reason || json.error || 'Otpremanje nije uspelo.');
        editor.chain().focus().setImage({ src: url }).run();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Otpremanje nije uspelo.');
      } finally {
        setUploading(false);
      }
    },
    [editor]
  );

  if (!editor) {
    return <div className={styles.editorShell}><div className={styles.editorLoading}>Učitavanje editora…</div></div>;
  }

  const currentSize = editor.getAttributes('textSize').size ?? null;

  return (
    <div className={styles.editorShell}>
      <div className={styles.editorToolbar}>
        <Btn title="Podebljano" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={15} />
        </Btn>
        <Btn title="Kurziv" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={15} />
        </Btn>
        <Btn title="Podvučeno" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={15} />
        </Btn>
        <Btn title="Precrtano" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={15} />
        </Btn>

        <span className={styles.editorSep} />

        {SIZES.map((s) => (
          <Btn
            key={s.title}
            title={s.title}
            active={currentSize === s.key}
            onClick={() =>
              s.key
                ? editor.chain().focus().setMark('textSize', { size: s.key }).run()
                : editor.chain().focus().unsetMark('textSize').run()
            }
          >
            <span className={styles[`editorSize_${s.key ?? 'md'}`]}>{s.label}</span>
          </Btn>
        ))}

        <span className={styles.editorSep} />

        <Btn title="Podnaslov sekcije" active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={15} />
        </Btn>
        <Btn title="Lista sa tačkama" active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={15} />
        </Btn>
        <Btn title="Numerisana lista" active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={15} />
        </Btn>

        <span className={styles.editorSep} />

        <Btn title="Ubaci sliku ili GIF" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? <Loader2 size={15} className={styles.uploaderSpin} /> : <ImagePlus size={15} />}
        </Btn>
        <Btn title="Očisti formatiranje"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          <RemoveFormatting size={15} />
        </Btn>

        <span className={styles.editorSpacer} />

        <Btn title="Poništi" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 size={15} />
        </Btn>
        <Btn title="Ponovi" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 size={15} />
        </Btn>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadImage(file);
            e.target.value = '';
          }}
        />
      </div>

      <EditorContent editor={editor} />

      {error && (
        <div className={styles.editorError}>
          <AlertCircle size={13} /> {error}
        </div>
      )}
    </div>
  );
}
